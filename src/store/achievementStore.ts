import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ACHIEVEMENTS } from '../data/achievements';

interface AchievementState {
    unlockedIds: string[];
    unlock: (id: string) => void;
    reset: () => void;
    hasUnlocked: (id: string) => boolean;
}

export const useAchievementStore = create<AchievementState>()(
    persist(
        (set, get) => ({
            unlockedIds: [],
            unlock: (id) => {
                const { unlockedIds } = get();
                if (!unlockedIds.includes(id)) {
                    // Check if valid ID
                    const isValid = ACHIEVEMENTS.some(a => a.id === id);
                    if (isValid) {
                        set({ unlockedIds: [...unlockedIds, id] });
                        // Optional: Trigger a toast notification here in the future
                        console.log(`🏆 Achievement Unlocked: ${id}`);
                    }
                }
            },
            reset: () => set({ unlockedIds: [] }),
            hasUnlocked: (id) => get().unlockedIds.includes(id),
        }),
        {
            name: 'backrooms-achievements', // unique name for localStorage
        }
    )
);
