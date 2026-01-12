import { useRef } from 'react';
import { useBox } from '@react-three/cannon';
import { useGameStore } from '../../store/gameStore';

export const RemodelingDoor = ({ position, rotation }: { position: [number, number, number], rotation: [number, number, number] }) => {
    const setLevel = useGameStore((state) => state.setLevel);
    const setInteractionText = useGameStore((state) => state.setInteractionText);
    const meshRef = useRef<any>(null);

    // Physics body (Static Door)
    const [ref] = useBox(() => ({
        type: 'Static',
        position,
        rotation,
        args: [1.8, 3.2, 0.2] // Door Size (Smaller)
    }));

    const handleInteract = () => {
        setInteractionText(null);
        console.log("Entering Level 0.2...");
        setLevel('LEVEL_0_2');
    };

    const userData = {
        interactive: true,
        type: 'door',
        label: "Open Door",
        onInteract: handleInteract
    };

    return (
        <group ref={ref as any}>
            <mesh
                ref={meshRef}
                userData={userData}
                onPointerOver={() => setInteractionText(`[E] ${userData.label}`)}
                onPointerOut={() => setInteractionText(null)}
                castShadow
                receiveShadow
            >
                <boxGeometry args={[1.8, 3.2, 0.2]} />
                <meshStandardMaterial color="#eeeeee" roughness={0.1} metalness={0.1} />
            </mesh>

            <mesh position={[0, 0, 0]} scale={[1.1, 1.05, 1.2]}>
                <boxGeometry args={[1.8, 3.2, 0.2]} />
                <meshStandardMaterial color="#ffffff" />
            </mesh>

            {/* Knob */}
            <mesh position={[0.7, 0, 0.15]}>
                <sphereGeometry args={[0.15]} />
                <meshStandardMaterial color="#gold" metalness={1} roughness={0} />
            </mesh>
        </group>
    );
};
