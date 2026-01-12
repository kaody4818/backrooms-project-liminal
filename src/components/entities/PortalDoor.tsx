import { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store/gameStore';
import { useBox } from '@react-three/cannon';
import { Color } from 'three';

export const GlitchWall = ({ position, rotation }: { position: [number, number, number], rotation: [number, number, number] }) => {
    // Renamed Logic internally to "GlitchWall" but keeping export name to avoid breaking imports
    const setLevel = useGameStore((state) => state.setLevel);
    const currentLevel = useGameStore((state) => state.currentLevel);
    const setInteractionText = useGameStore((state) => state.setInteractionText);
    const meshRef = useRef<any>(null);

    // Physics body (Static Wall)
    const [ref] = useBox(() => ({
        type: 'Static',
        position,
        rotation,
        args: [5, 4, 1] // Wall Size (Block)
    }));

    const handleInteract = () => {
        setInteractionText(null);
        if (currentLevel === 'LEVEL_0' || currentLevel === 'LEVEL_0_2') {
            // Direct transition to Level 1 from Level 0 (or legacy 0.2)
            console.log("Noclipping to Level 1...");
            setLevel('LEVEL_1');
        } else {
            console.log("Returning to Level 0...");
            setLevel('LEVEL_0');
        }
    };

    // Glitch Animation
    useFrame((state) => {
        if (!meshRef.current) return;
        const time = state.clock.getElapsedTime();

        // Random visual glitch
        if (Math.random() < 0.1) {
            meshRef.current.material.color = new Color(Math.random(), Math.random(), Math.random());
            meshRef.current.position.x = (Math.random() - 0.5) * 0.1;
        } else {
            meshRef.current.material.color = new Color("#000000"); // Default Void Color
            meshRef.current.position.x = 0;
        }

        // Pulse opacity
        meshRef.current.material.opacity = 0.8 + Math.sin(time * 10) * 0.1;
    });

    const userData = {
        interactive: true,
        type: 'glitch',
        label: "Noclip",
        onInteract: handleInteract
    };

    return (
        <group ref={ref as any}>
            <mesh
                ref={meshRef}
                position={[0, 2, 0]}
                castShadow
                receiveShadow
                userData={userData}
                onPointerOver={() => setInteractionText(`[E] ${userData.label}`)}
                onPointerOut={() => setInteractionText(null)}
            >
                <boxGeometry args={[5, 4, 0.5]} />
                <meshStandardMaterial
                    color="#000000"
                    transparent
                    opacity={0.9}
                    roughness={0.2}
                    emissive="#111111"
                />
            </mesh>

            {/* Glitch Particles / Aura */}
            <pointLight position={[0, 2, 1]} intensity={1} distance={5} color="#00ff00" />
        </group>
    );
};
