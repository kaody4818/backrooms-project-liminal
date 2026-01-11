import { useEffect, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';

export const SanityManager = () => {
    const { isMenuOpen, isGameOver, setSanity, sanity, setGameOver } = useGameStore();

    // Refs for checking thresholds without triggering re-renders of the effect loop
    const sanityRef = useRef(sanity);

    useEffect(() => {
        sanityRef.current = sanity;
    }, [sanity]);

    useEffect(() => {
        if (isMenuOpen || isGameOver) return;

        const interval = setInterval(() => {
            setSanity((prev) => {
                // Decay rate: 100 sanity / 300 seconds (5 minutes) = ~0.33 per second
                // Let's make it slightly faster for testing: 1 per second
                const newSanity = Math.max(0, prev - 0.5);

                // Threshold checks (Logic only, visual effects will react to store changes)
                if (newSanity < 80 && prev >= 80) {
                    console.log("Only the lights are humming... right?");
                }
                if (newSanity < 50 && prev >= 50) {
                    console.log("I feel like I'm being watched...");
                }
                if (newSanity < 20 && prev >= 20) {
                    console.log("THEY ARE HERE.");
                }

                if (newSanity <= 0) {
                    setGameOver(true);
                    return 0; // Clamp to 0
                }

                return newSanity;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isMenuOpen, isGameOver, setSanity]);

    return null;
};
