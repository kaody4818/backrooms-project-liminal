import { usePlane, useBox } from '@react-three/cannon';
import { useMemo } from 'react';
import { DoubleSide, RepeatWrapping, NearestFilter, TextureLoader } from 'three';
import { createConcreteTexture, createWoodBoxTexture } from '../../utils/textureGenerator';
import { CELL_SIZE, WALL_HEIGHT } from '../../utils/mapGenerator';
import { ConcretePillar } from './ConcretePillar';
import { Crate } from '../entities/Crate';
import { FluorescentLight } from './FluorescentLight';

interface Level1Props {
    map: number[][]; // 0=Floor, 1=Wall
    pillarPositions: [number, number][]; // Grid coordinates
    cratePositions: [number, number][]; // Grid coordinates
}

export const Level1 = ({ map, pillarPositions, cratePositions }: Level1Props) => {
    const height = map.length;
    const width = map[0].length;

    // World Dimensions
    const worldWidth = width * CELL_SIZE;
    const worldHeight = height * CELL_SIZE;

    // Textures - Load Sync to avoid Suspense Freeze
    const concreteTexture = useMemo(() => {
        // Use Real Texture Generation now that optimization is in place (shared texture)
        const url = createConcreteTexture();
        const tex = new TextureLoader().load(url);
        tex.wrapS = RepeatWrapping;
        tex.wrapT = RepeatWrapping;
        tex.repeat.set(width / 2, height / 2);
        tex.magFilter = NearestFilter;
        tex.minFilter = NearestFilter;
        return tex;
    }, [width, height]);

    const woodBoxTexture = useMemo(() => {
        const url = createWoodBoxTexture();
        const tex = new TextureLoader().load(url);
        return tex;
    }, []);

    // Lights
    const lights = useMemo(() => {
        const arr = [];
        // Grid spacing for lights (every 6 cells = 30 units)
        for (let z = 3; z < height - 3; z += 6) {
            for (let x = 3; x < width - 3; x += 6) {
                const xPos = x * CELL_SIZE - worldWidth / 2 + CELL_SIZE / 2;
                const zPos = z * CELL_SIZE - worldHeight / 2 + CELL_SIZE / 2;
                arr.push(
                    <FluorescentLight
                        key={`l1-light-${x}-${z}`}
                        position={[xPos, 6 - 0.2, zPos]}
                    />
                );
            }
        }
        return arr;
    }, [height, width, worldWidth, worldHeight]);

    // Floor Physics
    const [floorRef] = usePlane(() => ({
        rotation: [-Math.PI / 2, 0, 0],
        position: [0, 0, 0],
        type: 'Static',
    }));

    // Ceiling Physics
    const WAREHOUSE_HEIGHT = 6;
    const [ceilingRef] = usePlane(() => ({
        rotation: [Math.PI / 2, 0, 0],
        position: [0, WAREHOUSE_HEIGHT, 0],
        type: 'Static',
    }));


    return (
        <group>
            {/* Floor */}
            <mesh ref={floorRef} receiveShadow>
                <planeGeometry args={[worldWidth, worldHeight]} />
                <meshStandardMaterial map={concreteTexture} roughness={0.9} color="#555555" />
            </mesh>

            {/* Ceiling */}
            <mesh ref={ceilingRef}>
                <planeGeometry args={[worldWidth, worldHeight]} />
                <meshStandardMaterial map={concreteTexture} color="#333333" side={DoubleSide} />
            </mesh>

            {/* Walls */}
            {map.map((row, z) =>
                row.map((cell, x) => {
                    if (cell === 1) {
                        const xPos = x * CELL_SIZE - worldWidth / 2 + CELL_SIZE / 2;
                        const zPos = z * CELL_SIZE - worldHeight / 2 + CELL_SIZE / 2;
                        return (
                            <WallBlock
                                key={`wall-${x}-${z}`}
                                position={[xPos, WAREHOUSE_HEIGHT / 2, zPos]}
                                height={WAREHOUSE_HEIGHT}
                                texture={concreteTexture}
                            />
                        );
                    }
                    return null;
                })
            )}

            {/* Pillars */}
            {pillarPositions.map(([px, pz], i) => {
                const xPos = px * CELL_SIZE - worldWidth / 2 + CELL_SIZE / 2;
                const zPos = pz * CELL_SIZE - worldHeight / 2 + CELL_SIZE / 2;
                return (
                    <ConcretePillar
                        key={`pillar-${i}`}
                        position={[xPos, WAREHOUSE_HEIGHT / 2, zPos]}
                        height={WAREHOUSE_HEIGHT}
                        texture={concreteTexture}
                    />
                );
            })}

            {/* Crates */}
            {cratePositions.map(([cx, cz], i) => {
                const xPos = cx * CELL_SIZE - worldWidth / 2 + CELL_SIZE / 2;
                const zPos = cz * CELL_SIZE - worldHeight / 2 + CELL_SIZE / 2;
                return (
                    <Crate
                        key={`crate-${i}`}
                        position={[xPos, 0.5, zPos]}
                        texture={woodBoxTexture}
                    />
                );
            })}

            {/* Ceiling Lights */}
            {lights}

            {/* Fog for Atmosphere (Dark Grey/Black for Level 1) */}
            <fog attach="fog" args={['#111111', 5, 60]} />
            <color attach="background" args={['#111111']} />
        </group>
    );
};

// Helper Wall Component (Reused logic from Level.tsx roughly)
const WallBlock = ({ position, height, texture }: { position: [number, number, number], height: number, texture: any }) => {
    const [ref] = useBox(() => ({
        type: 'Static',
        position,
        args: [CELL_SIZE, height, CELL_SIZE],
    }));

    // Clone texture to avoid shared repeat issues if needed, or use world triplanar in future.
    // For now, simple mapping.

    return (
        <mesh ref={ref} receiveShadow>
            <boxGeometry args={[CELL_SIZE, height, CELL_SIZE]} />
            <meshStandardMaterial map={texture} color="#666666" />
        </mesh>
    );
};
