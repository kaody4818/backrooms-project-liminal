import { useEffect, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';

export const AmbientSound = () => {
    const { isMenuOpen, ambientVolumeScale } = useGameStore();
    const audioContext = useRef<AudioContext | null>(null);
    const gainNode = useRef<GainNode | null>(null);
    const tinnitusGainNode = useRef<GainNode | null>(null);

    // Track oscillators to stop them on unmount
    const ambientOscillator = useRef<OscillatorNode | null>(null);
    const tinnitusOscillator = useRef<OscillatorNode | null>(null);

    // Initialize audio context and nodes
    useEffect(() => {
        if (!audioContext.current) {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContext.current = ctx;

            // Main ambient hum (60Hz)
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = 60; // Low hum
            ambientOscillator.current = osc;

            // Main gain node for overall volume control
            const gain = ctx.createGain();
            gain.gain.value = 0; // Start silent
            gainNode.current = gain;

            // Tinnitus Ring (High Pitch for Hallucinations)
            const tOsc = ctx.createOscillator();
            tOsc.type = 'sine';
            tOsc.frequency.value = 7500; // Ear ringing freq
            tinnitusOscillator.current = tOsc;

            const tGain = ctx.createGain();
            tGain.gain.value = 0.02; // Base volume (will be multiplied by ambientVolumeScale)
            tinnitusGainNode.current = tGain;

            // Connect nodes
            osc.connect(gain);
            tOsc.connect(tGain);
            tGain.connect(gain); // Tinnitus connects to the main gain node
            gain.connect(ctx.destination);

            // Start oscillators
            osc.start();
            tOsc.start();
        }

        // Cleanup function
        return () => {
            if (audioContext.current) {
                ambientOscillator.current?.stop();
                tinnitusOscillator.current?.stop();
                audioContext.current.close();
                audioContext.current = null;
                gainNode.current = null;
                tinnitusGainNode.current = null;
                ambientOscillator.current = null;
                tinnitusOscillator.current = null;
            }
        };
    }, []); // Run once on mount

    // Handle Play/Pause based on Menu state and volume scaling
    useEffect(() => {
        if (!audioContext.current || !gainNode.current) return;

        const ctx = audioContext.current;
        const gain = gainNode.current;

        // Resume context if suspended (browser autoplay policy)
        if (ctx.state === 'suspended' && !isMenuOpen) {
            ctx.resume();
        }

        if (!isMenuOpen) {
            // Game Started: Fade in
            // Base volume 0.05 * scale for ambient hum
            const targetAmbientVolume = 0.05 * ambientVolumeScale;
            gain.gain.setTargetAtTime(targetAmbientVolume, ctx.currentTime, 1);
        } else {
            // Menu Open: Fade out
            gain.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
        }
    }, [isMenuOpen, ambientVolumeScale]);

    return null; // Logic only component
};
