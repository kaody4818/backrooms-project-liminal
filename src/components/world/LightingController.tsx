
import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import { PointLight } from 'three';
import { useGameStore } from '../../store/gameStore';

export const LightingController = () => {
    const lightRef = useRef<PointLight>(null);
    const { sanity, currentLevel, isGlobalFlicker } = useGameStore();
    const { camera } = useThree();

    useFrame((state) => {
        if (!lightRef.current) return;

        // Base settings
        let baseIntensity = 1.0;

        if (currentLevel === 'LEVEL_1') {
            baseIntensity = 0.8;
        }

        if (isGlobalFlicker) {
            // Global Flicker Event: Strobe Effect on Ambient Light
            const time = state.clock.getElapsedTime();
            const strobe = Math.sin(time * 50);

            if (strobe > 0.8) {
                // Flash
                lightRef.current.intensity = 3.0; // Very bright flash
            } else {
                // Darkness
                lightRef.current.intensity = 0.05; // Almost pitch black
            }

        } else {
            // Normal Behavior
            const time = state.clock.getElapsedTime();
            const flicker = Math.sin(time * 20) * Math.cos(time * 30 + 12);

            if (Math.random() < 0.05) {
                lightRef.current.intensity = baseIntensity * 0.1;
            } else if (Math.random() < 0.05) {
                lightRef.current.intensity = baseIntensity * 1.5;
            } else {
                lightRef.current.intensity = baseIntensity + (flicker * 0.1);
            }
        }
    });

    return (
        <group>
            {/* Global Ambient Light - Darkens during flicker */}
            <ambientLight intensity={isGlobalFlicker ? 0.05 : 0.4} />

            {/* Main Light */}
            <pointLight
                ref={lightRef}
                position={currentLevel === 'LEVEL_1' ? [0, 5.5, 0] : [10, 20, 10]}
                distance={currentLevel === 'LEVEL_1' ? 100 : 150}
                decay={currentLevel === 'LEVEL_1' ? 1.5 : 0.5}
                intensity={1.0}
                color={currentLevel === 'LEVEL_1' ? "#aaddff" : "#ffffee"}
                castShadow
            />

            {/* Flashlight / Proximity Glow */}
            <pointLight
                position={[camera.position.x, camera.position.y, camera.position.z]}
                intensity={isGlobalFlicker ? 0.1 : 0.2} // Dim flashlight during horror event? Or keep it as safety? Let's dim it to make it scarier.
                distance={15}
                decay={2}
                color="#ffffff"
            />
        </group>
    );
};
