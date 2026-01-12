import { usePlane, useBox } from '@react-three/cannon';
import { useMemo } from 'react';
import { DoubleSide, RepeatWrapping, TextureLoader } from 'three';

import { CELL_SIZE } from '../../utils/mapGenerator';
import { ConcretePillar } from './ConcretePillar';
import { Crate } from '../entities/Crate';
import { FluorescentLight } from './FluorescentLight';

interface Level1Props {
    map: number[][]; // 0=Floor, 1=Wall
    pillarPositions: [number, number][]; // Grid coordinates
    cratePositions: [number, number][]; // Grid coordinates
    sectorMap?: number[][];
}

export const Level1 = ({ map, pillarPositions, cratePositions, sectorMap }: Level1Props) => {
    const height = map.length;
    const width = map[0].length;

    // World Dimensions
    const worldWidth = width * CELL_SIZE;
    const worldHeight = height * CELL_SIZE;

    // Textures - Load Sync to avoid Suspense Freeze
    const concreteTexture = useMemo(() => {
        const url = '/textures/concrete_floor.png';
        const tex = new TextureLoader().load(url);
        tex.wrapS = RepeatWrapping;
        tex.wrapT = RepeatWrapping;
        tex.repeat.set(width / 2, height / 2);
        return tex;
    }, [width, height]);

    const woodBoxTexture = useMemo(() => {
        return new TextureLoader().load('/textures/wood_crate.png');
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

                        // Determine Sector Style
                        // sectorDiff removed as it was unused.

                        // Heuristic: Check neighbors. If neighbor is AQUILA, I am AQUILA wall.
                        // Walls in mapGenerator might still be 0 (None) in sectorMap if they weren't carved.
                        // We need to look at adjacent floors to decide wall color?
                        // Or imply that mapGenerator sets sectorMap for walls too?
                        // Currently generateLevel1 only sets sectorMap for FLOORS (0). Walls (1) remain 0 (None).

                        // Heuristic: Check neighbors. If neighbor is AQUILA, I am AQUILA wall.
                        let wallColor = "#666666"; // Default Grey
                        let neighborSector = 0;
                        if (sectorMap) {
                            // Check orthogonal neighbors
                            if (x > 0 && sectorMap[z][x - 1] !== 0) neighborSector = sectorMap[z][x - 1];
                            else if (x < width - 1 && sectorMap[z][x + 1] !== 0) neighborSector = sectorMap[z][x + 1];
                            else if (z > 0 && sectorMap[z - 1][x] !== 0) neighborSector = sectorMap[z - 1][x];
                            else if (z < height - 1 && sectorMap[z + 1][x] !== 0) neighborSector = sectorMap[z + 1][x];

                            if (neighborSector === 1) wallColor = "#555555"; // Aquila (Generic Concrete)
                            if (neighborSector === 2) wallColor = "#8B4513"; // Gild (Brown/Wood/Gold)
                            if (neighborSector === 3) wallColor = "#333333"; // Corridor (Dark)
                        }

                        return (
                            <WallBlock
                                key={`wall-${x}-${z}`}
                                position={[xPos, WAREHOUSE_HEIGHT / 2, zPos]}
                                height={WAREHOUSE_HEIGHT}
                                texture={concreteTexture}
                                color={wallColor}
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
                        isStatic={true}
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

// Helper Wall Component
const WallBlock = ({ position, height, texture, color = "#666666" }: { position: [number, number, number], height: number, texture: any, color?: string }) => {
    const [ref] = useBox(() => ({
        type: 'Static',
        position,
        args: [CELL_SIZE, height, CELL_SIZE],
    }));

    return (
        <mesh ref={ref} receiveShadow>
            <boxGeometry args={[CELL_SIZE, height, CELL_SIZE]} />
            <meshStandardMaterial map={texture} color={color} />
        </mesh>
    );
};
