import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Group } from 'three';
import { useGameStore } from '../../store/gameStore';

export const ShadowWorker = ({ position }: { position: [number, number, number] }) => {
    const isPaused = useGameStore((state) => state.isPaused);
    const groupRef = useRef<Group>(null);

    // Animation refs for limbs to create a simple "breathing/working" idle motion
    const headRef = useRef<any>(null);
    const leftArmRef = useRef<any>(null);
    const rightArmRef = useRef<any>(null);

    // Randomize work type ONCE on mount
    const workType = useRef<'hammering' | 'inspecting' | 'idle'>(
        Math.random() > 0.6 ? 'hammering' : Math.random() > 0.3 ? 'inspecting' : 'idle'
    ).current;

    useFrame((state) => {
        if (!groupRef.current || isPaused) return;

        const time = state.clock.elapsedTime;
        const breath = Math.sin(time * 2) * 0.02;

        if (groupRef.current) {
            // Override Y to 0.8 (half leg height + 0.4) to ensure feet touch floor at Y=0
            groupRef.current.position.y = 0.8 + breath;
        }

        // --- Animations based on Work Type ---
        if (workType === 'hammering') {
            // Right arm swings up and down vigorously
            if (rightArmRef.current) {
                rightArmRef.current.rotation.x = Math.sin(time * 15) * 1.0 + 0.5;
            }
            // Head follows slightly
            if (headRef.current) {
                headRef.current.rotation.x = Math.sin(time * 15) * 0.1 + 0.2;
            }
        }
        else if (workType === 'inspecting') {
            // Look Left/Right slowly
            if (headRef.current) {
                headRef.current.rotation.y = Math.sin(time * 0.5) * 0.8;
                // Look up/down occasionally
                headRef.current.rotation.x = Math.sin(time * 1.3) * 0.2;
            }
            // Simple idle arms
            if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(time * 1.5) * 0.05;
            if (rightArmRef.current) rightArmRef.current.rotation.x = -Math.sin(time * 1.5) * 0.05;
        }
        else {
            // Idle / Carrying
            if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(time * 1.5) * 0.1;
            if (rightArmRef.current) rightArmRef.current.rotation.x = -Math.sin(time * 1.5) * 0.1;

            if (headRef.current) {
                headRef.current.rotation.y = Math.sin(time * 0.2) * 0.2;
                headRef.current.rotation.x = 0;
            }
        }
    });

    // Materials
    const skinColor = "#111111"; // Shadowy dark
    const vestColor = "#ff6600"; // Orange Safety Vest
    const hatColor = "#ffcc00"; // Yellow Hard Hat

    return (
        <group ref={groupRef} position={[position[0], position[1], position[2]]}>
            {/* 3D Low Poly Humanoid */}

            {/* HEAD GROUP */}
            <group position={[0, 0.7, 0]} ref={headRef}>
                {/* HEAD BOX */}
                <mesh position={[0, 0, 0]}>
                    <boxGeometry args={[0.25, 0.25, 0.25]} />
                    <meshStandardMaterial color={skinColor} />
                </mesh>

                {/* HARD HAT */}
                <mesh position={[0, 0.12, 0]}>
                    <cylinderGeometry args={[0.18, 0.18, 0.1, 16]} />
                    <meshStandardMaterial color={hatColor} />
                </mesh>
                <mesh position={[0, 0.12, 0.1]} rotation={[0.2, 0, 0]}>
                    <boxGeometry args={[0.2, 0.02, 0.1]} />
                    <meshStandardMaterial color={hatColor} />
                </mesh>
            </group>

            {/* TORSO (Vest) */}
            <mesh position={[0, 0.3, 0]}>
                <boxGeometry args={[0.35, 0.6, 0.2]} />
                <meshStandardMaterial color={vestColor} />
            </mesh>
            {/* Torso Detail (Dark Shirt underneath/Shadow) */}
            <mesh position={[0, 0.55, 0]}>
                <boxGeometry args={[0.1, 0.1, 0.21]} />
                <meshStandardMaterial color={skinColor} />
            </mesh>

            {/* LEFT ARM */}
            <group position={[-0.25, 0.5, 0]} ref={leftArmRef}>
                <mesh position={[0, -0.3, 0]}>
                    <boxGeometry args={[0.1, 0.6, 0.1]} />
                    <meshStandardMaterial color={skinColor} />
                </mesh>
            </group>

            {/* RIGHT ARM */}
            <group position={[0.25, 0.5, 0]} ref={rightArmRef}>
                <mesh position={[0, -0.3, 0]}>
                    <boxGeometry args={[0.1, 0.6, 0.1]} />
                    <meshStandardMaterial color={skinColor} />
                </mesh>
            </group>

            {/* LEGS (Static for now) */}
            <mesh position={[-0.1, -0.4, 0]}>
                <boxGeometry args={[0.12, 0.8, 0.12]} />
                <meshStandardMaterial color="#222222" /> {/* Dark Pants */}
            </mesh>
            <mesh position={[0.1, -0.4, 0]}>
                <boxGeometry args={[0.12, 0.8, 0.12]} />
                <meshStandardMaterial color="#222222" /> {/* Dark Pants */}
            </mesh>

        </group>
    );
};
