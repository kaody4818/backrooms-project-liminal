import { create } from 'zustand';

interface GameState {
    isMenuOpen: boolean;
    isGameOver: boolean;
    hasWon: boolean;
    sanity: number;
    isInteractionBlocked: boolean; // Just in case we need general input blocking
    isPaused: boolean;
    ambientVolumeScale: number; // For Hallucinations (1.0 = normal)
    startGame: () => void;
    setGameOver: (status: boolean) => void;
    setHasWon: (status: boolean) => void;
    setSanity: (value: number | ((prev: number) => number)) => void;
    interactionText: string | null;
    isReadingNote: boolean;
    setInteractionText: (text: string | null) => void;
    setIsReadingNote: (status: boolean) => void;
    setPaused: (status: boolean) => void;
    setAmbientVolumeScale: (scale: number) => void;
}

export const useGameStore = create<GameState>((set) => ({
    isMenuOpen: true,
    isGameOver: false,
    hasWon: false,
    sanity: 100,
    interactionText: null,
    isReadingNote: false,
    isInteractionBlocked: false,
    isPaused: false,
    ambientVolumeScale: 1.0,
    startGame: () => set({ isMenuOpen: false, isGameOver: false, hasWon: false, sanity: 100, isReadingNote: false, isPaused: false, ambientVolumeScale: 1.0 }),
    setGameOver: (status) => set({ isGameOver: status }),
    setHasWon: (status) => set({ hasWon: status, isGameOver: true }),
    setSanity: (value) => set((state) => ({
        sanity: typeof value === 'function' ? value(state.sanity) : value
    })),
    setInteractionText: (text) => set({ interactionText: text }),
    setIsReadingNote: (status) => set({ isReadingNote: status }),
    setPaused: (status) => set({ isPaused: status }),
    setAmbientVolumeScale: (scale) => set({ ambientVolumeScale: scale }),
}));
