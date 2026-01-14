import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useState } from 'react';
import { Vector3, Group } from 'three';
import { useGameStore } from '../../store/gameStore';

export const Contraption = ({ position }: { position: [number, number, number] }) => {
    const isPaused = useGameStore((state) => state.isPaused);
    const setHealth = useGameStore((state) => state.setHealth);
    const setInteractionText = useGameStore((state) => state.setInteractionText);
    const { camera } = useThree();
    const groupRef = useRef<Group>(null);
    const gearRef = useRef<Group>(null);
    const [lastDamageTime, setLastDamageTime] = useState(0);

    useFrame((state) => {
        if (!groupRef.current || isPaused) return;

        // 1. Rotate Main Hub (Vertical Spin)
        // Removed Z-axis rotation to prevent floor clipping.
        groupRef.current.rotation.y += 0.02;

        // 2. Rotate Internal Gear (Counter-spin)
        if (gearRef.current) {
            gearRef.current.rotation.y -= 0.05;
            gearRef.current.rotation.z += 0.02; // Local wobble is fine if high enough
        }

        // Damage Logic (Horizontal Distance Only)
        const playerPos = new Vector3(camera.position.x, 0, camera.position.z);
        const entityPos = new Vector3(groupRef.current.position.x, 0, groupRef.current.position.z);
        const dist = playerPos.distanceTo(entityPos);

        if (dist < 1.2) { // Slightly larger radius
            const now = state.clock.elapsedTime;
            if (now - lastDamageTime > 1.0) {
                setHealth((prev) => Math.max(0, prev - 10));
                setInteractionText("Warning: Industrial Hazard!");
                setLastDamageTime(now);

                setTimeout(() => {
                    useGameStore.getState().setInteractionText(null);
                }, 2000);
            }
        }
    });

    return (
        <group ref={groupRef} position={position}>
            {/* 1. Base (Heavy Stand) */}
            <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.6, 0.8, 0.4, 8]} />
                <meshStandardMaterial color="#2a2a2a" roughness={0.9} />
            </mesh>

            {/* 2. Main Center Shaft */}
            <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.2, 0.2, 3, 6]} />
                <meshStandardMaterial color="#888" metalness={0.6} roughness={0.4} />
            </mesh>

            {/* 3. Top Cap */}
            <mesh position={[0, 2.8, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.5, 0.2, 0.4, 8]} />
                <meshStandardMaterial color="#444" />
            </mesh>

            {/* 4. Spinning "Grinder" mechanism (Child object) */}
            <group ref={gearRef} position={[0, 1.5, 0]}>
                {/* Horizontal Blades */}
                <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
                    <boxGeometry args={[0.1, 2.5, 0.4]} />
                    <meshStandardMaterial color="#a00" metalness={0.7} />
                </mesh>
                <mesh rotation={[0, Math.PI / 2, Math.PI / 2]} castShadow receiveShadow>
                    <boxGeometry args={[0.1, 2.5, 0.4]} />
                    <meshStandardMaterial color="#a00" metalness={0.7} />
                </mesh>

                {/* Diagonal Spikes */}
                <mesh rotation={[0, Math.PI / 4, Math.PI / 4]} position={[0, 0, 0]} castShadow receiveShadow>
                    <boxGeometry args={[0.1, 1.8, 0.1]} />
                    <meshStandardMaterial color="#silver" />
                </mesh>
                <mesh rotation={[0, -Math.PI / 4, -Math.PI / 4]} position={[0, 0, 0]} castShadow receiveShadow>
                    <boxGeometry args={[0.1, 1.8, 0.1]} />
                    <meshStandardMaterial color="#silver" />
                </mesh>
            </group>
        </group>
    );
};
