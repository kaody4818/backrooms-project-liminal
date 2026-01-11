import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useAchievementStore } from '../../store/achievementStore';
import { ACHIEVEMENTS } from '../../data/achievements';

export const PauseMenu = () => {
    const { setPaused } = useGameStore();
    const { unlockedIds } = useAchievementStore();
    const [showAchievements, setShowAchievements] = useState(false);

    const handleQuit = () => {
        // Simple reload to reset everything
        window.location.reload();
    };

    const handleResume = () => {
        setPaused(false);
    };

    const sortedAchievements = [...ACHIEVEMENTS].sort((a, b) => {
        const aUnlocked = unlockedIds.includes(a.id);
        const bUnlocked = unlockedIds.includes(b.id);
        if (aUnlocked && !bUnlocked) return -1;
        if (!aUnlocked && bUnlocked) return 1;
        return 0;
    });

    return (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm text-white">
            {/* VHS Scanlines Overlay */}
            <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`,
                filter: 'contrast(150%) brightness(100%)'
            }}></div>

            <div className="relative z-10 p-8 w-full max-w-2xl">
                {!showAchievements ? (
                    // Main Pause Menu
                    <div className="text-center font-mono border-2 border-white/20 p-12 bg-black/90">
                        <h1 className="text-5xl mb-12 font-bold tracking-widest text-white animate-pulse">
                            PAUSED
                        </h1>

                        <div className="flex flex-col gap-4 w-64 mx-auto">
                            <button
                                onClick={handleResume}
                                className="px-6 py-3 border border-white/50 hover:bg-white hover:text-black hover:border-white transition-all uppercase tracking-wider font-bold"
                            >
                                Resume
                            </button>

                            <button
                                onClick={() => setShowAchievements(true)}
                                className="px-6 py-3 border border-yellow-500/50 text-yellow-500 hover:bg-yellow-500 hover:text-black transition-all uppercase tracking-wider font-bold"
                            >
                                Achievements
                            </button>

                            <button
                                onClick={handleQuit}
                                className="px-6 py-3 border border-red-900/50 text-red-500 hover:bg-red-900 hover:text-white hover:border-red-500 transition-all uppercase tracking-wider font-bold mt-4"
                            >
                                Quit to Title
                            </button>
                        </div>
                    </div>
                ) : (
                    // Achievements View
                    <div className="font-mono border-2 border-yellow-500/30 p-8 bg-black/95 max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                            <h2 className="text-3xl font-bold tracking-widest text-yellow-500">
                                ACHIEVEMENTS
                            </h2>
                            <span className="text-sm text-gray-400">
                                {unlockedIds.length} / {ACHIEVEMENTS.length} Unlocked
                            </span>
                        </div>

                        <div className="overflow-y-auto pr-2 space-y-4 flex-1 custom-scrollbar">
                            {sortedAchievements.map((achievement) => {
                                const isUnlocked = unlockedIds.includes(achievement.id);
                                const isHidden = achievement.secret && !isUnlocked;

                                return (
                                    <div
                                        key={achievement.id}
                                        className={`flex items-center gap-4 p-4 border ${isUnlocked
                                                ? 'border-yellow-500/50 bg-yellow-900/10'
                                                : 'border-white/10 bg-white/5 opacity-70'
                                            }`}
                                    >
                                        <div className={`text-4xl ${isUnlocked ? '' : 'grayscale opacity-50'}`}>
                                            {isHidden ? '🔒' : achievement.icon}
                                        </div>
                                        <div>
                                            <h3 className={`text-xl font-bold ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>
                                                {isHidden ? '???' : achievement.title}
                                            </h3>
                                            <p className={`text-sm ${isUnlocked ? 'text-gray-300' : 'text-gray-600'}`}>
                                                {isHidden ? 'Hidden achievement.' : achievement.description}
                                            </p>
                                        </div>
                                        {isUnlocked && (
                                            <div className="ml-auto text-yellow-500 text-2xl">✓</div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => setShowAchievements(false)}
                            className="mt-6 w-full py-3 border border-white/30 hover:bg-white hover:text-black transition-all uppercase tracking-wider font-bold"
                        >
                            Back
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
