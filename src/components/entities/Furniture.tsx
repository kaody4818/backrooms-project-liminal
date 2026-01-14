import { useBox } from '@react-three/cannon';
import { useMemo } from 'react';

interface FurnitureProps {
    position: [number, number, number];
    rotation: number;
    type: 'computer_table' | 'hospital_bed' | 'chair' | 'painting';
}

export const Furniture = ({ position, rotation, type }: FurnitureProps) => {

    const config = useMemo(() => {
        if (type === 'computer_table') {
            return {
                size: [2, 1.5, 1.2] as [number, number, number],
                yOffset: 0.75,
                name: 'Office Table'
            };
        }
        if (type === 'hospital_bed') {
            return {
                size: [2, 1, 3.5] as [number, number, number],
                yOffset: 0.5,
                name: 'Infirmary Bed'
            };
        }
        if (type === 'chair') {
            return {
                size: [0.8, 1, 0.8] as [number, number, number],
                yOffset: 0.5,
                name: 'Chair'
            };
        }
        if (type === 'painting') {
            return {
                size: [1.5, 1.5, 0.1] as [number, number, number],
                yOffset: 0.1, // On floor
                name: 'Floor Painting'
            };
        }
        // Fallback
        return { size: [1, 1, 1] as [number, number, number], yOffset: 0.5, name: 'Unknown' };
    }, [type]);

    // Physics Body (Simple Box Wrapper)
    const [ref] = useBox(() => ({
        mass: type === 'chair' ? 5 : 50, // Heavy static-ish or light dynamic
        type: type === 'chair' ? 'Dynamic' : 'Static',
        position: [position[0], config.yOffset, position[2]],
        rotation: [0, rotation, 0],
        args: config.size,
        // Group 3: Furniture
        collisionFilterGroup: 3,
        // Mask: 1 (Default/Player/Walls). Exclude 2 (Door).
        collisionFilterMask: 1,
        // Lock rotation for dynamic items (Chair) so they don't tip over
        angularFactor: type === 'chair' ? [0, 1, 0] : [1, 1, 1],
    }));

    return (
        <group ref={ref as any}>
            {/* 1. Office Table Model */}
            {type === 'computer_table' && (
                <group position={[0, -config.size[1] / 2, 0]}>
                    {/* Table Top */}
                    <mesh position={[0, 1.4, 0]} castShadow receiveShadow>
                        <boxGeometry args={[2, 0.1, 1.2]} />
                        <meshStandardMaterial color="#5c4033" />
                    </mesh>
                    {/* Legs (Back Panel style) */}
                    <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
                        <boxGeometry args={[1.8, 1.4, 1]} />
                        <meshStandardMaterial color="#3e2b22" />
                    </mesh>
                    {/* Monitor */}
                    <mesh position={[0, 1.8, 0.2]}>
                        <boxGeometry args={[0.8, 0.6, 0.1]} />
                        <meshStandardMaterial color="#111" />
                    </mesh>
                    <mesh position={[0, 1.5, 0.2]}>
                        <boxGeometry args={[0.2, 0.2, 0.1]} />
                        <meshStandardMaterial color="#222" />
                    </mesh>
                    {/* Keyboard */}
                    <mesh position={[0, 1.46, -0.3]}>
                        <boxGeometry args={[0.6, 0.02, 0.2]} />
                        <meshStandardMaterial color="#333" />
                    </mesh>
                </group>
            )}

            {/* 2. Hospital Bed Model */}
            {type === 'hospital_bed' && (
                <group position={[0, -config.size[1] / 2, 0]}>
                    {/* Metal Frame */}
                    <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
                        <boxGeometry args={[1.9, 0.8, 3.4]} />
                        <meshStandardMaterial color="#888899" />
                    </mesh>
                    {/* Mattress */}
                    <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
                        <boxGeometry args={[1.8, 0.2, 3.3]} />
                        <meshStandardMaterial color="#eeeeee" />
                    </mesh>
                    {/* Pillow */}
                    <mesh position={[0, 1.05, -1.2]} castShadow receiveShadow>
                        <boxGeometry args={[1.2, 0.1, 0.6]} />
                        <meshStandardMaterial color="#ffffff" />
                    </mesh>
                    {/* Rails */}
                    <mesh position={[0.95, 0.8, 0]}>
                        <boxGeometry args={[0.05, 0.6, 2]} />
                        <meshStandardMaterial color="#666" />
                    </mesh>
                    <mesh position={[-0.95, 0.8, 0]}>
                        <boxGeometry args={[0.05, 0.6, 2]} />
                        <meshStandardMaterial color="#666" />
                    </mesh>
                </group>
            )}

            {/* 3. Chair Model */}
            {type === 'chair' && (
                <group position={[0, -config.size[1] / 2, 0]}>
                    {/* Seat */}
                    <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
                        <boxGeometry args={[0.8, 0.1, 0.8]} />
                        <meshStandardMaterial color="#333" />
                    </mesh>
                    {/* Legs */}
                    <mesh position={[0.3, 0.25, 0.3]}>
                        <boxGeometry args={[0.1, 0.5, 0.1]} />
                        <meshStandardMaterial color="#666" />
                    </mesh>
                    <mesh position={[-0.3, 0.25, 0.3]}>
                        <boxGeometry args={[0.1, 0.5, 0.1]} />
                        <meshStandardMaterial color="#666" />
                    </mesh>
                    <mesh position={[0.3, 0.25, -0.3]}>
                        <boxGeometry args={[0.1, 0.5, 0.1]} />
                        <meshStandardMaterial color="#666" />
                    </mesh>
                    <mesh position={[-0.3, 0.25, -0.3]}>
                        <boxGeometry args={[0.1, 0.5, 0.1]} />
                        <meshStandardMaterial color="#666" />
                    </mesh>
                    {/* Backrest */}
                    <mesh position={[0, 1, -0.35]}>
                        <boxGeometry args={[0.8, 1, 0.1]} />
                        <meshStandardMaterial color="#333" />
                    </mesh>
                </group>
            )}

            {/* 4. Painting (Floor/Wall) */}
            {type === 'painting' && (
                <group position={[0, -config.size[1] / 2, 0]}>
                    {/* Canvas Frame (Leaning slightly?) */}
                    <mesh position={[0, 0.75, 0]} rotation={[-0.1, 0, 0]} castShadow receiveShadow>
                        <boxGeometry args={[1.5, 1.5, 0.05]} />
                        <meshStandardMaterial color="#aa8800" />
                    </mesh>
                    {/* Canvas Content */}
                    <mesh position={[0, 0.75, 0.03]} rotation={[-0.1, 0, 0]}>
                        <planeGeometry args={[1.3, 1.3]} />
                        <meshStandardMaterial color="#cc4444" emissive="#330000" />
                        {/* Placeholder abstract art color */}
                    </mesh>
                </group>
            )}

            {/* Fallback Debug Box */}
            {!['computer_table', 'hospital_bed', 'chair', 'painting'].includes(type) && (
                <mesh>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshStandardMaterial color="magenta" />
                </mesh>
            )}
        </group>
    );
};
