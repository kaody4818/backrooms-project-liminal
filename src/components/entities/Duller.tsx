import { useSphere } from '@react-three/cannon';
import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useState, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { Vector3 } from 'three';
import { useGameStore } from '../../store/gameStore';

// Duller Logic Constants
const DULLER_SPEED_IDLE = 2;
const DULLER_SPEED_FLEE = 6;
const DULLER_SPEED_HUNT = 4.5;
const DETECTION_RADIUS = 15;

export const Duller = ({ position }: { position: [number, number, number] }) => {
    const { camera } = useThree();
    // Physics Body
    const [ref, api] = useSphere(() => ({
        mass: 1,
        position,
        args: [0.5], // Radius
        fixedRotation: true, // Prevent tipping
        linearDamping: 0.5,
        collisionFilterGroup: 1, // Be part of default group
        collisionFilterMask: 1, // Only collide with Group 1 (Floor, Player), Ignore Group 2 (Walls)
    }));

    // Velocity Subscription
    const velocity = useRef([0, 0, 0]);
    useEffect(() => {
        const unsubscribe = api.velocity.subscribe((v) => (velocity.current = v));
        return unsubscribe;
    }, [api.velocity]);

    // AI State
    const [state, setState] = useState<'IDLE' | 'FLEE' | 'HUNT'>('IDLE');
    const playerPos = useRef(new Vector3());
    const entityPos = useRef(new Vector3());
    const moveDir = useRef(new Vector3());

    // Store access
    const { inventory, setHealth, setInteractionText, health } = useGameStore();

    // Check if player has Almond Water
    const hasAlmondWater = useMemo(() => {
        return inventory.some(item => item.id === 'almond_water');
    }, [inventory]);

    // Animation Refs
    const bodyRef = useRef<THREE.Group>(null);
    const leftArmRef = useRef<THREE.Mesh>(null);
    const rightArmRef = useRef<THREE.Mesh>(null);
    const leftLegRef = useRef<THREE.Mesh>(null);
    const rightLegRef = useRef<THREE.Mesh>(null);

    useFrame((rootState) => {
        if (!ref.current) return;

        // --- PHYSICS & AI LOGIC (EXISTING) ---
        // Update Positions
        playerPos.current.copy(camera.position);
        entityPos.current.copy(ref.current.position);

        const distToPlayer = entityPos.current.distanceTo(playerPos.current);

        // 1. Determine State
        if (distToPlayer < DETECTION_RADIUS) {
            if (hasAlmondWater) {
                setState('FLEE');
            } else {
                setState('FLEE');
                if (distToPlayer < 4) {
                    setState('HUNT');
                }
            }
        } else {
            setState('IDLE');
        }

        // 2. Execute Movement
        let speed = DULLER_SPEED_IDLE;
        let isMoving = false;

        if (state === 'IDLE') {
            if (Math.random() < 0.02) {
                moveDir.current.set(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
            }
            // Occasional idle movement
            if (Math.random() < 0.1) isMoving = true;
        } else if (state === 'FLEE') {
            speed = DULLER_SPEED_FLEE;
            moveDir.current.subVectors(entityPos.current, playerPos.current).normalize();
            isMoving = true;
        } else if (state === 'HUNT') {
            speed = DULLER_SPEED_HUNT;
            moveDir.current.subVectors(playerPos.current, entityPos.current).normalize();
            isMoving = true;

            if (distToPlayer < 1.5 && health > 0) {
                if (Math.random() < 0.05) {
                    setHealth((prev) => prev - 5);
                    setInteractionText("Something scratched you!");
                    setTimeout(() => setInteractionText(null), 2000);
                }
            }
        }

        // Apply Velocity
        if (isMoving) {
            api.velocity.set(moveDir.current.x * speed, velocity.current[1], moveDir.current.z * speed);

            // Face direction
            if (moveDir.current.lengthSq() > 0.01) {
                const angle = Math.atan2(moveDir.current.x, moveDir.current.z);
                api.rotation.set(0, angle, 0);
            }
        } else {
            api.velocity.set(0, velocity.current[1], 0);
        }

        // --- ANIMATION LOGIC (NEW) ---
        if (bodyRef.current && leftArmRef.current && rightArmRef.current && leftLegRef.current && rightLegRef.current) {
            const time = rootState.clock.getElapsedTime();

            if (isMoving) {
                // "Wobbly" & "Unnatural" walking motion
                // Fix: Legs should be 180 deg out of phase (sin vs -sin), not 90 (sin vs cos)
                const walkCycle = time * (speed * 3);

                leftLegRef.current.rotation.x = Math.sin(walkCycle) * 0.8;
                rightLegRef.current.rotation.x = Math.sin(walkCycle + Math.PI) * 0.8;

                // Arms flail a bit more wildly or stretch
                // Arm swing opposite to legs (Left Arm forward when Right Leg forward)
                leftArmRef.current.rotation.x = Math.sin(walkCycle + Math.PI) * 0.5;
                leftArmRef.current.rotation.z = Math.sin(time * 5) * 0.1 + 0.2; // Wiggle out

                rightArmRef.current.rotation.x = Math.sin(walkCycle) * 0.5;
                rightArmRef.current.rotation.z = -Math.sin(time * 5) * 0.1 - 0.2; // Wiggle out

                // Body bob (2x freq of walk cycle)
                bodyRef.current.position.y = 0.5 + Math.abs(Math.sin(walkCycle)) * 0.1;
                // Wobbly tilt + Forward Lean
                bodyRef.current.rotation.z = Math.sin(time * 10) * 0.05;
                bodyRef.current.rotation.x = 0.1; // Lean forward

            } else {
                // Idle breathing/twitching
                const idleTime = time * 2;
                leftArmRef.current.rotation.z = Math.sin(idleTime) * 0.05 + 0.1;
                rightArmRef.current.rotation.z = -Math.sin(idleTime) * 0.05 - 0.1;

                leftLegRef.current.rotation.x = 0;
                rightLegRef.current.rotation.x = 0;

                bodyRef.current.position.y = 0.5 + Math.sin(idleTime) * 0.02;
                bodyRef.current.rotation.z = 0;
            }
        }
    });

    return (
        <group ref={ref}>
            <group ref={bodyRef} position={[0, 0.5, 0]}> {/* Adjusted for Taller Height (Legs 1.5m -> Hip at 1.0 from floor -> 0.5 from sphere center) */}

                {/* Torso: Very thin, skeletal */}
                <mesh position={[0, 0.6, 0]} castShadow>
                    <boxGeometry args={[0.25, 1.2, 0.15]} />
                    <meshStandardMaterial color="#3a3a3a" roughness={0.9} />
                </mesh>

                {/* Head: Featureless, smooth, slightly elongated */}
                <mesh position={[0, 1.35, 0]}>
                    <sphereGeometry args={[0.18, 16, 16]} />
                    {/* Elongate slightly */}
                    <meshStandardMaterial color="#3a3a3a" roughness={0.5} />
                </mesh>

                {/* Left Arm: Pivot at shoulder */}
                <group position={[0.25, 1.1, 0]} rotation={[0, 0, -0.1]}>
                    <mesh ref={leftArmRef} position={[0, -0.75, 0]}> {/* Center of arm mesh relative to pivot */}
                        <boxGeometry args={[0.08, 1.5, 0.08]} /> {/* Long arm */}
                        <meshStandardMaterial color="#3a3a3a" roughness={0.9} />
                    </mesh>
                </group>

                {/* Right Arm: Pivot at shoulder */}
                <group position={[-0.25, 1.1, 0]} rotation={[0, 0, 0.1]}>
                    <mesh ref={rightArmRef} position={[0, -0.75, 0]}>
                        <boxGeometry args={[0.08, 1.5, 0.08]} /> {/* Long arm */}
                        <meshStandardMaterial color="#3a3a3a" roughness={0.9} />
                    </mesh>
                </group>

                {/* Left Leg: Pivot at hip */}
                <group position={[0.15, 0, 0]}>
                    <mesh ref={leftLegRef} position={[0, -0.75, 0]}>
                        <boxGeometry args={[0.1, 1.5, 0.1]} />
                        <meshStandardMaterial color="#3a3a3a" roughness={0.9} />
                    </mesh>
                </group>

                {/* Right Leg: Pivot at hip */}
                <group position={[-0.15, 0, 0]}>
                    <mesh ref={rightLegRef} position={[0, -0.75, 0]}>
                        <boxGeometry args={[0.1, 1.5, 0.1]} />
                        <meshStandardMaterial color="#3a3a3a" roughness={0.9} />
                    </mesh>
                </group>

            </group>
        </group>
    );
};
