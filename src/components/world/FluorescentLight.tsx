import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { MeshStandardMaterial } from 'three';
import { useGameStore } from '../../store/gameStore';

export const FluorescentLight = ({ position }: { position: [number, number, number] }) => {
    const materialRef = useRef<MeshStandardMaterial>(null);
    const { isGlobalFlicker } = useGameStore();

    useFrame((state) => {
        if (!materialRef.current) return;

        const time = state.clock.getElapsedTime();

        let intensity = 1.0;

        if (isGlobalFlicker) {
            // Global Event: Violent Strobe / Darkness
            // 80% chance or OFF, 20% strobe
            const strobe = Math.sin(time * 50);
            if (strobe > 0.8) intensity = 3.0; // Bright flash
            else intensity = 0.0; // Dark
        } else {
            // Normal Behavior: Steady light
            intensity = 1.0;
        }

        materialRef.current.emissiveIntensity = intensity;
    });

    return (
        <group position={position}>
            {/* Fixture Body */}
            <mesh position={[0, 0, 0]} castShadow>
                <boxGeometry args={[1.2, 0.1, 0.4]} />
                <meshStandardMaterial color="#333" />
            </mesh>
            {/* Glowing Tube */}
            <mesh position={[0, -0.05, 0]}>
                <boxGeometry args={[1.0, 0.05, 0.2]} />
                <meshStandardMaterial
                    ref={materialRef}
                    color="#ffffff"
                    emissive="#ffffff"
                    emissiveIntensity={1}
                    toneMapped={false}
                />
            </mesh>
            {/* PointLight removed for performance, relying on emissive for bloom mostly */}
        </group>
    );
};
