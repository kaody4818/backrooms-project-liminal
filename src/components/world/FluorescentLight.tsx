
import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useState, useEffect } from 'react';
import { MeshStandardMaterial, PositionalAudio as ThreePositionalAudio, AudioListener } from 'three';

const HumSound = () => {
    const camera = useThree((state) => state.camera);
    const [sound, setSound] = useState<ThreePositionalAudio | null>(null);
    const [buffer, setBuffer] = useState<AudioBuffer | null>(null);

    // 1. Setup Listener & Sound Instance
    useEffect(() => {
        let listener = camera.children.find((c) => c.type === 'AudioListener') as AudioListener;
        if (!listener) {
            listener = new AudioListener();
            camera.add(listener);
        }

        const audio = new ThreePositionalAudio(listener);
        setSound(audio);

        return () => {
            if (audio.isPlaying) audio.stop();
            audio.disconnect();
        };
    }, [camera]);

    // 2. Generate Buffer
    useEffect(() => {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const bufferSize = ctx.sampleRate * 2.0;
        const newBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = newBuffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            const t = i / ctx.sampleRate;
            // 60Hz Hum + Harmonics + Noise
            const hum = Math.sin(t * 60 * 2 * Math.PI) +
                0.5 * Math.sin(t * 120 * 2 * Math.PI);
            const noise = (Math.random() * 2 - 1) * 0.1;

            data[i] = (hum * 0.5 + noise * 0.5) * 0.15;
        }
        setBuffer(newBuffer);
        return () => { ctx.close(); };
    }, []);

    // 3. Apply Buffer to Sound
    useEffect(() => {
        if (sound && buffer) {
            sound.setBuffer(buffer);
            sound.setRefDistance(1.5);
            sound.setRolloffFactor(3);
            sound.setLoop(true);
            sound.setVolume(1.2);
            if (!sound.isPlaying) sound.play();
        }
    }, [sound, buffer]);

    return sound ? <primitive object={sound} /> : null;
};

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
            {/* Local Point Light for realistic spill (Optional optimization: disable shadow for performance) */}
            <pointLight
                position={[0, -0.5, 0]}
                intensity={0.5}
                distance={5}
                decay={2}
                color="#ffffee"
            />
            <HumSound />
        </group>
    );
};
