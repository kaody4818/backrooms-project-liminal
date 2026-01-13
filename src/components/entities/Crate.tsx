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

    const handleInteract = () => {
        if (searched) return;

        // Interaction Manager calls this when E is pressed or Clicked while looking at object
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

            useGameStore.getState().setInteractionText("You found Almond Water!");
            setTimeout(() => {
                useGameStore.getState().setInteractionText(null);
            }, 3000);
        } else {
            console.log("Crate empty.");
            useGameStore.getState().setInteractionText("The crate is empty.");
            setTimeout(() => {
                useGameStore.getState().setInteractionText(null);
            }, 2000);
        }
    };

    return (
        <mesh
            ref={ref}
            castShadow
            receiveShadow
            userData={{
                interactive: !searched,
                label: searched ? "Empty" : "Search Crate",
                onInteract: handleInteract
            }}
        >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial map={texture} color={searched ? "#886644" : "#cc9966"} roughness={0.7} />
        </mesh>
    );
};
