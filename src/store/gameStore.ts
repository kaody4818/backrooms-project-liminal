import { create } from 'zustand';

export interface NoteData {
    title: string;
    body: string[];
}

interface GameState {
    isMenuOpen: boolean;
    isGameOver: boolean;
    hasWon: boolean;
    sanity: number;
    health: number;
    interactionText: string | null;
    readingNote: NoteData | null; // Replaces isReadingNote
    isInteractionBlocked: boolean; // Just in case we need general input blocking
    isPaused: boolean;
    ambientVolumeScale: number; // For Hallucinations (1.0 = normal)
    currentLevel: 'LEVEL_0' | 'LEVEL_0_2' | 'LEVEL_1';
    shakeIntensity: number; // 0 to 1 (Trauma)
    startGame: () => void;
    setGameOver: (status: boolean) => void;
    setHasWon: (status: boolean) => void;
    setSanity: (value: number | ((prev: number) => number)) => void;
    setHealth: (value: number | ((prev: number) => number)) => void;
    setInteractionText: (text: string | null) => void;
    setReadingNote: (note: NoteData | null) => void;
    setPaused: (status: boolean) => void;
    setAmbientVolumeScale: (scale: number) => void;
    setLevel: (level: 'LEVEL_0' | 'LEVEL_0_2' | 'LEVEL_1') => void;
    addTrauma: (amount: number) => void;
    hasReadManilaNote: boolean;
    setHasReadManilaNote: (status: boolean) => void;
}

export const useGameStore = create<GameState>((set) => ({
    isMenuOpen: true,
    isGameOver: false,
    hasWon: false,
    sanity: 100,
    health: 100,
    interactionText: null,
    readingNote: null,
    isInteractionBlocked: false,
    isPaused: false,
    ambientVolumeScale: 1.0,
    currentLevel: 'LEVEL_0',
    shakeIntensity: 0,
    startGame: () => set({ isMenuOpen: false, isGameOver: false, hasWon: false, sanity: 100, health: 100, readingNote: null, isPaused: false, ambientVolumeScale: 1.0, currentLevel: 'LEVEL_0', shakeIntensity: 0 }),
    setGameOver: (status) => set({ isGameOver: status }),
    setHasWon: (status) => set({ hasWon: status, isGameOver: true }),
    setSanity: (value) => set((state) => ({
        sanity: typeof value === 'function' ? value(state.sanity) : value
    })),
    setHealth: (value) => set((state) => {
        const newHealth = typeof value === 'function' ? value(state.health) : value;
        if (newHealth <= 0) {
            return { health: 0, isGameOver: true }; // Check death immediately
        }
        return { health: newHealth };
    }),
    setInteractionText: (text) => set({ interactionText: text }),
    setReadingNote: (note) => set({ readingNote: note }),
    setPaused: (status) => set({ isPaused: status }),
    setAmbientVolumeScale: (scale) => set({ ambientVolumeScale: scale }),
    setLevel: (level) => set({ currentLevel: level }),
    addTrauma: (amount) => set((state) => ({ shakeIntensity: Math.min(1.0, state.shakeIntensity + amount) })),
    hasReadManilaNote: false, // Track if player read the specific note
    setHasReadManilaNote: (status: boolean) => set({ hasReadManilaNote: status }),
}));


