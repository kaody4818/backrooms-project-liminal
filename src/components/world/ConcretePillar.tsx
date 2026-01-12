import { useBox } from '@react-three/cannon';

export const ConcretePillar = ({ position, height = 5, texture }: { position: [number, number, number], height?: number, texture: any }) => {
    // 1x1 Pillar
    const [ref] = useBox(() => ({
        mass: 0,
        type: 'Static',
        position,
        args: [1, height, 1],
    }));

    return (
        <mesh ref={ref} castShadow receiveShadow>
            <boxGeometry args={[1, height, 1]} />
            <meshStandardMaterial map={texture} roughness={0.8} />
        </mesh>
    );
};
