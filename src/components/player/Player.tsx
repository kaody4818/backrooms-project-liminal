
import { useSphere } from '@react-three/cannon';
import { PointerLockControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Vector3 } from 'three';
import { useGameStore } from '../../store/gameStore';

const SPEED = 5;
const SPRINT_SPEED = 10;
const JUMP_FORCE = 5;

export const Player = ({ position, exitPos }: { position: [number, number, number], exitPos?: [number, number, number] | null }) => {
    const { camera } = useThree();
    const [ref, api] = useSphere(() => ({
        mass: 1,
        type: 'Dynamic',
        position,
        linearDamping: 0,
        angularDamping: 0,
        allowSleep: false,
        fixedRotation: true,
    }));

    const velocity = useRef([0, 0, 0]);
    useEffect(() => api.velocity.subscribe((v) => (velocity.current = v)), [api.velocity]);

    const pos = useRef([0, 0, 0]);
    useEffect(() => api.position.subscribe((p) => (pos.current = p)), [api.position]);

    const smoothedVel = useRef(new Vector3(0, 0, 0));

    // Store
    const { isMenuOpen, isGameOver, isPaused, setPaused } = useGameStore();

    // Pause Detection via Pointer Lock
    useEffect(() => {
        const handlePointerLockChange = () => {
            if (!document.pointerLockElement && !isMenuOpen && !isGameOver) {
                // If lock is lost and we are in-game, pause.
                setPaused(true);
            }
        };

        document.addEventListener('pointerlockchange', handlePointerLockChange);
        return () => document.removeEventListener('pointerlockchange', handlePointerLockChange);
    }, [isMenuOpen, isGameOver, setPaused]);

    // Audio Context for Footsteps
    const audioContext = useRef<AudioContext | null>(null);
    const lastStepTime = useRef(0);

    // Vanilla JS Input Handling
    const input = useRef({ forward: false, backward: false, left: false, right: false, jump: false, run: false });

    useEffect(() => {
        // Audio Init
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();

        // Input Listeners
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isPaused) return; // Ignore inputs when paused
            switch (e.code) {
                case 'KeyW': input.current.forward = true; break;
                case 'KeyS': input.current.backward = true; break;
                case 'KeyA': input.current.left = true; break;
                case 'KeyD': input.current.right = true; break;
                case 'Space': input.current.jump = true; break;
                case 'ShiftLeft': input.current.run = true; break;
                // DEBUG TELEPORT
                case 'KeyK':
                    if (exitPos) {
                        console.log("Teleporting to Manila Room...");
                        api.position.set(exitPos[0] - 5, 2, exitPos[2] - 5);
                        api.velocity.set(0, 0, 0);
                    }
                    break;
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (isPaused) {
                // Reset inputs if paused so player doesn't keep running
                input.current.forward = false;
                input.current.backward = false;
                input.current.left = false;
                input.current.right = false;
                input.current.jump = false;
                input.current.run = false;
                return;
            }
            switch (e.code) {
                case 'KeyW': input.current.forward = false; break;
                case 'KeyS': input.current.backward = false; break;
                case 'KeyA': input.current.left = false; break;
                case 'KeyD': input.current.right = false; break;
                case 'Space': input.current.jump = false; break;
                case 'ShiftLeft': input.current.run = false; break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            audioContext.current?.close();
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [exitPos, api, isPaused]);

    const playFootstep = (isWood: boolean) => {
        if (!audioContext.current) return;
        const ctx = audioContext.current;
        if (ctx.state === 'suspended') ctx.resume();

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        if (isWood) {
            // Wood: Click/Tap
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(150, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.08);
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800, ctx.currentTime);
            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
            oscillator.start();
            oscillator.stop(ctx.currentTime + 0.08);
        } else {
            // Carpet: Muffled Thud (Squish)
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(80, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.12);
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(250, ctx.currentTime);
            gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
            oscillator.start();
            oscillator.stop(ctx.currentTime + 0.12);
        }
    };

    useFrame((state) => {
        if (isMenuOpen || isGameOver || isPaused) {
            // If paused, ensure velocity is zeroed out so we don't slide?
            // api.velocity.set(0,0,0); // Optional, might be abrupt. Friction will stop us.
            return;
        }

        // ... rest of useFrame

        // Sync camera strictly to physics body
        camera.position.set(pos.current[0], pos.current[1] + 1.6, pos.current[2]);

        const { forward, backward, left, right, jump, run } = input.current;

        // Footstep Logic
        const isMoving = (forward || backward || left || right);
        if (isMoving && Math.abs(velocity.current[1]) < 0.1) { // Ground check
            const stepInterval = run ? 0.35 : 0.6;
            const now = state.clock.getElapsedTime();
            if (now - lastStepTime.current > stepInterval) {
                lastStepTime.current = now;

                // Determine Surface
                let isWood = false;
                if (exitPos) {
                    const dx = pos.current[0] - exitPos[0];
                    const dz = pos.current[2] - exitPos[2];
                    if (Math.abs(dx) < 2.5 && Math.abs(dz) < 2.5) {
                        isWood = true;
                    }
                }
                playFootstep(isWood);
            }
        }

        const frontVector = new Vector3(
            0,
            0,
            Number(backward) - Number(forward)
        );
        const sideVector = new Vector3(
            Number(left) - Number(right),
            0,
            0
        );

        const direction = new Vector3();
        direction
            .subVectors(frontVector, sideVector)
            .normalize()
            .multiplyScalar(run ? SPRINT_SPEED : SPEED)
            .applyEuler(camera.rotation);

        smoothedVel.current.lerp(direction, 0.2);

        api.velocity.set(
            smoothedVel.current.x,
            velocity.current[1],
            smoothedVel.current.z
        );

        if (jump && Math.abs(velocity.current[1]) < 0.05) {
            api.velocity.set(velocity.current[0], JUMP_FORCE, velocity.current[2]);
        }
    });

    return (
        <>
            <PointerLockControls />
            <mesh ref={ref} />
        </>
    );
};
