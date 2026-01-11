import { useGameStore } from '../../store/gameStore';

export const MainMenu = () => {
    const { startGame } = useGameStore();

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black text-white overflow-hidden">
            {/* VHS Scanlines Overlay */}
            <div className="absolute inset-0 bg-[url('https://media.giphy.com/media/l41YcWn4xJ6N8t7ZS/giphy.gif')] opacity-10 pointer-events-none mix-blend-overlay bg-cover"></div>

            {/* Scanline Animation using CSS (using a simple repeating gradient) */}
            <div className="absolute inset-0 pointer-events-none" style={{
                background: 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.2))',
                backgroundSize: '100% 4px'
            }}></div>

            <div className="text-center font-mono relative z-10 p-8 border-4 border-yellow-600 bg-black/90 shadow-[0_0_20px_rgba(255,215,0,0.5)]">
                <h1 className="text-7xl mb-6 text-yellow-500 font-bold tracking-[0.2em] uppercase animate-pulse drop-shadow-[2px_2px_0_rgba(255,0,0,0.5)]">
                    Backrooms
                </h1>
                <p className="mb-8 text-xl text-gray-400 tracking-widest">
                    P R O J E C T   L I M I N A L
                </p>
                <div className="text-xs text-green-500 mb-8 font-mono">
                    REC [●] 00:00:00 <br />
                    SLP MODE: OFF
                </div>

                <button
                    onClick={startGame}
                    className="group relative px-10 py-4 bg-transparent overflow-hidden rounded-none border-2 border-yellow-600 text-yellow-500 font-bold uppercase tracking-widest transition-all hover:bg-yellow-600 hover:text-black"
                >
                    <span className="relative z-10">Initialize Sequence</span>
                    <div className="absolute inset-0 h-full w-full bg-yellow-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
                </button>

                <p className="mt-8 text-xs text-gray-600 font-mono">
                    CONTROLS: WASD to Move | SHIFT to Sprint | MOUSE to Look
                </p>
            </div>

            {/* Corner Text */}
            <div className="absolute top-8 left-8 text-white font-mono text-xl opacity-70">PLAY</div>
            <div className="absolute top-8 right-8 text-white font-mono text-xl opacity-70">SP 0:00</div>
        </div>
    );
};
