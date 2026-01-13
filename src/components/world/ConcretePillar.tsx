import { useBox, useCylinder } from '@react-three/cannon';

export interface ConcretePillarProps {
    position: [number, number, number];
    height?: number;
    texture: any;
    shape?: 'box' | 'cylinder'; // New prop
}

export const ConcretePillar = ({ position, height = 5, texture, shape = 'box' }: ConcretePillarProps) => {
    // We need to conditionally use hooks, but hooks can't be conditional.
    // So we'll split this into two components likely, OR we can just use a single hook if we change args?
    // Cannon hooks return different ref types (box vs cylinder).
    // Better to have a wrapper or separate components.
    // Let's create a sub-component for each or valid logic.

    // Actually simplicity: Let's just make two components inside this file or toggle based on prop?
    // You cannot call hooks conditionally.

    if (shape === 'cylinder') {
        return <CylinderPillar position={position} height={height} texture={texture} />;
    }
    return <BoxPillar position={position} height={height} texture={texture} />;
};

const BoxPillar = ({ position, height, texture }: any) => {
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
}

const CylinderPillar = ({ position, height, texture }: any) => {
    // Cylinder physics args: [radiusTop, radiusBottom, height, numSegments]
    // Visual radius 0.5 (diameter 1) to match 1x1 box footprint approx
    const [ref] = useCylinder(() => ({
        mass: 0,
        type: 'Static',
        position,
        args: [0.5, 0.5, height, 16],
    }));
    return (
        <mesh ref={ref} castShadow receiveShadow>
            <cylinderGeometry args={[0.5, 0.5, height, 32]} />
            <meshStandardMaterial map={texture} roughness={0.8} />
        </mesh>
    );
}
