import { useState, useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGameStore } from '../../store/gameStore';
import { FallingTile } from '../entities/FallingTile';
import { WALL_HEIGHT } from '../../utils/mapGenerator';

interface ActiveTile {
    id: number;
    position: [number, number, number];
}

export const HazardManager = () => {
    const { currentLevel, isPaused, readingNote } = useGameStore();
    const { camera } = useThree();
    const [tiles, setTiles] = useState<ActiveTile[]>([]);
    const nextId = useRef(0);
    const lastSpawnTime = useRef(0);

    // Audio Context
    const audioCtx = useRef<AudioContext | null>(null);
    useEffect(() => {
        audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        return () => { audioCtx.current?.close(); };
    }, []);

    const playCrash = () => {
        if (!audioCtx.current) return;
        const ctx = audioCtx.current;
        if (ctx.state === 'suspended') ctx.resume();

        const t = ctx.currentTime;

        // Noise Burst (Approximated with Sawtooth low pitch + Noise buffer if possible, but Saw is easier)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, t);
        osc.frequency.exponentialRampToValueAtTime(10, t + 0.4);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, t);
        filter.frequency.exponentialRampToValueAtTime(50, t + 0.3);

        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.4);
    };

    useFrame(() => {
        if (isPaused || readingNote || currentLevel !== 'LEVEL_0_2') return;

        // Spawn Logic
        const now = performance.now();
        if (now - lastSpawnTime.current > 500) { // Check every 0.5s
            // Spawn Chance: High in Level 0.2 "The Collapse"
            if (Math.random() < 0.3) {
                spawnTile(); // Re-enabled with safety checks
                lastSpawnTime.current = now;
            }
        }
    });

    const spawnTile = () => {
        if (!camera) return;

        // Random position near player
        const r = 2 + Math.random() * 5;
        const angle = Math.random() * Math.PI * 2;

        const x = camera.position.x + Math.cos(angle) * r;
        const z = camera.position.z + Math.sin(angle) * r;

        // Occasionally spawn RIGHT ABOVE player
        const isDirectHit = Math.random() < 0.1;
        const spawnX = isDirectHit ? camera.position.x : x;
        const spawnZ = isDirectHit ? camera.position.z : z;

        if (isNaN(spawnX) || isNaN(spawnZ)) {
            console.error("[Hazard] NaN Position Detectected!");
            return;
        }

        // console.log(`[Hazard] Spawning Tile at`, spawnX, spawnZ);
        const id = nextId.current++;
        setTiles(prev => [...prev, { id, position: [spawnX, WALL_HEIGHT - 0.2, spawnZ] }]);
    };

    const removeTile = (id: number) => {
        setTiles(prev => prev.filter(t => t.id !== id));
    };

    if (currentLevel !== 'LEVEL_0_2') return null;

    return (
        <group>
            {tiles.map(tile => (
                <FallingTile
                    key={tile.id}
                    position={tile.position}
                    onDespawn={() => removeTile(tile.id)}
                    onCrash={playCrash}
                />
            ))}
        </group>
    );
};
