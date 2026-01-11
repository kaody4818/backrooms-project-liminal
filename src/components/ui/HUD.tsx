import { useGameStore } from '../../store/gameStore';

export const HUD = () => {
    const sanity = useGameStore((state) => state.sanity);
    const isMenuOpen = useGameStore((state) => state.isMenuOpen);

    if (isMenuOpen) return null;

    return (
        <div className="absolute top-4 left-4 z-40 font-mono text-white pointer-events-none select-none mix-blend-difference">
            <div className="flex flex-col gap-1">
                <span className={`text-lg font-bold ${sanity < 30 ? 'text-red-500 animate-pulse' : 'text-gray-200'}`}>
                    SANITY: {Math.floor(sanity)}%
                </span>
                {sanity < 100 && (
                    <span className="text-xs text-gray-500">
                        Mental decay active...
                    </span>
                )}
            </div>
        </div>
    );
};
