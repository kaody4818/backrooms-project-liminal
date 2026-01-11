import { usePlane, useBox } from '@react-three/cannon';
import { useMemo, useRef, useLayoutEffect } from 'react';
import { NearestFilter, RepeatWrapping, TextureLoader, Object3D, InstancedMesh } from 'three';
import { CELL_SIZE, WALL_HEIGHT } from '../../utils/mapGenerator';
import {
    createCarpetTexture,
    createWallpaperTexture,
    createManilaWallTexture,
    createWoodFloorTexture,
    createCeilingTileTexture
} from '../../utils/textureGenerator';
import { ShadowMan } from '../entities/ShadowMan';
import { Note } from './Note';
import { FluorescentLight } from './FluorescentLight';

// Helper: Textured Plane (Floor)
function TexturedPlane({ args, textureUrl, repeats = 1, ...props }: any) {
    const [ref] = usePlane(() => ({ rotation: [-Math.PI / 2, 0, 0], ...props }));

    const texture = useMemo(() => new TextureLoader().load(textureUrl), [textureUrl]);

    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(repeats, repeats);
    texture.magFilter = NearestFilter;
    texture.minFilter = NearestFilter;

    return (
        <mesh ref={ref as any} receiveShadow>
            <planeGeometry args={args} />
            <meshStandardMaterial map={texture} roughness={0.8} />
        </mesh>
    );
}

// Helper: Ceiling Plane (Chunked for Lighting Optimization)
function Ceiling({ mapWidth, mapHeight, textureUrl }: { mapWidth: number, mapHeight: number, textureUrl: string }) {
    const texture = useMemo(() => {
        const t = new TextureLoader().load(textureUrl);
        t.wrapS = RepeatWrapping;
        t.wrapT = RepeatWrapping;
        t.magFilter = NearestFilter;
        t.minFilter = NearestFilter;
        return t;
    }, [textureUrl]);

    const chunks = [];
    const CHUNK_CELLS = 5; // 5x5 cells per chunk

    // Total offsets to center the map
    const totalWidth = mapWidth * CELL_SIZE;
    const totalHeight = mapHeight * CELL_SIZE;
    const offsetX = totalWidth / 2;
    const offsetZ = totalHeight / 2;

    for (let y = 0; y < mapHeight; y += CHUNK_CELLS) {
        for (let x = 0; x < mapWidth; x += CHUNK_CELLS) {
            // Calculate size of this chunk (handle edges if not divisible)
            const cw = Math.min(CHUNK_CELLS, mapWidth - x) * CELL_SIZE;
            const ch = Math.min(CHUNK_CELLS, mapHeight - y) * CELL_SIZE;

            // Texture Repeat: 1 unit per 5 world units logic
            const clonedTexture = texture.clone();
            clonedTexture.repeat.set(cw / 5, ch / 5);
            clonedTexture.needsUpdate = true;

            // Center of this chunk in world space
            // logical x starts at x. World x = x * CELL_SIZE - offsetX
            // But plane origin is center.
            // Left edge = x * CELL_SIZE - offsetX
            // Center X = Left + cw/2
            const posX = (x * CELL_SIZE) - offsetX + (cw / 2);
            const posZ = (y * CELL_SIZE) - offsetZ + (ch / 2);

            chunks.push(
                <mesh
                    key={`ceil-${x}-${y}`}
                    position={[posX, WALL_HEIGHT, posZ]}
                    rotation={[Math.PI / 2, 0, 0]}
                    receiveShadow={false} // Ceiling usually doesn't need to receive shadows from walls if lit by ambient+points
                >
                    <planeGeometry args={[cw, ch]} />
                    <meshStandardMaterial map={clonedTexture} roughness={0.9} />
                </mesh>
            );
        }
    }

    return <group>{chunks}</group>;
}

// Helper: Invisible Physics Wall - handles collisions but renders nothing
function PhysicsWall({ position }: { position: [number, number, number] }) {
    useBox(() => ({
        position,
        args: [CELL_SIZE, WALL_HEIGHT, CELL_SIZE],
        type: 'Static'
    }));
    return null;
}

