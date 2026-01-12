import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import { MeshStandardMaterial } from 'three';

export const FluorescentLight = ({ position }: { position: [number, number, number] }) => {
    const materialRef = useRef<MeshStandardMaterial>(null);
    const [offset] = useState(() => Math.random() * 100); // Random visual offset

    useFrame((state) => {
        if (!materialRef.current) return;

        const time = state.clock.getElapsedTime();
        // Slightly different flicker pattern per light to avoid perfect sync
        const flicker = Math.sin(time * 20 + offset) * Math.cos(time * 30 + 12);

        let intensity = 1.0;
        if (Math.random() < 0.005) {
            intensity = 0.1; // Dip
        } else if (Math.random() < 0.005) {
            intensity = 2.0; // Spike
        } else {
            intensity = 1.0 + (flicker * 0.05); // Hum (Reduced flicker)
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
            {/* PointLight and Audio removed for performance stability in Level 1 */}
        </group>
    );
};
