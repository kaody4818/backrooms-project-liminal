import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useState } from 'react';
import { Vector3 } from 'three';
import { useGameStore } from '../../store/gameStore';

export const ShadowMan = ({ position }: { position: [number, number, number] }) => {
    const sanity = useGameStore((state) => state.sanity);
    const isPaused = useGameStore((state) => state.isPaused);
    const { camera } = useThree();
    const ref = useRef<any>(null);
    const [isVisible, setIsVisible] = useState(true);

    useFrame(() => {
        if (!ref.current || !isVisible || isPaused) return;

        // Only appear if sanity is low (< 50)
        if (sanity > 50) {
            ref.current.visible = false;
            return;
        }



        // If too close, KILL (Disabled for now)
        /*
        if (dist < 1.5) {
            useGameStore.getState().setGameOver(true);
            return;
        }
        */

        // Make billboard always face camera
        ref.current.lookAt(camera.position.x, 1.6, camera.position.z);

        // Vanishing Logic:
        // If player looks directly at it (dot product of view vector and vector to entity is close to 1)
        // AND it is visible, make it vanish (hallucination dispelled).

        const toEntity = new Vector3().subVectors(ref.current.position, camera.position).normalize();
        const viewDir = new Vector3();
        camera.getWorldDirection(viewDir);

        const match = viewDir.dot(toEntity);

        // If looking relatively directly at it (> 0.95)
        if (match > 0.95) {
            // Fade out or vanish instantly
            // For now, instant vanish + log
            if (ref.current.visible) {
                console.log("The shadow dissolves as you focus on it.");
                setIsVisible(false); // Gone for good (this instance)
            }
        } else {
            // Flicker effect based on sanity?
            ref.current.visible = Math.random() > (sanity / 100);
        }
    });

    if (!isVisible) return null;

    return (
        <mesh ref={ref} position={position}>
            <planeGeometry args={[1, 2.5]} />
            {/* Dark shadow material */}
            <meshBasicMaterial color="black" transparent opacity={0.8} />
        </mesh>
    );
};
