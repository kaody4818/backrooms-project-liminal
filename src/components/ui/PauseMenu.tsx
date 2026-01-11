import { useGameStore } from '../../store/gameStore';

export const PauseMenu = () => {
    const { setPaused, startGame } = useGameStore();

    const handleQuit = () => {
        // Simple reload to reset everything, or we could manually reset store.
        // Reload is safer for a prototype to ensure clean state.
        window.location.reload();
    };

    const handleResume = () => {
        setPaused(false);
        // The pointer lock re-engagement is tricky from a UI click.
        // Usually, clicking the "Resume" button will trigger a click handler.
        // We can try to requestPointerLock on the canvas, or let the Player component handle it on next click.
        // For now, Player component will handle re-locking if user clicks the canvas.
        // But clicking *this* button might need to trigger it.
        // Let's rely on the user clicking the screen again or Player.tsx auto-lock logic if appropriate.
        // Actually best UX: Click Resume -> Close Menu -> User clicks game to play.
    };

    return (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm text-white">
            {/* VHS Scanlines Overlay (reuse if possible or duplicate) */}
            {/* VHS Scanlines Overlay */}
            <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`,
                filter: 'contrast(150%) brightness(100%)'
            }}></div>

            <div className="text-center font-mono relative z-10 border-2 border-white/20 p-12 bg-black/80">
                <h1 className="text-5xl mb-12 font-bold tracking-widest text-white animate-pulse">
                    PAUSED
                </h1>

                <div className="flex flex-col gap-4 w-64">
                    <button
                        onClick={handleResume}
                        className="px-6 py-3 border border-white/50 hover:bg-white hover:text-black hover:border-white transition-all uppercase tracking-wider font-bold"
                    >
                        Resume
                    </button>

                    <button
                        onClick={handleQuit}
                        className="px-6 py-3 border border-red-900/50 text-red-500 hover:bg-red-900 hover:text-white hover:border-red-500 transition-all uppercase tracking-wider font-bold mt-4"
                    >
                        Quit to Title
                    </button>
                </div>
            </div>
        </div>
    );
};
