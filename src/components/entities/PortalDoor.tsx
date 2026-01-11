import { useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store/gameStore';
import { useBox } from '@react-three/cannon';

export const PortalDoor = ({ position, rotation }: { position: [number, number, number], rotation: [number, number, number] }) => {
    const [hovered, setHover] = useState(false);
    const setLevel = useGameStore((state) => state.setLevel);
    const currentLevel = useGameStore((state) => state.currentLevel);
    const setInteractionText = useGameStore((state) => state.setInteractionText);

    // Physics body for collision (Static)
    const [ref] = useBox(() => ({
        type: 'Static',
        position,
        rotation,
        args: [1.2, 2.5, 0.2] // Size
    }));

    const handleInteract = () => {
        // Transition Logic
        const targetLevel = currentLevel === 'LEVEL_0' ? 'LEVEL_0_2' : 'LEVEL_0';
        console.log(`Transitioning to ${targetLevel}...`);
        setLevel(targetLevel);
        setInteractionText(null);
    };

    useFrame(() => {
        if (hovered) {
            const label = currentLevel === 'LEVEL_0' ? "Enter Clean Door" : "Return to Reality";
            setInteractionText(`[E] ${label}`);
        }
    });

    return (
        <group ref={ref as any}>
            {/* Door Frame */}
            <mesh position={[0, 1.25, 0]} castShadow receiveShadow
                onPointerOver={() => setHover(true)}
                onPointerOut={() => { setHover(false); setInteractionText(null); }}
                onClick={(e) => {
                    e.stopPropagation();
                    // Distance check handled by Player usually, but here we force it for simplicity if close enough
                    if (e.distance < 3) handleInteract();
                }}
            >
                <boxGeometry args={[1.2, 2.5, 0.1]} />
                <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.1} />
            </mesh>

            {/* Inner Door Panel (Slightly recessed) */}
            <mesh position={[0, 1.25, 0.02]} castShadow>
                <boxGeometry args={[1.0, 2.3, 0.05]} />
                <meshStandardMaterial color="#f0f0f0" roughness={0.2} />
            </mesh>

            {/* Knob */}
            <mesh position={[0.4, 1.2, 0.06]} castShadow>
                <sphereGeometry args={[0.05]} />
                <meshStandardMaterial color="gold" metalness={0.8} roughness={0.1} />
            </mesh>

            {/* Omni-light from the door (Inviting) */}
            <pointLight position={[0, 2, 0.5]} intensity={1} distance={3} color="#ffffff" />
        </group>
    );
};
