import { useBox, usePlane } from '@react-three/cannon';
import { useMemo, type ReactElement } from 'react';
import { DoubleSide, RepeatWrapping, TextureLoader } from 'three';

import { CELL_SIZE, SECTOR_AQUILA, SECTOR_CORRIDOR, SECTOR_GILD } from '../../utils/mapGenerator';
import { Crate } from '../entities/Crate';
import { ConcretePillar } from './ConcretePillar';
import { FluorescentLight } from './FluorescentLight';

interface Level1Props {
    map: number[][]; // 0=Floor, 1=Wall
    pillarPositions: [number, number][]; // Grid coordinates
    cratePositions: [number, number][]; // Grid coordinates
    sectorMap: number[][];
}

export const Level1 = ({ map, pillarPositions, cratePositions, sectorMap }: Level1Props) => {
    const height = map.length;
    const width = map[0].length;

    // World Dimensions
    const worldWidth = width * CELL_SIZE;
    const worldHeight = height * CELL_SIZE;

    // --- Texture Loading ---
    const textures = useMemo(() => {
        const loader = new TextureLoader();

        const load = (url: string) => {
            const tex = loader.load(url);
            tex.wrapS = RepeatWrapping;
            tex.wrapT = RepeatWrapping;
            return tex;
        };

        return {
            aquilaWall: load('/textures/l1_aquila_wall.png'),
            aquilaPillar: load('/textures/l1_aquila_pillar.png'),
            gildWall: load('/textures/l1_gild_wall.png'),
            gildFloor: load('/textures/l1_gild_floor.png'),
            ceilingPipes: load('/textures/l1_ceiling_pipes.png'),
            corridorWall: load('/textures/l1_corridor_wall.png'),
            concreteFloor: load('/textures/concrete_floor.png'), // Aquila/Corridor Floor
            woodBox: load('/textures/wood_crate.png')
        };
    }, []);

    // --- Physics ---

    // Floor Physics (Single Plane for simplicity/performance)
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


    // --- Rendering Helpers ---
    // We render individual tiles based on sector to apply correct textures.
    // This loops over the map and generates mesh elements.

    const renderLevel = useMemo(() => {
        const elements: ReactElement[] = [];

        map.forEach((row, z) => {
            row.forEach((cell, x) => {
                const sector = sectorMap[z][x];

                // Position logic
                const xPos = x * CELL_SIZE - worldWidth / 2 + CELL_SIZE / 2;
                const zPos = z * CELL_SIZE - worldHeight / 2 + CELL_SIZE / 2;

                // --- 1. WALLS ---
                if (cell === 1) {
                    // Logic: A wall's face should match the theme of the room it is facing.
                    // If neighbor is Aquila (and open), that face should be Aquila texture.
                    // If neighbor is Wall, it's hidden, so default to Corridor.

                    const getSectorTexture = (nx: number, nz: number) => {
                        if (nx < 0 || nx >= width || nz < 0 || nz >= height) return textures.corridorWall; // Out of bounds

                        // If neighbor is a wall, use OUR sector (or default) to avoid leaks? 
                        // Actually, if it's a wall, the face is hidden.
                        // But if we want consistent internal logic: check neighbor sector.
                        const s = sectorMap[nz][nx];
                        if (s === SECTOR_AQUILA) return textures.aquilaWall;
                        if (s === SECTOR_GILD) return textures.gildWall;
                        return textures.corridorWall;
                    };

                    // Three.js Box Material Order: Right (px), Left (nx), Top (py), Bottom (ny), Front (pz), Back (nz)
                    // Our Grid: x+ (Right), x- (Left), y+ (Up), y- (Down), z+ (Front/South), z- (Back/North)

                    const matRight = getSectorTexture(x + 1, z);
                    const matLeft = getSectorTexture(x - 1, z);
                    const matTop = textures.concreteFloor; // Generic top
                    const matBottom = textures.concreteFloor; // Generic bottom
                    const matFront = getSectorTexture(x, z + 1);
                    const matBack = getSectorTexture(x, z - 1);

                    elements.push(
                        <WallBlockMulti
                            key={`wall-${x}-${z}`}
                            position={[xPos, WAREHOUSE_HEIGHT / 2, zPos]}
                            height={WAREHOUSE_HEIGHT}
                            materials={[matRight, matLeft, matTop, matBottom, matFront, matBack]}
                        />
                    );
                }
                // --- 2. FLOORS & CEILINGS (for empty space 0 usually) ---
                // Even walls need floors/ceilings above/below them technically, but we only verify walkables (0)
                // Actually, if we use a giant plane for physics, visuals should be tiled on top.
                // We should make the physics plane invisible and render tiles on top.

                // Let's render Floor/Ceiling Tiles for every cell (0 or 1) to cover the map.

                // Floor Texture
                let floorTex = textures.concreteFloor;
                if (sector === SECTOR_GILD) floorTex = textures.gildFloor;

                // Ceiling Texture
                let ceilingTex = textures.concreteFloor; // Default Grey
                if (sector === SECTOR_GILD) ceilingTex = textures.ceilingPipes;

                // Floor Tile
                elements.push(
                    <mesh key={`fl-${x}-${z}`} position={[xPos, 0.01, zPos]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                        <planeGeometry args={[CELL_SIZE, CELL_SIZE]} />
                        <meshStandardMaterial map={floorTex} />
                    </mesh>
                );

                // Ceiling Tile
                elements.push(
                    <mesh key={`cl-${x}-${z}`} position={[xPos, WAREHOUSE_HEIGHT - 0.01, zPos]} rotation={[Math.PI / 2, 0, 0]}>
                        <planeGeometry args={[CELL_SIZE, CELL_SIZE]} />
                        <meshStandardMaterial map={ceilingTex} side={DoubleSide} />
                    </mesh>
                );
            });
        });

        return elements;
    }, [map, sectorMap, textures, width, height, worldWidth, worldHeight]);


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


    return (
        <group>
            {/* Invisible Physics Planes */}
            <mesh ref={floorRef} visible={false}>
                <planeGeometry args={[worldWidth, worldHeight]} />
            </mesh>
            <mesh ref={ceilingRef} visible={false}>
                <planeGeometry args={[worldWidth, worldHeight]} />
            </mesh>

            {/* Rendered World (Walls, Floor Tiles, Ceiling Tiles) */}
            {renderLevel}

            {/* Pillars */}
            {pillarPositions.map(([px, pz], i) => {
                const xPos = px * CELL_SIZE - worldWidth / 2 + CELL_SIZE / 2;
                const zPos = pz * CELL_SIZE - worldHeight / 2 + CELL_SIZE / 2;
                return (
                    <ConcretePillar
                        key={`pillar-${i}`}
                        position={[xPos, WAREHOUSE_HEIGHT / 2, zPos]}
                        height={WAREHOUSE_HEIGHT}
                        texture={textures.aquilaPillar} // Use Aquila texture for pillars
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
                        texture={textures.woodBox}
                        isStatic={true}
                    />
                );
            })}

            {/* Ceiling Lights */}
            {lights}

            {/* Fog for Atmosphere */}
            <fog attach="fog" args={['#111111', 15, 60]} />
            <color attach="background" args={['#111111']} />
        </group>
    );
};

// Replace WallBlock with WallBlockMulti to support array of materials
const WallBlockMulti = ({ position, height, materials }: { position: [number, number, number], height: number, materials: any[] }) => {
    const [ref] = useBox(() => ({
        type: 'Static',
        position,
        args: [CELL_SIZE, height, CELL_SIZE],
    }));

    return (
        <mesh ref={ref} receiveShadow>
            <boxGeometry args={[CELL_SIZE, height, CELL_SIZE]} />
            {/* Map materials array to meshStandardMaterials for each face */}
            {materials.map((map, index) => (
                <meshStandardMaterial key={index} attach={`material-${index}`} map={map} />
            ))}
        </mesh>
    );
};
