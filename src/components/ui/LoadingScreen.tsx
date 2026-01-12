import { useGameStore } from '../../store/gameStore';
import { useEffect, useState } from 'react';

export const LoadingScreen = () => {
    const isLoading = useGameStore((state) => state.isLoading);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (isLoading) {
            setVisible(true);
        } else {
            // Delay hiding for smooth transition
            const t = setTimeout(() => setVisible(false), 500);
            return () => clearTimeout(t);
        }
    }, [isLoading]);

    if (!visible) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'black',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999, // Highest priority
            opacity: isLoading ? 1 : 0,
            transition: 'opacity 0.5s ease-in-out',
            pointerEvents: 'all' // Block input
        }}>
            <h1 className="text-4xl font-mono animate-pulse tracking-[0.5em] mb-4">LOADING...</h1>
            <div className="w-64 h-2 bg-gray-800 rounded overflow-hidden">
                <div className="h-full bg-white animate-loading-bar" style={{ width: '100%' }}></div>
            </div>
            {/* CSS Animation for Loading Bar needed or just simple infinite scroll? 
                Let's use a simple inline keyframe via tailwind if possible or standard CSS.
                Actually, simpler spinner or text pulse is fine.
            */}
            <style>{`
                @keyframes loading-progress {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .animate-loading-bar {
                    animation: loading-progress 2s infinite linear;
                }
            `}</style>
        </div>
    );
};
