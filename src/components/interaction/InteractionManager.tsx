
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useState } from 'react';
import { Raycaster, Vector2 } from 'three';
import { useGameStore } from '../../store/gameStore';

export const InteractionManager = () => {
    const { camera, scene } = useThree();
    const raycaster = useState(() => new Raycaster())[0];
    const center = new Vector2(0, 0); // Center of screen
    const { setInteractionText, readingNote, setReadingNote, setHasWon } = useGameStore();

    // Key listener for 'E' or Click
    useEffect(() => {
        const handleInteraction = (e: KeyboardEvent | MouseEvent) => {
            if (readingNote) {
                // If reading, any interaction closes it? Or specifically Escape/Click
                if ((e as KeyboardEvent).code === 'Escape' || (e as KeyboardEvent).code === 'KeyE') {
                    setReadingNote(null);
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
                        const noteData = hit.object.userData.noteData || {
                            title: "Entry #418",
                            body: [
                                "If you are reading this, you found the Manila Room.",
                                "They say it's safe here. The buzzing is quieter... or maybe I'm just going deaf.",
                                "I've been calculating the geometry. It doesn't make sense.",
                                "The walls move when you blink. But this room... it's stable.",
                                "- K.L."
                            ]
                        };
                        setReadingNote(noteData);

                        // WIN CONDITION triggered by reading the Manila note
                        if (noteData.title === "Entry #418") {
                            setHasWon(true);
                        }
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
    }, [camera, scene, readingNote, setReadingNote, setHasWon]);

    useFrame(() => {
        if (readingNote) {
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