// Helper: Table for Manila Room
function Table({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            {/* Table Top */}
            <mesh position={[0, 1, 0]} castShadow>
                <boxGeometry args={[1.5, 0.1, 1]} />
                <meshStandardMaterial color="#8b5a2b" />
            </mesh>
            {/* Legs */}
            <mesh position={[-0.6, 0.5, -0.4]} castShadow>
                <boxGeometry args={[0.1, 1, 0.1]} />
                <meshStandardMaterial color="#8b5a2b" />
            </mesh>
            <mesh position={[0.6, 0.5, -0.4]} castShadow>
                <boxGeometry args={[0.1, 1, 0.1]} />
                <meshStandardMaterial color="#8b5a2b" />
            </mesh>
            <mesh position={[-0.6, 0.5, 0.4]} castShadow>
                <boxGeometry args={[0.1, 1, 0.1]} />
                <meshStandardMaterial color="#8b5a2b" />
            </mesh>
            <mesh position={[0.6, 0.5, 0.4]} castShadow>
                <boxGeometry args={[0.1, 1, 0.1]} />
                <meshStandardMaterial color="#8b5a2b" />
            </mesh>

            {/* Chair */}
            <mesh position={[0, 0.5, 0.8]} castShadow>
                <boxGeometry args={[0.5, 1, 0.5]} />
                <meshStandardMaterial color="#5c3a1e" />
            </mesh>
        </group>
    );
}

