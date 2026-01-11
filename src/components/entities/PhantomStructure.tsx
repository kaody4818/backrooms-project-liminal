import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Group } from 'three';

interface PhantomStructureProps {
    position: [number, number, number];
    rotation?: [number, number, number];
    type: 'DOOR' | 'STAIRS';
    onVanish: () => void;
}

export const PhantomStructure = ({ position, rotation = [0, 0, 0], type, onVanish }: PhantomStructureProps) => {
    const ref = useRef<Group>(null);
    const { camera } = useThree();

    useFrame(() => {
        if (!ref.current) return;

        // Vanish Logic:
        // 1. If player gets too close (< 2 units)
        const dist = camera.position.distanceTo(ref.current.position);
        if (dist < 3) {
            onVanish();
        }

        // 2. If player looks directly at it? (Maybe only for shadow man, doors can just vanish when close)
    });

    return (
        <group ref={ref} position={position} rotation={rotation}>
            {type === 'DOOR' && (
                <group>
                    {/* Frame */}
                    <mesh position={[0, 1.65, 0]}>
                        <boxGeometry args={[1.8, 3.3, 0.1]} />
                        <meshStandardMaterial color="#3a2a1a" />
                    </mesh>
                    {/* Inner Black Void */}
                    <mesh position={[0, 1.65, 0.06]}>
                        <planeGeometry args={[1.5, 3]} />
                        <meshBasicMaterial color="black" />
                    </mesh>
                    {/* Knob */}
                    <mesh position={[0.7, 1.6, 0.08]}>
                        <sphereGeometry args={[0.08]} />
                        <meshStandardMaterial color="gold" roughness={0.5} metalness={0.8} />
                    </mesh>
                </group>
            )}

            {type === 'STAIRS' && (
                <group>
                    {/* Simple ramp/stairs illusion */}
                    <mesh position={[0, 1, 0]} rotation={[-0.2, 0, 0]}>
                        <boxGeometry args={[2, 4, 0.2]} />
                        <meshStandardMaterial color="#c2b280" />
                    </mesh>
                    <mesh position={[0, 1.5, -1]}>
                        <boxGeometry args={[2, 3, 0.1]} />
                        <meshBasicMaterial color="black" />
                    </mesh>
                </group>
            )}
        </group>
    );
};
