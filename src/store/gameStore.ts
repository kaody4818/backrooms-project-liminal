import { create } from 'zustand';

export interface NoteData {
    title: string;
    body: string[];
}

export interface InventoryItem {
    id: string;
    name: string;
    description: string;
    icon?: string; // Optional icon URL or emoji
    quantity: number;
}

interface GameState {
    isMenuOpen: boolean;
    setMenuOpen: (status: boolean) => void; // NEW
    isInventoryOpen: boolean;
    isGameOver: boolean;
    hasWon: boolean;
    sanity: number;
    health: number;
    interactionText: string | null;
    readingNote: NoteData | null;
    isInteractionBlocked: boolean;
    isPaused: boolean;
    ambientVolumeScale: number;
    currentLevel: 'LEVEL_0' | 'LEVEL_0_2' | 'LEVEL_1';
    shakeIntensity: number;
    inventory: InventoryItem[]; // NEW

    startGame: () => void;
    setGameOver: (status: boolean) => void;
    setHasWon: (status: boolean) => void;
    setSanity: (value: number | ((prev: number) => number)) => void;
    setHealth: (value: number | ((prev: number) => number)) => void;
    setInteractionText: (text: string | null) => void;
    setReadingNote: (note: NoteData | null) => void;
    setPaused: (status: boolean) => void;
    setInventoryOpen: (status: boolean) => void; // NEW
    setAmbientVolumeScale: (scale: number) => void;
    setLevel: (level: 'LEVEL_0' | 'LEVEL_0_2' | 'LEVEL_1') => void;
    addTrauma: (amount: number) => void;
    hasReadManilaNote: boolean;
    setHasReadManilaNote: (status: boolean) => void;

    // Inventory Actions
    addItem: (item: InventoryItem) => void;
    removeItem: (itemId: string, amount?: number) => void;
    useItem: (itemId: string) => void;
    isLoading: boolean;
    setLoading: (status: boolean) => void;

    // Teleportation
    teleportPos: [number, number, number] | null;
    setTeleportPos: (pos: [number, number, number] | null) => void;
}

export const useGameStore = create<GameState>((set) => ({
    isMenuOpen: true,
    isInventoryOpen: false,
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
    inventory: [],

    startGame: () => set({
        isMenuOpen: false,
        isInventoryOpen: false,
        isGameOver: false,
        hasWon: false,
        sanity: 100,
        health: 100,
        readingNote: null,
        isPaused: false,
        ambientVolumeScale: 1.0,
        currentLevel: 'LEVEL_0',
        shakeIntensity: 0,
        inventory: [],
        teleportPos: null
    }),
    setGameOver: (status) => set({ isGameOver: status }),
    setHasWon: (status) => set({ hasWon: status, isGameOver: true }),
    setSanity: (value) => set((state) => ({
        sanity: typeof value === 'function' ? value(state.sanity) : value
    })),
    setHealth: (value) => set((state) => {
        const newHealth = typeof value === 'function' ? value(state.health) : value;
        if (newHealth <= 0) {
            return { health: 0, isGameOver: true };
        }
        return { health: newHealth };
    }),
    setInteractionText: (text) => set({ interactionText: text }),
    setReadingNote: (note) => set({ readingNote: note }),
    setPaused: (status) => set({ isPaused: status }),
    setMenuOpen: (status) => set({ isMenuOpen: status }),
    setInventoryOpen: (status) => set({ isInventoryOpen: status }),
    setAmbientVolumeScale: (scale) => set({ ambientVolumeScale: scale }),
    setLevel: (level) => set({ currentLevel: level }),
    addTrauma: (amount) => set((state) => ({ shakeIntensity: Math.min(1.0, state.shakeIntensity + amount) })),
    hasReadManilaNote: false,
    setHasReadManilaNote: (status: boolean) => set({ hasReadManilaNote: status }),

    addItem: (item) => set((state) => {
        const existingItemIndex = state.inventory.findIndex(i => i.id === item.id);
        if (existingItemIndex !== -1) {
            const newInventory = [...state.inventory];
            newInventory[existingItemIndex].quantity += item.quantity;
            return { inventory: newInventory };
        }
        return { inventory: [...state.inventory, item] };
    }),

    useItem: (itemId: string) => set((state) => {
        const itemIndex = state.inventory.findIndex(i => i.id === itemId);
        if (itemIndex === -1) return {};

        const item = state.inventory[itemIndex];
        let consumed = false;

        // Item Effects Logic
        if (itemId === 'almond_water') {
            console.log("Drinking Almond Water...");
            // Restore Sanity (+20)
            const newSanity = Math.min(100, state.sanity + 20);
            // Restore Health (+10)
            const newHealth = Math.min(100, state.health + 10);

            consumed = true;
            return {
                sanity: newSanity,
                health: newHealth,
                interactionText: "You drank Almond Water. You feel refreshed.",
                inventory: item.quantity > 1
                    ? state.inventory.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i)
                    : state.inventory.filter(i => i.id !== itemId)
            };
        }

        return {};
    }),

    removeItem: (itemId, amount = 1) => set((state) => {
        const existingItemIndex = state.inventory.findIndex(i => i.id === itemId);
        if (existingItemIndex === -1) return {};

        const newInventory = [...state.inventory];
        const item = newInventory[existingItemIndex];

        if (item.quantity > amount) {
            item.quantity -= amount;
        } else {
            newInventory.splice(existingItemIndex, 1);
        }
        return { inventory: newInventory };
    }),

    isLoading: false,
    setLoading: (status) => set({ isLoading: status }),

    teleportPos: null,
    setTeleportPos: (pos) => set({ teleportPos: pos }),
}));


