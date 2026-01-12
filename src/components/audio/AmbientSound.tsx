import { useEffect, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';

export const AmbientSound = () => {
    const { isMenuOpen, ambientVolumeScale, currentLevel } = useGameStore();
    const audioContext = useRef<AudioContext | null>(null);
    const gainNode = useRef<GainNode | null>(null);

    // Track oscillators to stop them on unmount
    const ambientOscillator = useRef<OscillatorNode | null>(null);

    // Initialize audio context and nodes
    useEffect(() => {
        if (!audioContext.current) {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContext.current = ctx;

            // Main ambient hum (60Hz default)
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = 60; // Low hum
            ambientOscillator.current = osc;

            // Main gain node for overall volume control
            const gain = ctx.createGain();
            gain.gain.value = 0; // Start silent
            gainNode.current = gain;

            // Connect nodes
            osc.connect(gain);
            gain.connect(ctx.destination);

            // Start oscillators
            osc.start();
        }

        // Cleanup function
        return () => {
            if (audioContext.current) {
                ambientOscillator.current?.stop();
                audioContext.current.close();
                audioContext.current = null;
                gainNode.current = null;
                ambientOscillator.current = null;
            }
        };
    }, []); // Run once on mount

    // Handle Play/Pause based on Menu state and volume scaling
    useEffect(() => {
        if (!audioContext.current || !gainNode.current || !ambientOscillator.current) return;

        const ctx = audioContext.current;
        const gain = gainNode.current;
        const osc = ambientOscillator.current;

        // Resume context if suspended (browser autoplay policy)
        if (ctx.state === 'suspended' && !isMenuOpen) {
            ctx.resume();
        }

        if (!isMenuOpen) {
            // Level Specific Audio Adjustment
            const now = ctx.currentTime;

            if (currentLevel === 'LEVEL_1') {
                // Deeper, mechanical drone
                osc.frequency.setTargetAtTime(45, now, 2);
                // Could switch type if wrapper allowed, but keep sine to avoid clicks
            } else {
                // Standard Hum
                osc.frequency.setTargetAtTime(60, now, 2);
            }

            // Game Started: Fade in
            // Base volume 0.05 * scale for ambient hum
            const targetAmbientVolume = 0.05 * ambientVolumeScale;
            gain.gain.setTargetAtTime(targetAmbientVolume, now, 1);
        } else {
            // Menu Open: Fade out
            gain.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
        }
    }, [isMenuOpen, ambientVolumeScale, currentLevel]);

    return null; // Logic only component
};
