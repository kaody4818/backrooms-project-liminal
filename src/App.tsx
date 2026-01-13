import { Physics, usePlane } from '@react-three/cannon';
import { Sky } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useMemo, useState, useRef, useEffect } from 'react';
import { AmbientSound } from './components/audio/AmbientSound';
import { VHSEffects } from './components/effects/VHSEffects';
import { SanityManager } from './components/logic/SanityManager';
import { AchievementManager } from './components/logic/AchievementManager'; // Import
import { Player } from './components/player/Player';

import { InteractionManager } from './components/interaction/InteractionManager';
import { Level } from './components/world/Level';
import { Level1 } from './components/world/Level1'; // Import Level1
import { LightingController } from './components/world/LightingController';
import { useGameStore } from './store/gameStore';
import { generateMaze, generateLevel1, CELL_SIZE } from './utils/mapGenerator'; // Import generateLevel1
import { HallucinationManager } from './components/logic/HallucinationManager';
import { HazardManager } from './components/logic/HazardManager';
import { MainMenu } from './components/ui/MainMenu';
import { GameOver } from './components/ui/GameOver';
import { PauseMenu } from './components/ui/PauseMenu';
import { Inventory } from './components/ui/Inventory'; // Import Inventory




// Additional Imports for SafetyFloor
const SafetyFloor = () => {
  usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, -0.1, 0], // Safety catch slightly below real floor
    type: 'Static',
  }));
  return null;
};

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

