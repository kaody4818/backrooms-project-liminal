
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useState } from 'react';
import { Raycaster, Vector2 } from 'three';
import { useGameStore } from '../../store/gameStore';

export const InteractionManager = () => {
    const { camera, scene } = useThree();
    const raycaster = useState(() => new Raycaster())[0];
    const center = new Vector2(0, 0); // Center of screen
    const { setInteractionText, isReadingNote, setIsReadingNote, setHasWon } = useGameStore();

    // Key listener for 'E' or Click
    useEffect(() => {
        const handleInteraction = (e: KeyboardEvent | MouseEvent) => {
            if (isReadingNote) {
                // If reading, any interaction closes it? Or specifically Escape/Click
                if ((e as KeyboardEvent).code === 'Escape' || (e as KeyboardEvent).code === 'KeyE') {
                    setIsReadingNote(false);
                }
                return;
            }

            if ((e instanceof KeyboardEvent && e.code === 'KeyE') || e.type === 'mousedown') {
                // Check interaction specifically when key is pressed
                raycaster.setFromCamera(center, camera);
                const intersects = raycaster.intersectObjects(scene.children, true);

                // Find first interactive object within range
                const hit = intersects.find((i) => i.object.userData && i.object.userData.interactive && i.distance < 3);

                if (hit) {
                    if (hit.object.userData.type === 'note') {
                        setIsReadingNote(true);
                        // WIN CONDITION triggered by reading the note
                        setHasWon(true);
                    }
                }
            }
        };

        window.addEventListener('keydown', handleInteraction);
        window.addEventListener('mousedown', handleInteraction);
        return () => {
            window.removeEventListener('keydown', handleInteraction);
            window.removeEventListener('mousedown', handleInteraction);
        };
    }, [camera, scene, isReadingNote, setIsReadingNote, setHasWon]);

    useFrame(() => {
        if (isReadingNote) {
            setInteractionText(null);
            return;
        }

        // Constant raycast for UI prompt
        raycaster.setFromCamera(center, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);
        const hit = intersects.find((i) => i.object.userData && i.object.userData.interactive && i.distance < 3); // Max distance 3

        if (hit) {
            setInteractionText(hit.object.userData.label || "Interact");
        } else {
            setInteractionText(null);
        }
    });

    return null;
};
