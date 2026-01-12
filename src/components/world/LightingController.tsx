
import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useState, useEffect } from 'react';
import { PointLight } from 'three';
import { useGameStore } from '../../store/gameStore';

export const LightingController = () => {
    const lightRef = useRef<PointLight>(null);
    const { sanity, currentLevel } = useGameStore();
    const { camera } = useThree();

    // Blackout State (Level 1 Exclusive)
    const [isBlackout, setBlackout] = useState(false);

    useEffect(() => {
        if (currentLevel !== 'LEVEL_1') {
            setBlackout(false);
            return;
        }

        // Random Blackout Loop
        const loop = () => {
            if (Math.random() < 0.3) { // 30% chance to blackout every cycle
                setBlackout(true);
                // Lasts 5-15 seconds
                const duration = 5000 + Math.random() * 10000;
                setTimeout(() => {
                    setBlackout(false);
                    // Schedule next check
                    scheduleNext();
                }, duration);
            } else {
                scheduleNext();
            }
        };

        const scheduleNext = () => {
            // Check every 20-40 seconds
            const delay = 20000 + Math.random() * 20000;
            setTimeout(loop, delay);
        };

        const timeout = setTimeout(loop, 10000); // Initial delay
        return () => clearTimeout(timeout);
    }, [currentLevel]);


    useFrame((state) => {
        if (!lightRef.current) return;

        // Base settings
        let baseIntensity = 1.0;
        let ambient = 0.4;
        let color = "#ffffee";

        if (currentLevel === 'LEVEL_1') {
            baseIntensity = 0.8;
            ambient = 0.2; // Darker
            color = "#ccffcc"; // Slight green tint? Or just cold white. "#e0f0ff"
        }

        if (isBlackout) {
            baseIntensity = 0.05; // Almost pitch black
            ambient = 0.05;
        }

        // Flickering Logic
        const time = state.clock.getElapsedTime();
        const flicker = Math.sin(time * 20) * Math.cos(time * 30 + 12);

        // Random darkening spikes (independent of blackout)
        if (!isBlackout) {
            if (Math.random() < 0.05) {
                lightRef.current.intensity = baseIntensity * 0.1;
            } else if (Math.random() < 0.05) {
                lightRef.current.intensity = baseIntensity * 1.5;
            } else {
                lightRef.current.intensity = baseIntensity + (flicker * 0.1);
            }
        } else {
            // Deep darkness flicker
            lightRef.current.intensity = Math.random() < 0.1 ? 0.1 : 0;
        }

        // This component only controls the MAIN overhead light. 
        // Level1 geometry might block it.
    });

    return (
        <group>
            {/* Global Ambient Light */}
            <ambientLight intensity={currentLevel === 'LEVEL_1' && isBlackout ? 0 : 0.4} />

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
                intensity={isBlackout ? 0.8 : 0.2} // Brighter flashlight during blackout
                distance={15}
                decay={2}
                color="#ffffff"
            />
        </group>
    );
};
