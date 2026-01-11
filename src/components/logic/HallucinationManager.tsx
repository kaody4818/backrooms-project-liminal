import { useEffect, useRef, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store/gameStore';
import { Vector3, Raycaster, Vector2, Matrix4, InstancedMesh } from 'three';
import { PhantomStructure } from '../entities/PhantomStructure';

// Event Types
type EventType = 'NONE' | 'HUM_SWELL' | 'PHANTOM_DOOR' | 'WHISPER';



export const HallucinationManager = () => {
    const { sanity, setAmbientVolumeScale } = useGameStore();
    const { camera, scene } = useThree();

    const [currentEvent, setCurrentEvent] = useState<EventType>('NONE');
    const [phantomProps, setPhantomProps] = useState<{ position: [number, number, number], rotation: [number, number, number] } | null>(null);

    // Refs for event logic to avoid re-renders or stale closures during animation frames
    const eventTime = useRef(0);
    const eventDuration = useRef(0);
    const active = useRef(false);

    // Audio Refs
    const humState = useRef<'RISING' | 'SILENCE' | 'FADING'>('RISING');

    // Polling for random events
    useEffect(() => {
        if (currentEvent !== 'NONE') return;

        const checkInterval = setInterval(() => {
            if (active.current) return;

            // Chance increases as sanity drops (sanity < 80 starts triggers)
            // 80 sanity = 0% chance (if formula is clamped), let's say sanity < 80.
            if (sanity > 90) return; // Too sane

            const chance = 0.05 + (90 - sanity) * 0.005; // 5% + up to 45%

            if (Math.random() < chance) {
                // Roll for event type
                const roll = Math.random();
                if (roll < 0.4) {
                    triggerHumSwell();
                } else if (roll < 0.8) {
                    triggerPhantomDoor();
                } else {
                    // Placeholder for others
                    // console.log("Did not trigger other events yet.");
                }
            }
        }, 5000);

        return () => clearInterval(checkInterval);
    }, [sanity, currentEvent]);

    // Debug Trigger
    useEffect(() => {
        const handleDebugKey = (e: KeyboardEvent) => {
            if (e.code === 'KeyH') {
                console.log("DEBUG: Force triggering hallucination...");
                if (Math.random() < 0.5) triggerHumSwell();
                else triggerPhantomDoor();
            }
        };
        window.addEventListener('keydown', handleDebugKey);
        return () => window.removeEventListener('keydown', handleDebugKey);
    }, []);


    const triggerHumSwell = () => {
        console.log("EVENT STARTED: Hum Swell");
        setCurrentEvent('HUM_SWELL');
        active.current = true;
        eventTime.current = 0;
        eventDuration.current = 10; // 10s build up
        humState.current = 'RISING';
    };

    const triggerPhantomDoor = () => {
        console.log("EVENT STARTED: Phantom Door");

        const raycaster = new Raycaster();
        raycaster.setFromCamera(new Vector2(0, 0), camera); // Center of screen

        // Intersect all
        const intersects = raycaster.intersectObjects(scene.children, true);

        // Find valid wall hit
        const hit = intersects.find(i => {
            if (!i.face) return false;

            // Strictly target InstancedMesh (Walls) to avoid lights, floor, ceiling
            if (!(i.object as any).isInstancedMesh) return false;

            // Distance check (Reduced min distance to find walls in corridors)
            if (i.distance < 1.5 || i.distance > 25) return false;

            // Check for vertical surface (Wall). Ignore Floor/Ceiling.
            if (Math.abs(i.face.normal.y) > 0.1) return false;

            return true;
        });

        if (!hit) {
            console.log("DEBUG: No valid wall found (Checked " + intersects.length + " objects)");
        } else {
            console.log("DEBUG: Wall Hit at distance " + hit.distance);
        }

        let position: [number, number, number];
        let rotation: [number, number, number];

        if (hit && hit.face) {
            // Wall Hit Logic (Guaranteed InstancedMesh now)
            const normal = hit.face.normal.clone();

            const mesh = hit.object as InstancedMesh;
            // Ensure instanceId exists
            if (hit.instanceId !== undefined) {
                const instanceMatrix = new Matrix4();
                mesh.getMatrixAt(hit.instanceId, instanceMatrix);

                // Combine World * Instance
                const finalMatrix = new Matrix4().multiplyMatrices(mesh.matrixWorld, instanceMatrix);
                normal.transformDirection(finalMatrix).normalize();
            } else {
                // Fallback if no instance ID (shouldn't happen for InstancedMesh hit)
                normal.transformDirection(hit.object.matrixWorld).normalize();
            }

            // Position: Move out by 0.1 to avoid clipping (Door thickness is ~0.1 total)
            const pos = hit.point.clone().add(normal.multiplyScalar(0.1));

            // Orient door to match wall normal side (facing out)
            // Use atan2 for robust Y-rotation calculation
            const rotY = Math.atan2(normal.x, normal.z);

            position = [pos.x, 0, pos.z];
            rotation = [0, rotY, 0];

        } else {
            // Fallback: If no wall found, don't spawn floating door?
            // Or keep floating logic but ensure it's further away?
            // User wants them "on the wall". So maybe prefer not to spawn if no wall?
            // Let's keep fallback but maybe log it failed to find wall.
            // Or actually, let's keep the fallback but make it rare or try searching wider?
            // For now, keep fallback for gameplay reliability, but maybe push it further.

            const dir = new Vector3();
            camera.getWorldDirection(dir);
            dir.y = 0;
            dir.normalize();
            const spawnPos = new Vector3().copy(camera.position).add(dir.multiplyScalar(10));

            const rotY = Math.atan2(
                camera.position.x - spawnPos.x,
                camera.position.z - spawnPos.z
            );

            position = [spawnPos.x, 0, spawnPos.z];
            rotation = [0, rotY, 0];
        }

        setPhantomProps({ position, rotation });
        setCurrentEvent('PHANTOM_DOOR');
        active.current = true;
    };

    const endPhantomEvent = () => {
        console.log("EVENT ENDED: Phantom Door Vanished");
        setCurrentEvent('NONE');
        active.current = false;
        setPhantomProps(null);
    };


    useFrame((_, delta) => {
        if (currentEvent === 'NONE' || useGameStore.getState().isPaused) return;

        eventTime.current += delta;

        // --- HUM SWELL LOGIC ---
        if (currentEvent === 'HUM_SWELL') {
            if (humState.current === 'RISING') {
                // Rise for duration
                const t = Math.min(eventTime.current / eventDuration.current, 1.0);
                // Exponential curve 1 -> 30
                const scale = 1.0 + (Math.pow(t, 3) * 30);
                setAmbientVolumeScale(scale);

                if (t >= 1.0) {
                    humState.current = 'SILENCE';
                    eventTime.current = 0;
                    setAmbientVolumeScale(0); // ABBRUPT SILENCE
                }
            }
            else if (humState.current === 'SILENCE') {
                // Hold silence for 2 seconds
                setAmbientVolumeScale(0);
                if (eventTime.current > 2.0) {
                    humState.current = 'FADING';
                    eventTime.current = 0;
                }
            }
            else if (humState.current === 'FADING') {
                // Restore to 1.0 quickly (2s)
                const t = Math.min(eventTime.current / 2.0, 1.0);
                setAmbientVolumeScale(t); // Linear 0 -> 1

                if (t >= 1.0) {
                    // END EVENT
                    setCurrentEvent('NONE');
                    active.current = false;
                    console.log("EVENT ENDED: Hum Swell");
                }
            }
        }
    });

    return (
        <>
            {currentEvent === 'PHANTOM_DOOR' && phantomProps && (
                <PhantomStructure
                    position={phantomProps.position}
                    rotation={phantomProps.rotation}
                    type="DOOR"
                    onVanish={endPhantomEvent}
                />
            )}
        </>
    );
};
