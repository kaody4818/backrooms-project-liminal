

export const GameOver = ({ hasWon }: { hasWon: boolean }) => {
    return (
        <div className={`absolute inset-0 z-50 flex items-center justify-center ${hasWon ? 'bg-yellow-900/90' : 'bg-black'} text-white overflow-hidden`}>

            {/* Visual Noise for Game Over */}
            {!hasWon && (
                <div className="absolute inset-0 opacity-20 pointer-events-none animate-pulse" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`
                }}></div>
            )}

            <div className="text-center font-mono relative z-10">
                <h1 className={`text-6xl mb-4 font-bold tracking-widest uppercase ${hasWon ? 'text-yellow-100' : 'text-red-600 animate-pulse'}`}>
                    {hasWon ? 'ESCAPED' : 'SIGNAL LOST'}
                </h1>

                <p className={`mb-8 text-xl ${hasWon ? 'text-yellow-200' : 'text-gray-500'}`}>
                    {hasWon
                        ? "SUBJECT REACHED THE MANILA ROOM."
                        : "CONNECTION TERMINATED. SUBJECT DECEASED."}
                </p>

                {hasWon && (
                    <div className="mb-8 p-4 bg-black/30 border border-yellow-500/30 text-yellow-100 text-sm max-w-md mx-auto">
                        LOG ENTRY #419: <br />
                        Subject successfully navigated Zone 0. Stability confirmed. Proceeding to extraction...
                    </div>
                )}

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        window.location.reload();
                    }}
                    className={`px-8 py-3 font-bold rounded uppercase tracking-wider transition-colors border-2 
                        ${hasWon
                            ? 'bg-yellow-700 hover:bg-yellow-600 border-yellow-500 text-white'
                            : 'bg-transparent border-red-600 text-red-600 hover:bg-red-900 hover:text-white'
                        }`}
                >
                    {hasWon ? 'Play Again' : 'Re-establish Link'}
                </button>
            </div>
        </div>
    );
};
