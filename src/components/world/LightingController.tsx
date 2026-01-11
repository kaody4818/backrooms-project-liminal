
import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import { PointLight } from 'three';
import { useGameStore } from '../../store/gameStore';

export const LightingController = () => {
    const lightRef = useRef<PointLight>(null);
    const { sanity } = useGameStore();
    const { camera } = useThree();

    useFrame((state) => {
        if (!lightRef.current) return;

        // Base intensity
        const baseIntensity = 1.0;

        // Flickering Logic
        // Chance to flicker increases as sanity decreases?
        // Or just constant "bad wiring" feel.

        const time = state.clock.getElapsedTime();
        const flicker = Math.sin(time * 20) * Math.cos(time * 30 + 12);

        // Random darkening spikes
        if (Math.random() < 0.05) {
            lightRef.current.intensity = baseIntensity * 0.1; // Dip
        } else if (Math.random() < 0.05) {
            lightRef.current.intensity = baseIntensity * 1.5; // Spike
        } else {
            // Gentle hum
            lightRef.current.intensity = baseIntensity + (flicker * 0.1);
        }
    });

    return (
        <group>
            {/* Global Ambient Light - Increased for visibility */}
            <ambientLight intensity={0.4} />

            {/* Flickering Overhead Light - Main Source */}
            <pointLight
                ref={lightRef}
                position={[10, 20, 10]}
                distance={150} // Increased distance
                decay={0.5} // Reduced decay for wider reach
                intensity={1.5}
                color="#ffffee"
                castShadow
            />

            {/* Subtle "Player Flashlight" or proximity glow to ensure walls are visible up close */}
            <pointLight position={[camera.position.x, camera.position.y + 2, camera.position.z]} intensity={0.2} distance={10} decay={2} />
        </group>
    );
};
