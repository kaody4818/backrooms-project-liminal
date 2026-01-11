
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useState, useRef } from 'react';
import { Raycaster, Vector2 } from 'three';
import { useGameStore } from '../../store/gameStore';

export const InteractionManager = () => {
    const { camera, scene } = useThree();
    const raycaster = useState(() => new Raycaster())[0];
    const center = new Vector2(0, 0); // Center of screen
    const { setInteractionText, readingNote, setReadingNote, setHasWon, isGameOver } = useGameStore();
    const prevReadingNote = useRef<any>(null);

    // WIN LOGIC: Trigger when closing the Manila Note
    useEffect(() => {
        if (prevReadingNote.current?.title === "Entry #418" && !readingNote) {
            setHasWon(true);
        }
        prevReadingNote.current = readingNote;
    }, [readingNote, setHasWon]);

    // Key listener for 'E' or Click
    useEffect(() => {
        const handleInteraction = (e: KeyboardEvent | MouseEvent) => {
            const state = useGameStore.getState();
            // Critical: Check fresh state to allow UI buttons to work without triggering world interaction
            if (state.isGameOver || state.isMenuOpen || state.isPaused) return;

            if (state.readingNote) {
                // If reading, any interaction closes it? Or specifically Escape/Click
                // Actually, Note UI handles its own close click. 
                // We just handle Escape/E here for convenience?
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

                        // Win triggers on close (useEffect above)
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
    }, [camera, scene, setReadingNote]);

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
