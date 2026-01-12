import { useBox } from '@react-three/cannon';
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore';

export const Crate = ({ position, texture, isStatic = false }: { position: [number, number, number], texture: any, isStatic?: boolean }) => {
    // Dynamic Crate with Mass (Movable) if isStatic is false
    const [ref] = useBox(() => ({
        mass: isStatic ? 0 : 1,
        type: isStatic ? 'Static' : 'Dynamic',
        position,
        args: [1, 1, 1],
    }));

    const [searched, setSearched] = useState(false);
    const { addItem } = useGameStore();

    // Ref for interaction check
    const canInteract = useRef(false);

    useFrame(({ camera }) => {
        if (searched) return;
        const dist = Math.sqrt(Math.pow(camera.position.x - position[0], 2) + Math.pow(camera.position.z - position[2], 2));

        if (dist < 2.5) {
            canInteract.current = true;
            // Only set text if we are close enough
            // Note: This might conflict if multiple crates are close, 
            // but creates a basic interaction prompt.
            useGameStore.getState().setInteractionText("Press E to Search Crate");
        } else {
            // We do NOT clear the text here to avoid flickering or clearing other interactions.
            // The text relies on the player moving away from *all* interactables, 
            // or we could add a smarter manager later.
            canInteract.current = false;
        }
    });

    useEffect(() => {
        const handleInteract = (e: KeyboardEvent) => {
            if (e.code === 'KeyE' && canInteract.current && !searched) {
                setSearched(true);
                useGameStore.getState().setInteractionText(null); // Clear prompt immediately

                // LOOT LOGIC (30% Chance)
                const roll = Math.random();
                if (roll < 0.3) {
                    console.log("Looted Almond Water!");
                    addItem({
                        id: 'almond_water',
                        name: 'Almond Water',
                        description: 'Smells like sweet almond and stale water. Restores Sanity and Health.',
                        icon: '🥛',
                        quantity: 1
                    });
                    // Simple feedback
                    useGameStore.getState().setInteractionText("You found Almond Water!");
                    setTimeout(() => useGameStore.getState().setInteractionText(null), 3000);
                } else {
                    console.log("Crate empty.");
                    useGameStore.getState().setInteractionText("The crate is empty.");
                    setTimeout(() => useGameStore.getState().setInteractionText(null), 2000);
                }
            }
        };

        window.addEventListener('keydown', handleInteract);
        return () => window.removeEventListener('keydown', handleInteract);
    }, [searched, addItem]);

    return (
        <mesh ref={ref} castShadow receiveShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial map={texture} color={searched ? "#886644" : "#cc9966"} roughness={0.7} />
        </mesh>
    );
};
