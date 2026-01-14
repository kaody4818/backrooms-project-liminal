import { useCompoundBody, usePlane } from '@react-three/cannon';
import { useLayoutEffect, useMemo, useRef, type ReactElement } from 'react';
import { DoubleSide, InstancedMesh, MeshStandardMaterial, Object3D, RepeatWrapping, TextureLoader } from 'three';

import { CELL_SIZE, SECTOR_AQUILA, SECTOR_GILD, SECTOR_GOTHIC, SECTOR_OUROBOROS } from '../../utils/mapGenerator';
import { Crate } from '../entities/Crate';
import { Contraption } from '../entities/Contraption';
import { ShadowWorker } from '../entities/ShadowWorker';
import { ConcretePillar } from './ConcretePillar';
import { FluorescentLight } from './FluorescentLight';
import { Furniture } from '../entities/Furniture';
import { Door } from '../entities/Door';
import type { FurnitureItem, DoorItem } from '../../utils/mapGenerator';

interface Level1Props {
    map: number[][]; // 0=Floor, 1=Wall
    pillarPositions: [number, number][]; // Grid coordinates
    cratePositions: [number, number][]; // Grid coordinates
    contraptionPositions: [number, number][];
    workerPositions: [number, number][];
    sectorMap: number[][];
    furniturePositions: FurnitureItem[];
    doorPositions: DoorItem[];
}

const WAREHOUSE_HEIGHT = 6;

