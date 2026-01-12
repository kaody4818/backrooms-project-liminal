import { useBox } from '@react-three/cannon';

export const Crate = ({ position, texture }: { position: [number, number, number], texture: any }) => {
    // Dynamic Crate with Mass (Movable)
    const [ref] = useBox(() => ({
        mass: 1,
        position,
        args: [1, 1, 1],
    }));

    return (
        <mesh ref={ref} castShadow receiveShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial map={texture} color="#cc9966" roughness={0.7} />
        </mesh>
    );
};