const InventoryController = () => {
  const { isInventoryOpen, setInventoryOpen, isMenuOpen, isGameOver, readingNote, setPaused } = useGameStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && !isMenuOpen && !isGameOver && !readingNote) {
        e.preventDefault();

        if (isInventoryOpen) {
          // Closing Inventory
          setInventoryOpen(false);
          setPaused(false);
          window.dispatchEvent(new Event('request-game-lock'));
        } else {
          // Opening Inventory
          // First check if not already paused by other means? (optional, but safe)
          setInventoryOpen(true);
          setPaused(true);
          document.exitPointerLock();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInventoryOpen, isMenuOpen, isGameOver, readingNote, setInventoryOpen, setPaused]);

  return null;
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
  const { isMenuOpen, isGameOver, hasWon, interactionText, readingNote, setReadingNote, isPaused, currentLevel } = useGameStore();

  // Generate Level 0 Map
  const { map: mapL0, startPos: startPosL0, exitPos: exitPosL0, manilaPos, remodelingDoorConfig } = useMemo(() => {
    const size = 21;
    const { map: generatedMap, manilaPos } = generateMaze(size, size);

    // Force Portal Door Location (Level 0)
    if (size > 9) {
      generatedMap[8][8] = 1;
      generatedMap[8][9] = 0;
      generatedMap[2][2] = 0;   // Notice
      generatedMap[12][6] = 0;  // Complaint
    }

    const offset = (size * CELL_SIZE) / 2;
    const x = 1 * CELL_SIZE - offset;
    const z = 1 * CELL_SIZE - offset;
    const mx = manilaPos[0] * CELL_SIZE - offset;
    const mz = manilaPos[1] * CELL_SIZE - offset;

    // Remodeling Door Position:
    // Moved to (8,9) as requested.
    // North Wall of (8,9).
    const dX = 8 * CELL_SIZE - offset;
    const dZ = 9 * CELL_SIZE - offset;

    return {
      map: generatedMap,
      manilaPos,
      remodelingDoorConfig: {
        position: [dX, 1.6, dZ - 2.45] as [number, number, number],
        rotation: [0, 0, 0] as [number, number, number]
      },
      startPos: [x, 1.5, z] as [number, number, number],
      exitPos: [mx, 5, mz] as [number, number, number]
    };
  }, []);

  // Generate Level 1 Map (Warehouse)
  const { map: mapL1, pillarPositions: pillarPositionsL1, cratePositions: cratePositionsL1, startPosL1, sectorMap: sectorMapL1 } = useMemo(() => {
    const w = 61;
    const h = 61;
    // Use generateLevel1 (Safe Wrapper)
    const { map, pillarPositions, cratePositions, sectorMap } = generateLevel1(w, h);

    // Start position for Level 1 (Center)
    // 31x31 center is 15,15.
    // Coordinates: (15 * 5) - (31*5/2) + 2.5 = 75 - 77.5 + 2.5 = 0.
    // So [0, 2, 0] is correct for the center.

    return {
      map,
      pillarPositions,
      cratePositions,
      sectorMap, // Pass the generated sectorMap
      startPosL1: [0, 2, 0] as [number, number, number]
    };
  }, []);

  // Determine current Start Pos based on level
  // Note: When transitioning, we probably need to reset Player position inside the Player component or force a re-mount.
  // Changing the 'position' prop might not instantly teleport physics body if it only reads initial prop.
  // Player.tsx uses `useSphere(() => ({ position }))`. Cannon handles updates if api.position.set is called.
  // We already have Debug keys to teleport.
  // Ideally, the Player component should listen to 'currentLevel' change and teleport? 
  // Or we rely on the component unmounting/remounting if key changes?

  // Let's key the Canvas or Physics content by Level to force full reset?
  // A full unmount might be safer for physics state preventing bugs.

  const activeStartPos = currentLevel === 'LEVEL_1' ? startPosL1 : startPosL0;

  return (
    <>

      <AmbientSound />
      <SanityManager />
      <AchievementManager />

      {isMenuOpen && <MainMenu />}

      {isGameOver && <GameOver hasWon={hasWon} />}

      {isPaused && <PauseMenu />}

      <InventoryController />
      <Inventory />

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
        <div
          className="absolute inset-0 z-50 flex items-start justify-center pt-20 bg-black/80 cursor-alias"
          onClick={(e) => {
            e.preventDefault();
            setReadingNote(null);
            window.dispatchEvent(new Event('request-game-lock'));
          }}
        >
          <div className="max-w-2xl bg-[#fdfef0] text-black p-12 shadow-2xl rotate-1 relative font-serif" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-6 border-b-2 border-black pb-2">{readingNote.title}</h2>
            {readingNote.body.map((text, i) => (
              <p key={i} className="mb-4 text-lg leading-relaxed">{text}</p>
            ))}
            <button
              onClick={(e) => {
                e.preventDefault();
                setReadingNote(null);
                window.dispatchEvent(new Event('request-game-lock'));
              }}
              className="mt-8 w-full text-xs font-mono text-center text-gray-500 border-t pt-4 hover:text-red-500"
            >
              [CLOSE]
            </button>
          </div>
        </div>
      )}

      {/* Keying the Canvas/Physics by level forces a reset when level changes. 
          This ensures physics world is clean and player spawns at correct startPos. 
      */}
      <Canvas key={currentLevel} shadows camera={{ fov: 75 }}>
        <Sky sunPosition={currentLevel === 'LEVEL_1' ? [0, -10, 0] : [100, 20, 100]} turbidity={10} rayleigh={0.5} />

        <LightingController />

        <Physics gravity={[0, -9.8, 0]} defaultContactMaterial={{ friction: 0, restitution: 0 }}>
          <SafetyFloor />
          <Player position={activeStartPos} exitPos={currentLevel === 'LEVEL_0' ? exitPosL0 : null} />

          {(currentLevel === 'LEVEL_0' || currentLevel === 'LEVEL_0_2') && (
            <Level map={mapL0} manilaPos={manilaPos} remodelingDoorConfig={remodelingDoorConfig} />
          )}

          {/* Render Level 1 */}
          {currentLevel === 'LEVEL_1' && (
            <Level1
              map={mapL1}
              pillarPositions={pillarPositionsL1}
              cratePositions={cratePositionsL1}
              sectorMap={sectorMapL1}
            />
          )}

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
