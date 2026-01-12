import { useEffect, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useAchievementStore } from '../../store/achievementStore';

export const AchievementManager = () => {
    const { isMenuOpen, sanity, readingNote, hasWon, isPaused, currentLevel } = useGameStore();
    const { unlock } = useAchievementStore();

    // Timer for "First Steps" (Survival)
    const survivalTime = useRef(0);

    // Enter Backrooms: Trigger when game starts (menu closes)
    useEffect(() => {
        if (!isMenuOpen) {
            unlock('enter_backrooms');
        }
    }, [isMenuOpen, unlock]);

    // Sanity Loss: Trigger when sanity < 50
    useEffect(() => {
        if (sanity < 50) {
            unlock('sanity_loss');
        }
    }, [sanity, unlock]);

    // Find Note: Trigger when reading a note
    useEffect(() => {
        if (readingNote) {
            unlock('find_note');
        }
    }, [readingNote, unlock]);

    // Escape Level 0: Trigger when reaching Manila Room (Level 0.2) or Level 1
    useEffect(() => {
        if (currentLevel === 'LEVEL_0_2' || currentLevel === 'LEVEL_1') {
            unlock('escape_level_0');
        }
    }, [currentLevel, unlock]);

    // Survival Timer
    useEffect(() => {
        if (isMenuOpen || isPaused || hasWon) return;

        const interval = setInterval(() => {
            survivalTime.current += 1;
            if (survivalTime.current >= 60) {
                unlock('first_steps');
                // No need to clear interval, but we could if we want to stop counting
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isMenuOpen, isPaused, hasWon, unlock]);

    return null;
};
