import { useEffect, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';

export const AmbientSound = () => {
    const audioContext = useRef<AudioContext | null>(null);
    const gainNode = useRef<GainNode | null>(null);
    const isMenuOpen = useGameStore((state) => state.isMenuOpen);

    useEffect(() => {
        // Initialize Audio Context
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();
        audioContext.current = ctx;

        // Create a Brown Noise buffer (Deep, low rumble)
        const bufferSize = ctx.sampleRate * 2; // 2 seconds
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
            // Brown noise generation algorithm
            const white = Math.random() * 2 - 1;
            data[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = data[i];
            data[i] *= 3.5; // Compensate for gain loss
        }

        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = buffer;
        noiseSource.loop = true;

        // Lowpass filter to muffle it (Backrooms sound is muffled)
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400; // Deep hum

        // Gain node for volume control
        const gain = ctx.createGain();
        gain.gain.value = 0; // Start silent
        gainNode.current = gain;

        // Connect graph
        noiseSource.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noiseSource.start();

        // Add a secondary 60Hz Electrical Hum
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = 60; // Mains hum frequency
        const oscGain = ctx.createGain();
        oscGain.gain.value = 0.05; // Very subtle
        osc.connect(oscGain);
        oscGain.connect(gain); // Connect to main gain
        osc.start();

        return () => {
            ctx.close();
        };
    }, []);

    // Handle Play/Pause based on Menu state
    useEffect(() => {
        if (!audioContext.current || !gainNode.current) return;

        if (!isMenuOpen) {
            // Game Started: Fade in
            audioContext.current.resume();
            gainNode.current.gain.setTargetAtTime(0.05, audioContext.current.currentTime, 1);
        } else {
            // Menu Open: Fade out
            gainNode.current.gain.setTargetAtTime(0, audioContext.current.currentTime, 0.5);
        }
    }, [isMenuOpen]);

    return null; // Logic only component
};
