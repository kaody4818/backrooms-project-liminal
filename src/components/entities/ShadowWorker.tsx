import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Group } from 'three';
import { useGameStore } from '../../store/gameStore';

export const ShadowWorker = ({ position }: { position: [number, number, number] }) => {
    const isPaused = useGameStore((state) => state.isPaused);
    const groupRef = useRef<Group>(null);

    // Animation refs for limbs to create a simple "breathing/working" idle motion
    const leftArmRef = useRef<any>(null);
    const rightArmRef = useRef<any>(null);

    useFrame((state) => {
        if (!groupRef.current || isPaused) return;

        // Face the player? Or just look busy?
        // Let's keep them somewhat mysterious, maybe slowly rotating or fixed.
        // For now, let's make them face the center of the room or just random direction?
        // Existing logic was "always face camera" (Billboard).
        // For a 3D model, always facing camera looks weird (like a sprite).
        // Let's make them slowly look around or stand still.
        // Let's add a slow "breathing" animation.

        const time = state.clock.elapsedTime;
        const breath = Math.sin(time * 2) * 0.02;

        if (groupRef.current) {
            // Override Y to 0.8 (half leg height + 0.4) to ensure feet touch floor at Y=0
            // Legs are at -0.4 local y, height 0.8 -> Feet at -0.8 local.
            // So Group Y must be 0.8.
            groupRef.current.position.y = 0.8 + breath;
        }

        // Arm sway
        if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(time * 1.5) * 0.1;
        if (rightArmRef.current) rightArmRef.current.rotation.x = -Math.sin(time * 1.5) * 0.1;
    });

    // Materials
    const skinColor = "#111111"; // Shadowy dark
    const vestColor = "#ff6600"; // Orange Safety Vest
    const hatColor = "#ffcc00"; // Yellow Hard Hat

    return (
        <group ref={groupRef} position={[position[0], position[1], position[2]]}>
            {/* 3D Low Poly Humanoid */}

            {/* HEAD */}
            <mesh position={[0, 0.7, 0]}>
                <boxGeometry args={[0.25, 0.25, 0.25]} />
                <meshStandardMaterial color={skinColor} />
            </mesh>

            {/* HARD HAT */}
            <mesh position={[0, 0.82, 0]}>
                <cylinderGeometry args={[0.18, 0.18, 0.1, 16]} />
                <meshStandardMaterial color={hatColor} />
            </mesh>
            <mesh position={[0, 0.82, 0.1]} rotation={[0.2, 0, 0]}>
                <boxGeometry args={[0.2, 0.02, 0.1]} />
                <meshStandardMaterial color={hatColor} />
            </mesh>

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
