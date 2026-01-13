import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useState } from 'react';
import { Vector3 } from 'three';
import { useGameStore } from '../../store/gameStore';

export const Contraption = ({ position }: { position: [number, number, number] }) => {
    const isPaused = useGameStore((state) => state.isPaused);
    const setHealth = useGameStore((state) => state.setHealth);
    const setInteractionText = useGameStore((state) => state.setInteractionText);
    const { camera } = useThree();
    const ref = useRef<any>(null);
    const [lastDamageTime, setLastDamageTime] = useState(0);

    useFrame((state) => {
        if (!ref.current || isPaused) return;

        // Rotation animation
        ref.current.rotation.y += 0.01;
        ref.current.rotation.z += 0.005;

        // Damage Logic (Horizontal Distance Only)
        // Player camera is at y=1.6, contraption at y=0. Using 3D distance fails.
        const playerPos = new Vector3(camera.position.x, 0, camera.position.z);
        const entityPos = new Vector3(ref.current.position.x, 0, ref.current.position.z);
        const dist = playerPos.distanceTo(entityPos);

        if (dist < 1.0) { // Radius 1.0
            const now = state.clock.elapsedTime;
            if (now - lastDamageTime > 1.0) { // 1 second cooldown
                setHealth((prev) => Math.max(0, prev - 10));
                setInteractionText("Ow! That machinery is dangerous!");
                setLastDamageTime(now);

                // Clear text after 2 seconds
                setTimeout(() => {
                    useGameStore.getState().setInteractionText(null);
                }, 2000);
            }
        }
    });

    return (
        <group ref={ref} position={position}>
            {/* Main body */}
            <mesh position={[0, 0.5, 0]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#554433" roughness={0.8} />
            </mesh>
            {/* Spikes/Details */}
            <mesh position={[0.4, 0.8, 0.4]} rotation={[0.5, 0.5, 0]}>
                <coneGeometry args={[0.2, 1, 8]} />
                <meshStandardMaterial color="#888888" metalness={0.8} />
            </mesh>
            {/* Raised the second box to not clip underground. 0.2 -> 0.8 (Base at ~0.05) */}
            <mesh position={[-0.4, 0.8, -0.4]} rotation={[-0.5, 0, 0.5]}>
                <boxGeometry args={[0.3, 1.5, 0.3]} />
                <meshStandardMaterial color="#333333" metalness={0.5} />
            </mesh>
        </group>
    );
};