// Main Component
export const Level = ({ map, manilaPos }: { map: number[][], manilaPos?: [number, number] }) => {
    // Generate floor size based on map size
    const floorSize = map.length * CELL_SIZE;

    // Generate Textures ONCE
    const { wallpaperUrl, carpetUrl, manilaWallUrl, woodFloorUrl, ceilingUrl } = useMemo(() => ({
        wallpaperUrl: createWallpaperTexture(),
        carpetUrl: createCarpetTexture(),
        manilaWallUrl: createManilaWallTexture(),
        woodFloorUrl: createWoodFloorTexture(),
        ceilingUrl: createCeilingTileTexture(),
    }), []);

    const wallpaperTexture = useMemo(() => {
        const t = new TextureLoader().load(wallpaperUrl);
        t.magFilter = NearestFilter;
        return t;
    }, [wallpaperUrl]);

    const manilaWallTexture = useMemo(() => {
        const t = new TextureLoader().load(manilaWallUrl);
        t.magFilter = NearestFilter;
        t.wrapS = RepeatWrapping;
        t.wrapT = RepeatWrapping;
        return t;
    }, [manilaWallUrl]);

    // Refs for Instanced Meshes
    const standardWallRef = useRef<InstancedMesh>(null);
    const manilaWallRef = useRef<InstancedMesh>(null);

    // Data collections
    const standardWallData: { position: [number, number, number] }[] = [];
    const manilaWallData: { position: [number, number, number] }[] = [];

    const physicsWalls: any[] = [];
    const entities: any[] = [];
    const manilaRoomFurniture: any[] = [];
    const looseElements: any[] = [];

    // Center the map around (0,0)
    const offset = (map.length * CELL_SIZE) / 2;

    // Iterate Map using for loops
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[0].length; x++) {
            const posX = x * CELL_SIZE - offset;
            const posZ = y * CELL_SIZE - offset;

            if (map[y][x] === 1) {
                // Wall Logic
                let isManilaWall = false;
                if (manilaPos) {
                    const [mx, my] = manilaPos;
                    // Check adjacency (3x3 grid around manila center)
                    if (Math.abs(x - mx) <= 1 && Math.abs(y - my) <= 1) {
                        isManilaWall = true;
                    }
                }

                if (isManilaWall) {
                    manilaWallData.push({ position: [posX, WALL_HEIGHT / 2, posZ] });
                } else {
                    standardWallData.push({ position: [posX, WALL_HEIGHT / 2, posZ] });
                }

                // Invisible Physics Body
                physicsWalls.push(
                    <PhysicsWall key={`pwall-${x}-${y}`} position={[posX, WALL_HEIGHT / 2, posZ]} />
                );

            } else {
                // Floor/Empty Logic

                // 1. Lights (Odd grid spots for paths)
                if (x % 4 === 1 && y % 4 === 1) {
                    looseElements.push(
                        <FluorescentLight key={`light-${x}-${y}`} position={[posX, WALL_HEIGHT - 0.26, posZ]} />
                    );
                }

                // 2. Manila Room Center
                if (manilaPos && x === manilaPos[0] && y === manilaPos[1]) {
                    // Overlay Wood Floor
                    manilaRoomFurniture.push(
                        <TexturedPlane
                            key={`woodfloor-${x}-${y}`}
                            position={[posX, 0.05, posZ]}
                            args={[CELL_SIZE, CELL_SIZE]}
                            textureUrl={woodFloorUrl}
                            repeats={1}
                        />
                    );

                    // Furniture
                    manilaRoomFurniture.push(
                        <Table key={`manila-${x}-${y}`} position={[posX, 0, posZ]} />
                    );
                    manilaRoomFurniture.push(
                        <Note key={`note-${x}-${y}`} position={[posX, 1.05, posZ]} />
                    );

                    // Warm Light
                    manilaRoomFurniture.push(
                        <pointLight
                            key={`light-${x}-${y}`}
                            position={[posX, 2.5, posZ]}
                            intensity={2.5}
                            distance={8}
                            color="#ffaa44"
                            castShadow
                        />
                    );
                } else {
                    // 3. Spawning ShadowMan
                    if (Math.random() < 0.008 && (x !== 1 || y !== 1)) {
                        entities.push(
                            <ShadowMan
                                key={`entity-${x}-${y}`}
                                position={[posX, 1.25, posZ]}
                            />
                        );
                    }
                }
            }
        }
    }

    useLayoutEffect(() => {
        const tempObject = new Object3D();

        // Update Standard Walls
        if (standardWallRef.current && standardWallData.length > 0) {
            standardWallData.forEach((data, i) => {
                tempObject.position.set(data.position[0], data.position[1], data.position[2]);
                tempObject.updateMatrix();
                standardWallRef.current!.setMatrixAt(i, tempObject.matrix);
            });
            standardWallRef.current.instanceMatrix.needsUpdate = true;
        }

        // Update Manila Walls
        if (manilaWallRef.current && manilaWallData.length > 0) {
            manilaWallData.forEach((data, i) => {
                tempObject.position.set(data.position[0], data.position[1], data.position[2]);
                tempObject.updateMatrix();
                manilaWallRef.current!.setMatrixAt(i, tempObject.matrix);
            });
            manilaWallRef.current.instanceMatrix.needsUpdate = true;
        }
    }, [standardWallData.length, manilaWallData.length]);

    return (
        <group>
            {/* Physics + Visual Floor */}
            <TexturedPlane
                position={[0, 0, 0]}
                args={[floorSize * 1.5, floorSize * 1.5]}
                textureUrl={carpetUrl}
                repeats={floorSize / 5}
            />

            {/* Ceiling (Chunked) */}
            <Ceiling
                mapWidth={map[0].length}
                mapHeight={map.length}
                textureUrl={ceilingUrl}
            />

            {/* Instanced Standard Walls */}
            <instancedMesh
                ref={standardWallRef}
                args={[undefined, undefined, standardWallData.length]}
                receiveShadow
                castShadow
            >
                <boxGeometry args={[CELL_SIZE, WALL_HEIGHT, CELL_SIZE]} />
                <meshStandardMaterial map={wallpaperTexture} color="#ccc" />
            </instancedMesh>

            {/* Instanced Manila Walls */}
            <instancedMesh
                ref={manilaWallRef}
                args={[undefined, undefined, manilaWallData.length]}
                receiveShadow
                castShadow
            >
                <boxGeometry args={[CELL_SIZE, WALL_HEIGHT, CELL_SIZE]} />
                <meshStandardMaterial map={manilaWallTexture} color="#ccc" />
            </instancedMesh>

            {/* Invisible Physics Walls */}
            {physicsWalls}

            {/* Other Elements */}
            {looseElements}
            {entities}
            {manilaRoomFurniture}
        </group>
    );
};
