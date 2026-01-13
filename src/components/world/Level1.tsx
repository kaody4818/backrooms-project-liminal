import { useCompoundBody, usePlane } from '@react-three/cannon';
import { useLayoutEffect, useMemo, useRef, type ReactElement } from 'react';
import { DoubleSide, InstancedMesh, MeshStandardMaterial, Object3D, RepeatWrapping, TextureLoader } from 'three';

import { CELL_SIZE, SECTOR_AQUILA, SECTOR_GILD } from '../../utils/mapGenerator';
import { Crate } from '../entities/Crate';
import { ConcretePillar } from './ConcretePillar';
import { FluorescentLight } from './FluorescentLight';

interface Level1Props {
    map: number[][]; // 0=Floor, 1=Wall
    pillarPositions: [number, number][]; // Grid coordinates
    cratePositions: [number, number][]; // Grid coordinates
    sectorMap: number[][];
}

const WAREHOUSE_HEIGHT = 6;

export const Level1 = ({ map, pillarPositions, cratePositions, sectorMap }: Level1Props) => {
    const height = map.length;
    const width = map[0].length;

    // World Dimensions
    const worldWidth = width * CELL_SIZE;
    const worldHeight = height * CELL_SIZE;

    // --- Texture & Material Loading ---
    const { materials, textures } = useMemo(() => {
        const loader = new TextureLoader();

        const load = (url: string) => {
            const tex = loader.load(url);
            tex.wrapS = RepeatWrapping;
            tex.wrapT = RepeatWrapping;
            return tex;
        };

        const texData = {
            aquilaWall: load('/textures/l1_aquila_wall.png'),
            aquilaPillar: load('/textures/l1_aquila_pillar.png'),
            gildWall: load('/textures/l1_gild_wall.png'),
            gildFloor: load('/textures/l1_gild_floor.png'),
            ceilingPipes: load('/textures/l1_ceiling_pipes.png'),
            corridorWall: load('/textures/l1_corridor_wall.png'),
            concreteFloor: load('/textures/concrete_floor.png'), // Aquila/Corridor Floor
            woodBox: load('/textures/wood_crate.png')
        };

        const matData = {
            aquilaWall: new MeshStandardMaterial({ map: texData.aquilaWall }),
            gildWall: new MeshStandardMaterial({ map: texData.gildWall }),
            corridorWall: new MeshStandardMaterial({ map: texData.corridorWall }),
            concreteFloor: new MeshStandardMaterial({ map: texData.concreteFloor }),
            gildFloor: new MeshStandardMaterial({ map: texData.gildFloor }),
            ceilingPipes: new MeshStandardMaterial({ map: texData.ceilingPipes, side: DoubleSide }),
            ceilingConcrete: new MeshStandardMaterial({ map: texData.concreteFloor, side: DoubleSide }),
            woodBox: new MeshStandardMaterial({ map: texData.woodBox })
        };

        return { materials: matData, textures: texData };
    }, []);

    // --- Physics ---
    // Floor & Ceiling Planes
    usePlane(() => ({ rotation: [-Math.PI / 2, 0, 0], position: [0, 0, 0], type: 'Static' }));
    usePlane(() => ({ rotation: [Math.PI / 2, 0, 0], position: [0, WAREHOUSE_HEIGHT, 0], type: 'Static' }));

    // Compound Wall Physics
    // We calculate shapes ONCE inside the hook callback to avoid re-renders
    useCompoundBody(() => {
        const shapes: any[] = [];

        // Loop Map to find Walls
        for (let z = 0; z < height; z++) {
            for (let x = 0; x < width; x++) {
                if (map[z][x] === 1) {
                    const xPos = x * CELL_SIZE - worldWidth / 2 + CELL_SIZE / 2;
                    const zPos = z * CELL_SIZE - worldHeight / 2 + CELL_SIZE / 2;

                    // Cannon shapes use half-extents? NO, react-three/cannon uses Full Extents for Box args usually.
                    // If we passed half-extents, we created walls with 0.5 size, leaving 0.5 gaps!
                    shapes.push({
                        type: 'Box',
                        position: [xPos, WAREHOUSE_HEIGHT / 2, zPos],
                        args: [CELL_SIZE, WAREHOUSE_HEIGHT, CELL_SIZE]
                    });
                }
            }
        }
        return {
            mass: 0,
            type: 'Static',
            shapes
        };
    }, null, [map, worldWidth, worldHeight]);


    // --- InstancedMesh Visuals ---
    // Refs
    const floorConcreteRef = useRef<InstancedMesh>(null);
    const floorGildRef = useRef<InstancedMesh>(null);
    const ceilingConcreteRef = useRef<InstancedMesh>(null);
    const ceilingPipesRef = useRef<InstancedMesh>(null);

    // Wall Face Refs
    const wallAquilaRef = useRef<InstancedMesh>(null);
    const wallGildRef = useRef<InstancedMesh>(null);
    const wallCorridorRef = useRef<InstancedMesh>(null);

    // Layout Effect for Matrices
    useLayoutEffect(() => {
        if (!floorConcreteRef.current || !floorGildRef.current || !ceilingConcreteRef.current || !ceilingPipesRef.current ||
            !wallAquilaRef.current || !wallGildRef.current || !wallCorridorRef.current) return;

        let floorConcreteCount = 0;
        let floorGildCount = 0;
        let ceilingConcreteCount = 0;
        let ceilingPipesCount = 0;

        let wallAquilaCount = 0;
        let wallGildCount = 0;
        let wallCorridorCount = 0;

        const dummy = new Object3D();

        const addFace = (xPos: number, zPos: number, yRot: number, textureType: number) => {
            dummy.position.set(xPos, WAREHOUSE_HEIGHT / 2, zPos);
            dummy.rotation.set(0, yRot, 0); // Rotate around Y
            dummy.updateMatrix();

            if (textureType === SECTOR_AQUILA) wallAquilaRef.current!.setMatrixAt(wallAquilaCount++, dummy.matrix);
            else if (textureType === SECTOR_GILD) wallGildRef.current!.setMatrixAt(wallGildCount++, dummy.matrix);
            else wallCorridorRef.current!.setMatrixAt(wallCorridorCount++, dummy.matrix);
        };

        map.forEach((row, z) => {
            row.forEach((cell, x) => {
                const sector = sectorMap[z][x];

                // Position logic
                const xPos = x * CELL_SIZE - worldWidth / 2 + CELL_SIZE / 2;
                const zPos = z * CELL_SIZE - worldHeight / 2 + CELL_SIZE / 2;

                // --- 1. Floors & Ceilings ---
                // Render only if cell === 0 (Floor)
                if (cell === 0) {
                    // Floor
                    dummy.position.set(xPos, 0.01, zPos);
                    dummy.rotation.set(-Math.PI / 2, 0, 0);
                    dummy.updateMatrix();
                    if (sector === SECTOR_GILD) floorGildRef.current!.setMatrixAt(floorGildCount++, dummy.matrix);
                    else floorConcreteRef.current!.setMatrixAt(floorConcreteCount++, dummy.matrix);

                    // Ceiling
                    dummy.position.set(xPos, WAREHOUSE_HEIGHT - 0.01, zPos);
                    dummy.rotation.set(Math.PI / 2, 0, 0);
                    dummy.updateMatrix();
                    if (sector === SECTOR_GILD) ceilingPipesRef.current!.setMatrixAt(ceilingPipesCount++, dummy.matrix);
                    else ceilingConcreteRef.current!.setMatrixAt(ceilingConcreteCount++, dummy.matrix);
                }

                // --- 2. Walls (Faces) ---
                if (cell === 1) {
                    // Check 4 directions for exposed faces
                    // North (z-1)
                    if (z > 0 && map[z - 1][x] === 0) {
                        const s = sectorMap[z - 1][x];
                        addFace(xPos, zPos - CELL_SIZE / 2, Math.PI, s); // Facing Back, push to edge z-
                    }
                    // South (z+1)
                    if (z < height - 1 && map[z + 1][x] === 0) {
                        const s = sectorMap[z + 1][x];
                        addFace(xPos, zPos + CELL_SIZE / 2, 0, s); // Facing Front
                    }
                    // West (x-1)
                    if (x > 0 && map[z][x - 1] === 0) {
                        const s = sectorMap[z][x - 1];
                        addFace(xPos - CELL_SIZE / 2, zPos, -Math.PI / 2, s); // Facing Left
                    }
                    // East (x+1)
                    if (x < width - 1 && map[z][x + 1] === 0) {
                        const s = sectorMap[z][x + 1];
                        addFace(xPos + CELL_SIZE / 2, zPos, Math.PI / 2, s); // Facing Right
                    }
                }
            });
        });

        // Update Ranges (using count to limit draw)
        floorConcreteRef.current.count = floorConcreteCount;
        floorConcreteRef.current.instanceMatrix.needsUpdate = true;

        floorGildRef.current.count = floorGildCount;
        floorGildRef.current.instanceMatrix.needsUpdate = true;

        ceilingConcreteRef.current.count = ceilingConcreteCount;
        ceilingConcreteRef.current.instanceMatrix.needsUpdate = true;

        ceilingPipesRef.current.count = ceilingPipesCount;
        ceilingPipesRef.current.instanceMatrix.needsUpdate = true;

        wallAquilaRef.current!.count = wallAquilaCount;
        wallAquilaRef.current!.instanceMatrix.needsUpdate = true;

        wallGildRef.current!.count = wallGildCount;
        wallGildRef.current!.instanceMatrix.needsUpdate = true;

        wallCorridorRef.current!.count = wallCorridorCount;
        wallCorridorRef.current!.instanceMatrix.needsUpdate = true;

    }, [map, sectorMap, worldWidth, worldHeight]);

    const maxInstances = width * height * 5; // Safe upper bound

    // Lights
    const lights = useMemo(() => {
        const elements: ReactElement[] = [];
        // Grid spacing for lights (every 6 cells = 30 units)
        for (let z = 3; z < height - 3; z += 6) {
            for (let x = 3; x < width - 3; x += 6) {
                const xPos = x * CELL_SIZE - worldWidth / 2 + CELL_SIZE / 2;
                const zPos = z * CELL_SIZE - worldHeight / 2 + CELL_SIZE / 2;
                elements.push(
                    <FluorescentLight
                        key={`l1-light-${x}-${z}`}
                        position={[xPos, 6 - 0.2, zPos]}
                    />
                );
            }
        }
        return elements;
    }, [height, width, worldWidth, worldHeight]);

    return (
        <group>
            {/* --- Floor Instances --- */}
            <instancedMesh ref={floorConcreteRef} args={[undefined, undefined, maxInstances]} receiveShadow>
                <planeGeometry args={[CELL_SIZE, CELL_SIZE]} />
                <primitive object={materials.concreteFloor} attach="material" />
            </instancedMesh>
            <instancedMesh ref={floorGildRef} args={[undefined, undefined, maxInstances]} receiveShadow>
                <planeGeometry args={[CELL_SIZE, CELL_SIZE]} />
                <primitive object={materials.gildFloor} attach="material" />
            </instancedMesh>

            {/* --- Ceiling Instances --- */}
            <instancedMesh ref={ceilingConcreteRef} args={[undefined, undefined, maxInstances]}>
                <planeGeometry args={[CELL_SIZE, CELL_SIZE]} />
                <primitive object={materials.ceilingConcrete} attach="material" />
            </instancedMesh>
            <instancedMesh ref={ceilingPipesRef} args={[undefined, undefined, maxInstances]}>
                <planeGeometry args={[CELL_SIZE, CELL_SIZE]} />
                <primitive object={materials.ceilingPipes} attach="material" />
            </instancedMesh>

            {/* --- Wall Face Instances (Visuals Only) --- */}
            <instancedMesh ref={wallAquilaRef} args={[undefined, undefined, maxInstances]} receiveShadow>
                <planeGeometry args={[CELL_SIZE, WAREHOUSE_HEIGHT]} />
                <primitive object={materials.aquilaWall} attach="material" />
            </instancedMesh>
            <instancedMesh ref={wallGildRef} args={[undefined, undefined, maxInstances]} receiveShadow>
                <planeGeometry args={[CELL_SIZE, WAREHOUSE_HEIGHT]} />
                <primitive object={materials.gildWall} attach="material" />
            </instancedMesh>
            <instancedMesh ref={wallCorridorRef} args={[undefined, undefined, maxInstances]} receiveShadow>
                <planeGeometry args={[CELL_SIZE, WAREHOUSE_HEIGHT]} />
                <primitive object={materials.corridorWall} attach="material" />
            </instancedMesh>

            {/* --- Static Props --- */}
            {/* Pillars */}
            {pillarPositions.map(([px, pz], i) => {
                const xPos = px * CELL_SIZE - worldWidth / 2 + CELL_SIZE / 2;
                const zPos = pz * CELL_SIZE - worldHeight / 2 + CELL_SIZE / 2;
                return (
                    <ConcretePillar
                        key={`pillar-${i}`}
                        position={[xPos, WAREHOUSE_HEIGHT / 2, zPos]}
                        height={WAREHOUSE_HEIGHT}
                        texture={textures.aquilaPillar}
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

            {/* Fog & Lights */}
            {lights}
            <fog attach="fog" args={['#111111', 15, 60]} />
            <color attach="background" args={['#111111']} />
        </group>
    );
};
