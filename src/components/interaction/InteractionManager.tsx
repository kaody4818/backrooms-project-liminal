
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useState, useRef } from 'react';
import { Raycaster, Vector2 } from 'three';
import { useGameStore } from '../../store/gameStore';

export const InteractionManager = () => {
    const { camera, scene } = useThree();
    const raycaster = useState(() => new Raycaster())[0];
    const center = new Vector2(0, 0); // Center of screen
    const { setInteractionText, readingNote, setReadingNote, setHasWon, isGameOver, setHasReadManilaNote } = useGameStore();
    const prevReadingNote = useRef<any>(null);

    // Key listener for 'E' or Click
    const lastNoteCloseTime = useRef(0);

    // Track Note Reading Completion
    useEffect(() => {
        if (prevReadingNote.current?.title === "Entry #418" && !readingNote) {
            setHasReadManilaNote(true);
            console.log("Manila Note Read. Glitch Wall should appear.");
        }

        if (prevReadingNote.current && !readingNote) {
            // Just closed a note
            lastNoteCloseTime.current = Date.now();
        }

        prevReadingNote.current = readingNote;
    }, [readingNote, setHasReadManilaNote]);

    useEffect(() => {
        const handleInteraction = (e: KeyboardEvent | MouseEvent) => {
            const state = useGameStore.getState();
            if (state.isGameOver || state.isMenuOpen || state.isPaused) return;

            // Cooldown after closing note to prevent accidental re-click
            if (Date.now() - lastNoteCloseTime.current < 500) return;

            if (state.readingNote) {
                // If reading, any interaction closes it? Or specifically Escape/Click
                // Actually, Note UI handles its own close click. 
                // We just handle Escape/E here for convenience?
                if ((e as KeyboardEvent).code === 'Escape' || (e as KeyboardEvent).code === 'KeyE') {
                    setReadingNote(null);
                    window.dispatchEvent(new Event('request-game-lock'));
                }
                return;
            }

            if ((e instanceof KeyboardEvent && e.code === 'KeyE') || e.type === 'mousedown') {
                // Check interaction specifically when key is pressed
                raycaster.setFromCamera(center, camera);
                const intersects = raycaster.intersectObjects(scene.children, true);

                // Find first interactive object within range
                const hit = intersects.find((i) => i.object.userData && i.object.userData.interactive && i.distance < 5);

                if (hit) {
                    // Check for generic interact callback (Smart Object Pattern)
                    if (hit.object.userData.onInteract) {
                        hit.object.userData.onInteract();
                        return; // Stop processing other types
                    }

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
                        document.exitPointerLock();

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
        const hit = intersects.find((i) => i.object.userData && i.object.userData.interactive && i.distance < 5); // Max distance 5

        if (hit) {
            setInteractionText(hit.object.userData.label || "Interact");
        } else {
            setInteractionText(null);
        }
    });

    return null;
};
