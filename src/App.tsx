import { Physics } from '@react-three/cannon';
import { Sky } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useMemo } from 'react';
import { AmbientSound } from './components/audio/AmbientSound';
import { VHSEffects } from './components/effects/VHSEffects';
import { SanityManager } from './components/logic/SanityManager';
import { AchievementManager } from './components/logic/AchievementManager'; // Import
import { Player } from './components/player/Player';

import { InteractionManager } from './components/interaction/InteractionManager';
import { Level } from './components/world/Level';
import { LightingController } from './components/world/LightingController';
import { useGameStore } from './store/gameStore';
import { generateMaze, CELL_SIZE } from './utils/mapGenerator';
import { HallucinationManager } from './components/logic/HallucinationManager';
import { HazardManager } from './components/logic/HazardManager';
import { MainMenu } from './components/ui/MainMenu';
import { GameOver } from './components/ui/GameOver';
import { PauseMenu } from './components/ui/PauseMenu';


// Crosshair Component
const Crosshair = () => (
  <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-white/80 rounded-full pointer-events-none transform -translate-x-1/2 -translate-y-1/2 z-50 mix-blend-difference shadow-[0_0_2px_rgba(0,0,0,0.5)]"></div>
);

// HUD Component
const GameHUD = () => {
  const { health, sanity, isMenuOpen, isGameOver, hasWon } = useGameStore();
  if (isMenuOpen || isGameOver || hasWon) return null;

  return (
    <div className="absolute bottom-4 left-4 text-white font-mono pointer-events-none select-none z-10">
      <div className="flex items-center gap-2">
        <span className="w-16 text-red-400 font-bold text-shadow">HEALTH</span>
        <div className="w-48 h-4 border border-red-800 bg-black/50 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-900 to-red-600 transition-all duration-300"
            style={{ width: `${Math.max(0, health)}%` }}
          />
        </div>
        <span className="text-sm text-red-400">{Math.round(health)}</span>
      </div>

      <div className="flex items-center gap-2 mt-2">
        <span className="w-16 text-blue-400 font-bold text-shadow">SANITY</span>
        <div className="w-48 h-4 border border-blue-800 bg-black/50 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-900 to-blue-600 transition-all duration-300"
            style={{ width: `${Math.max(0, sanity)}%` }}
          />
        </div>
        <span className="text-sm text-blue-400">{Math.round(sanity)}</span>
      </div>

    </div>
  );
};


// Actually simpler:
// Just use a component that sets opacity momentarily.
/*
const DamageOverlay = () => {
  const [flash, setFlash] = useState(false);
  const health = useGameStore(s => s.health);
  const prev = useRef(health);
  
  useEffect(() => {
     if (health < prev.current) {
         setFlash(true);
         setTimeout(() => setFlash(false), 300);
     }
     prev.current = health;
  }, [health]);
  
  return <div className={`absolute inset-0 bg-red-600 z-50 pointer-events-none transition-opacity duration-300 ${flash ? 'opacity-60' : 'opacity-0'}`} />
}
*/
// Let's implement this cleanly.

import { useState, useRef, useEffect } from 'react'; // Ensure imports

const DamageOverlay = () => {
  const [flash, setFlash] = useState(false);
  const health = useGameStore(s => s.health);
  const prev = useRef(health);

  useEffect(() => {
    if (health < prev.current) {
      setFlash(true);
      setTimeout(() => setFlash(false), 300);
    }
    prev.current = health;
  }, [health]);

  return (
    <div className={`absolute inset-0 bg-red-600 pointer-events-none z-50 transition-opacity duration-300 ${flash ? 'opacity-50' : 'opacity-0'}`} />
  );
};

function App() {
  const { isMenuOpen, isGameOver, hasWon, interactionText, readingNote, setReadingNote, isPaused } = useGameStore();

  // Generate map once
  const { map, startPos, exitPos, manilaPos } = useMemo(() => {
    const size = 21;
    const { map: generatedMap, manilaPos } = generateMaze(size, size);

    // Force Portal Door Location: Ensure (8,8) is a wall and (8,9) is a floor so the door spawns facing South
    if (size > 9) {
      generatedMap[8][8] = 1;
      generatedMap[8][9] = 0;

      // Force Lore Note Locations (Floors for Tables)
      generatedMap[2][2] = 0;   // Notice
      generatedMap[12][6] = 0;  // Complaint
    }

    // Calculate world position for grid (1,1)
    const offset = (size * CELL_SIZE) / 2;
    const x = 1 * CELL_SIZE - offset;
    const z = 1 * CELL_SIZE - offset;

    // Calculate world position for Manila Room
    const mx = manilaPos[0] * CELL_SIZE - offset;
    const mz = manilaPos[1] * CELL_SIZE - offset;

    return {
      map: generatedMap,
      manilaPos, // Return this!
      startPos: [x, 1.5, z] as [number, number, number],
      exitPos: [mx, 5, mz] as [number, number, number]
    };
  }, []);

  return (
    <>

      <AmbientSound />
      <SanityManager />
      <AchievementManager />

      {isMenuOpen && <MainMenu />}

      {isGameOver && <GameOver hasWon={hasWon} />}

      {isPaused && <PauseMenu />}

      {/* Game UI Layer */}
      {!isMenuOpen && !isGameOver && !hasWon && !readingNote && (
        <>
          <GameHUD />
          <DamageOverlay />
          <Crosshair />
        </>
      )}

      {/* Interaction Prompt UI */}
      {interactionText && !isMenuOpen && !isGameOver && !readingNote && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-12 z-40 pointer-events-none">
          <p className="text-white text-lg font-mono bg-black/50 px-4 py-2 rounded">
            [E] {interactionText}
          </p>
        </div>
      )}

      {/* Note Reading UI */}
      {readingNote && (
        <div className="absolute inset-0 z-50 flex items-start justify-center pt-20 bg-black/80 cursor-alias" onClick={() => setReadingNote(null)}>
          <div className="max-w-2xl bg-[#fdfef0] text-black p-12 shadow-2xl rotate-1 relative font-serif" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-6 border-b-2 border-black pb-2">{readingNote.title}</h2>
            {readingNote.body.map((text, i) => (
              <p key={i} className="mb-4 text-lg leading-relaxed">{text}</p>
            ))}
            <button
              onClick={() => setReadingNote(null)}
              className="mt-8 w-full text-xs font-mono text-center text-gray-500 border-t pt-4 hover:text-red-500"
            >
              [CLOSE]
            </button>
          </div>
        </div>
      )}
      <Canvas shadows camera={{ fov: 75 }}>
        <Sky sunPosition={[100, 20, 100]} turbidity={10} rayleigh={0.5} mieCoefficient={0.005} mieDirectionalG={0.8} />

        <LightingController />

        <Physics gravity={[0, -9.8, 0]} defaultContactMaterial={{ friction: 0, restitution: 0 }}>
          <Player position={startPos} exitPos={exitPos} />
          <Level map={map} manilaPos={manilaPos} />
          <HazardManager />
        </Physics>

        <HallucinationManager />

        <InteractionManager />

        <VHSEffects />
      </Canvas >
    </>
  );
}

export default App;
