import { useSphere } from '@react-three/cannon';
import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useState, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { Vector3 } from 'three';
import { useGameStore } from '../../store/gameStore';

import { CELL_SIZE } from '../../utils/mapGenerator';

// Duller Logic Constants
const DULLER_SPEED_IDLE = 2;
const DULLER_SPEED_FLEE = 6;
const DULLER_SPEED_HUNT = 4.5;
const DETECTION_RADIUS = 15;
const AMBUSH_RADIUS = 6;
const AMBUSH_DAMAGE_RADIUS = 4.0; // Increased from 2.5 to ensure it hits through 2.5 unit thick wall half

export const Duller = ({ position, map }: { position: [number, number, number], map: number[][] }) => {
    const { camera } = useThree();
    // Physics Body
    const [ref, api] = useSphere(() => ({
        mass: 1,
        position,
        args: [0.5], // Radius
        fixedRotation: true, // Prevent tipping
        linearDamping: 0.5,
        collisionFilterGroup: 1, // Be part of default group
        collisionFilterMask: 1, // Be part of default group, BUT we manually ignore wall collisions via logic or rely on mask 1 not hitting mask 2 if set up.
        // Level1 set Walls to Group 2. Default mask is 1. So Mask 1 hits Group 1 (Floor/Player), ignores Group 2 (Walls).
        // So physics-wise, Duller already ignores walls.
    }));

    // Velocity Subscription
    const velocity = useRef([0, 0, 0]);
    useEffect(() => {
        const unsubscribe = api.velocity.subscribe((v) => (velocity.current = v));
        return unsubscribe;
    }, [api.velocity]);

    // AI State
    const [state, setState] = useState<'IDLE' | 'FLEE' | 'HUNT' | 'AMBUSH'>('IDLE');
    const playerPos = useRef(new Vector3());
    const entityPos = useRef(new Vector3());
    const moveDir = useRef(new Vector3());
    const lastDamageTime = useRef(0);

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

    // Wall Check Helper
    const checkWallBetween = (start: Vector3, end: Vector3) => {
        // Grid Coords
        const width = map[0].length;
        const height = map.length;
        const worldWidth = width * CELL_SIZE;
        const worldHeight = height * CELL_SIZE;

        // Convert World to Grid
        const toGrid = (val: number, worldSize: number) => {
            return Math.floor((val + worldSize / 2) / CELL_SIZE);
        };

        const x0 = toGrid(start.x, worldWidth);
        const y0 = toGrid(start.z, worldHeight);
        const x1 = toGrid(end.x, worldWidth);
        const y1 = toGrid(end.z, worldHeight);

        // Simple Line Trace (Stepping) because walls are 1x1 cells
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = (x0 < x1) ? 1 : -1;
        const sy = (y0 < y1) ? 1 : -1;
        let err = dx - dy;

        let x = x0;
        let y = y0;

        let wallFound = false;

        // Max iterations to prevent freeze
        let safe = 0;
        while (safe < 20) {
            if (x >= 0 && x < width && y >= 0 && y < height) {
                if (map[y][x] === 1) {
                    wallFound = true;
                    break;
                }
            }
            if (x === x1 && y === y1) break;
            const e2 = 2 * err;
            if (e2 > -dy) { err -= dy; x += sx; }
            if (e2 < dx) { err += dx; y += sy; }
            safe++;
        }

        return wallFound;
    };

    useFrame((rootState) => {
        if (!ref.current) return;

        // --- PHYSICS & AI LOGIC (EXISTING) ---
        // Update Positions
        playerPos.current.copy(camera.position);
        entityPos.current.copy(ref.current.position);

        const distToPlayer = entityPos.current.distanceTo(playerPos.current);
        const now = Date.now();

        // 1. Determine State
        if (state !== 'AMBUSH' && distToPlayer < AMBUSH_RADIUS && distToPlayer > 2.0) {
            // Check if there is a wall between us
            const isWall = checkWallBetween(entityPos.current, playerPos.current);
            if (isWall) {
                console.log("DULLER: AMBUSH START");
                setState('AMBUSH');
            }
        }

        // State Machine
        if (state === 'AMBUSH') {
            // Check exit conditions for Ambush
            const isWall = checkWallBetween(entityPos.current, playerPos.current);
            if ((!isWall && distToPlayer < AMBUSH_RADIUS) || distToPlayer < 2.0) {
                // Wall gone or Too Close -> HUNT
                console.log("DULLER: AMBUSH BROKEN -> HUNT");
                setState('HUNT');
            } else if (distToPlayer > AMBUSH_RADIUS + 2) {
                console.log("DULLER: AMBUSH LEAVE -> IDLE");
                setState('IDLE'); // Player ran away
            } else {
                // STAY IN AMBUSH - EXECUTE ATTACK logic below
                // Ambush Damage Logic
                if (distToPlayer < AMBUSH_DAMAGE_RADIUS && health > 0 && now - lastDamageTime.current > 1000) {
                    // High Damage
                    setHealth((prev) => prev - 15); // BIG DAMAGE
                    setInteractionText("IT GRABBED YOU THROUGH THE WALL!");
                    setTimeout(() => setInteractionText(null), 1500);
                    lastDamageTime.current = now;
                }
            }
        } else if (distToPlayer < DETECTION_RADIUS) {
            if (hasAlmondWater) {
                setState('FLEE');
            } else {
                setState('FLEE');
                if (distToPlayer < 4) {
                    // Only hunt if NOT separated by wall (handled by Ambush check above usually)
                    // If no wall and close -> Hunt
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
                if (now - lastDamageTime.current > 1000) {
                    setHealth((prev) => prev - 10); // Increased damage slightly since cooldown added
                    setInteractionText("Something scratched you!");
                    setTimeout(() => setInteractionText(null), 2000);
                    lastDamageTime.current = now;
                }
            }
        } else if (state === 'AMBUSH') {
            // STOP Moving
            speed = 0;
            isMoving = false;

            // Look AT Player
            moveDir.current.subVectors(playerPos.current, entityPos.current).normalize();

            // Ambush Damage Logic: Precision Hitbox Attempt
            // Check if Player is near the "Hand" (2.0 units in front of Duller)
            const armReach = 2.0;
            const hitBoxRadius = 1.0; // Reduced from 1.5
            const armTip = entityPos.current.clone().add(moveDir.current.clone().multiplyScalar(armReach));
            const distToHand = armTip.distanceTo(playerPos.current);

            if (distToHand < hitBoxRadius && health > 0) {
                console.log("DULLER: AMBUSH ATTACK ATTEMPT!");
                // High Damage
                if (now - lastDamageTime.current > 1500) { // Slower, heavier hits
                    setHealth((prev) => prev - 25); // BIG DAMAGE
                    setInteractionText("IT GRABBED YOU THROUGH THE WALL!");
                    setTimeout(() => setInteractionText(null), 1500);
                    lastDamageTime.current = now;
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
            // Even if stopped, if Ambush, Face Player
            if (state === 'AMBUSH' && moveDir.current.lengthSq() > 0.01) {
                const angle = Math.atan2(moveDir.current.x, moveDir.current.z);
                api.rotation.set(0, angle, 0);
            }
        }

        // --- ANIMATION LOGIC (NEW) ---
        if (bodyRef.current && leftArmRef.current && rightArmRef.current && leftLegRef.current && rightLegRef.current) {
            const time = rootState.clock.getElapsedTime();

            // Reset Arm Scale/Pos default
            rightArmRef.current.scale.set(1, 1, 1);
            rightArmRef.current.rotation.x = 0; // Reset X rotation from walking
            leftArmRef.current.scale.set(1, 1, 1);
            // Make sure we're not overwriting the walk animation unintentionally if moving, but Ambush takes priority.

            if (state === 'AMBUSH') {
                // STRETCH RIGHT ARM
                // Arm local Z is forward?
                // Arm geometry is box args [0.06, 1.2, 0.06]. Pivot is shoulder.
                // We want to rotate it forward (90 deg X) and stretch it.

                rightArmRef.current.rotation.x = -Math.PI / 2; // Point forward

                // Stretch Cycle
                const stretch = 1 + Math.sin(time * 10) * 0.5 + 1.5; // Scale from 1 to 3
                rightArmRef.current.scale.y = stretch; // Box Y is length

                // Wiggle fingers/arm
                rightArmRef.current.rotation.z = Math.sin(time * 20) * 0.1;

                // Breathing body
                bodyRef.current.position.y = 0.5 + Math.sin(time * 5) * 0.05;

            } else if (isMoving) {
                // ... Existing Walk Animation ...
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
                bodyRef.current.rotation.x = 0;
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