export const Level1 = ({ map, pillarPositions, cratePositions, contraptionPositions, workerPositions, sectorMap, furniturePositions, doorPositions }: Level1Props) => {
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
            woodBox: load('/textures/wood_crate.png'),
            gothicWall: load('/textures/l1_gothic_wall.png'),
            gothicFloor: load('/textures/l1_gothic_floor.png'),
            gothicPillar: load('/textures/l1_gothic_pillar.png'),
            ouroborosWall: load('/textures/l1_ouroboros_wall.png'),
            ouroborosFloor: load('/textures/l1_ouroboros_floor.png'),
        };

        const matData = {
            aquilaWall: new MeshStandardMaterial({ map: texData.aquilaWall }),
            gildWall: new MeshStandardMaterial({ map: texData.gildWall }),
            corridorWall: new MeshStandardMaterial({ map: texData.corridorWall }),
            concreteFloor: new MeshStandardMaterial({ map: texData.concreteFloor }),
            gildFloor: new MeshStandardMaterial({ map: texData.gildFloor }),
            ceilingPipes: new MeshStandardMaterial({ map: texData.ceilingPipes, side: DoubleSide }),
            ceilingConcrete: new MeshStandardMaterial({ map: texData.concreteFloor, side: DoubleSide }),
            woodBox: new MeshStandardMaterial({ map: texData.woodBox }),
            gothicWall: new MeshStandardMaterial({ map: texData.gothicWall }),
            gothicFloor: new MeshStandardMaterial({ map: texData.gothicFloor }),
            ouroborosWall: new MeshStandardMaterial({ map: texData.ouroborosWall }),
            ouroborosFloor: new MeshStandardMaterial({ map: texData.ouroborosFloor }),
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
    const floorGothicRef = useRef<InstancedMesh>(null);
    const floorOuroborosRef = useRef<InstancedMesh>(null);
    const ceilingConcreteRef = useRef<InstancedMesh>(null);
    const ceilingPipesRef = useRef<InstancedMesh>(null);
    const ceilingGothicRef = useRef<InstancedMesh>(null);

    // Wall Face Refs
    const wallAquilaRef = useRef<InstancedMesh>(null);
    const wallGildRef = useRef<InstancedMesh>(null);
    const wallCorridorRef = useRef<InstancedMesh>(null);
    const wallGothicRef = useRef<InstancedMesh>(null);
    const wallOuroborosRef = useRef<InstancedMesh>(null);

    // Layout Effect for Matrices
    useLayoutEffect(() => {
        if (!floorConcreteRef.current || !floorGildRef.current || !floorGothicRef.current || !floorOuroborosRef.current || !ceilingConcreteRef.current || !ceilingPipesRef.current || !ceilingGothicRef.current ||
            !wallAquilaRef.current || !wallGildRef.current || !wallCorridorRef.current || !wallGothicRef.current || !wallOuroborosRef.current) return;

        let floorConcreteCount = 0;
        let floorGildCount = 0;
        let floorGothicCount = 0;
        let floorOuroborosCount = 0;
        let ceilingConcreteCount = 0;
        let ceilingPipesCount = 0;
        let ceilingGothicCount = 0;

        let wallAquilaCount = 0;
        let wallGildCount = 0;
        let wallCorridorCount = 0;
        let wallGothicCount = 0;
        let wallOuroborosCount = 0;

        const dummy = new Object3D();

        const addFace = (xPos: number, zPos: number, yRot: number, textureType: number) => {
            dummy.position.set(xPos, WAREHOUSE_HEIGHT / 2, zPos);
            dummy.rotation.set(0, yRot, 0); // Rotate around Y
            dummy.updateMatrix();

            if (textureType === SECTOR_AQUILA) wallAquilaRef.current!.setMatrixAt(wallAquilaCount++, dummy.matrix);
            else if (textureType === SECTOR_GILD) wallGildRef.current!.setMatrixAt(wallGildCount++, dummy.matrix);
            else if (textureType === SECTOR_GOTHIC) wallGothicRef.current!.setMatrixAt(wallGothicCount++, dummy.matrix);
            else if (textureType === SECTOR_OUROBOROS) wallOuroborosRef.current!.setMatrixAt(wallOuroborosCount++, dummy.matrix);
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
                    else if (sector === SECTOR_GOTHIC) floorGothicRef.current!.setMatrixAt(floorGothicCount++, dummy.matrix);
                    else if (sector === SECTOR_OUROBOROS) floorOuroborosRef.current!.setMatrixAt(floorOuroborosCount++, dummy.matrix);
                    else floorConcreteRef.current!.setMatrixAt(floorConcreteCount++, dummy.matrix);

                    // Ceiling
                    dummy.position.set(xPos, WAREHOUSE_HEIGHT - 0.01, zPos);
                    dummy.rotation.set(Math.PI / 2, 0, 0);
                    dummy.updateMatrix();
                    if (sector === SECTOR_GILD) ceilingPipesRef.current!.setMatrixAt(ceilingPipesCount++, dummy.matrix);
                    else if (sector === SECTOR_GOTHIC) ceilingGothicRef.current!.setMatrixAt(ceilingGothicCount++, dummy.matrix);
                    // Ouroboros has unfinished ceiling (pipes or open?) -> Let's use Pipes for now or default concrete
                    else if (sector === SECTOR_OUROBOROS) ceilingPipesRef.current!.setMatrixAt(ceilingPipesCount++, dummy.matrix);
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

        floorGothicRef.current!.count = floorGothicCount;
        floorGothicRef.current!.instanceMatrix.needsUpdate = true;

        ceilingGothicRef.current!.count = ceilingGothicCount;
        ceilingGothicRef.current!.instanceMatrix.needsUpdate = true;

        wallGothicRef.current!.count = wallGothicCount;
        wallGothicRef.current!.instanceMatrix.needsUpdate = true;

        floorOuroborosRef.current!.count = floorOuroborosCount;
        floorOuroborosRef.current!.instanceMatrix.needsUpdate = true;

        wallOuroborosRef.current!.count = wallOuroborosCount;
        wallOuroborosRef.current!.instanceMatrix.needsUpdate = true;

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
            <instancedMesh ref={floorGothicRef} args={[undefined, undefined, maxInstances]} receiveShadow>
                <planeGeometry args={[CELL_SIZE, CELL_SIZE]} />
                <primitive object={materials.gothicFloor} attach="material" />
            </instancedMesh>
            <instancedMesh ref={floorOuroborosRef} args={[undefined, undefined, maxInstances]} receiveShadow>
                <planeGeometry args={[CELL_SIZE, CELL_SIZE]} />
                <primitive object={materials.ouroborosFloor} attach="material" />
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
            <instancedMesh ref={ceilingGothicRef} args={[undefined, undefined, maxInstances]}>
                <planeGeometry args={[CELL_SIZE, CELL_SIZE]} />
                <primitive object={materials.gothicFloor} attach="material" />
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
            <instancedMesh ref={wallGothicRef} args={[undefined, undefined, maxInstances]} receiveShadow>
                <planeGeometry args={[CELL_SIZE, WAREHOUSE_HEIGHT]} />
                <primitive object={materials.gothicWall} attach="material" />
            </instancedMesh>
            <instancedMesh ref={wallOuroborosRef} args={[undefined, undefined, maxInstances]} receiveShadow>
                <planeGeometry args={[CELL_SIZE, WAREHOUSE_HEIGHT]} />
                <primitive object={materials.ouroborosWall} attach="material" />
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
                        texture={sectorMap[pz][px] === SECTOR_GOTHIC ? textures.gothicPillar : textures.aquilaPillar}
                        shape={sectorMap[pz][px] === SECTOR_GOTHIC ? 'cylinder' : 'box'}
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

            {/* Contraptions */}
            {contraptionPositions.map(([cx, cz], i) => {
                const xPos = cx * CELL_SIZE - worldWidth / 2 + CELL_SIZE / 2;
                const zPos = cz * CELL_SIZE - worldHeight / 2 + CELL_SIZE / 2;
                return (
                    <Contraption
                        key={`contraption-${i}`}
                        position={[xPos, 0, zPos]}
                    />
                );
            })}

            {/* Workers */}
            {workerPositions.map(([wx, wz], i) => {
                const xPos = wx * CELL_SIZE - worldWidth / 2 + CELL_SIZE / 2;
                const zPos = wz * CELL_SIZE - worldHeight / 2 + CELL_SIZE / 2;
                return (
                    <ShadowWorker
                        key={`worker-${i}`}
                        position={[xPos, 1.25, zPos]}
                    />
                );
            })}

            {/* Furniture */}
            {furniturePositions?.map((item, i) => {
                const xPos = item.x * CELL_SIZE - worldWidth / 2 + CELL_SIZE / 2;
                const zPos = item.y * CELL_SIZE - worldHeight / 2 + CELL_SIZE / 2;
                return (
                    <Furniture
                        key={`furniture-${i}`}
                        position={[xPos, 0, zPos]}
                        rotation={item.rotation}
                        type={item.type}
                    />
                );
            })}

            {/* Doors */}
            {doorPositions?.map((item, i) => {
                const xPos = item.x * CELL_SIZE - worldWidth / 2 + CELL_SIZE / 2;
                const zPos = item.y * CELL_SIZE - worldHeight / 2 + CELL_SIZE / 2;
                return (
                    <Door
                        key={`door-${i}`}
                        position={[xPos, 0, zPos]}
                        rotation={item.rotation}
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
