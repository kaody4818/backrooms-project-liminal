import { Physics } from '@react-three/cannon';
import { Sky } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useMemo } from 'react';
import { AmbientSound } from './components/audio/AmbientSound';
import { VHSEffects } from './components/effects/VHSEffects';
import { SanityManager } from './components/logic/SanityManager';
import { Player } from './components/player/Player';
import { HUD } from './components/ui/HUD';
import { InteractionManager } from './components/interaction/InteractionManager';
import { Level } from './components/world/Level';
import { LightingController } from './components/world/LightingController';
import { useGameStore } from './store/gameStore';
import { generateMaze, CELL_SIZE } from './utils/mapGenerator';
import { MainMenu } from './components/ui/MainMenu';
import { GameOver } from './components/ui/GameOver';


function App() {
  const { isMenuOpen, isGameOver, hasWon, interactionText, isReadingNote, setIsReadingNote } = useGameStore();

  // Generate map once
  const { map, startPos, exitPos, manilaPos } = useMemo(() => {
    const size = 21;
    const { map: generatedMap, manilaPos } = generateMaze(size, size);

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
      startPos: [x, 5, z] as [number, number, number],
      exitPos: [mx, 5, mz] as [number, number, number]
    };
  }, []);

  return (
    <>
      <HUD />
      <AmbientSound />
      <SanityManager />

      {isMenuOpen && <MainMenu />}

      {isGameOver && <GameOver hasWon={hasWon} />}

      {/* Interaction Prompt UI */}
      {interactionText && !isMenuOpen && !isGameOver && !isReadingNote && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-12 z-40 pointer-events-none">
          <p className="text-white text-lg font-mono bg-black/50 px-4 py-2 rounded">
            [E] {interactionText}
          </p>
        </div>
      )}

      {/* Note Reading UI */}
      {isReadingNote && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-10 cursor-alias" onClick={() => setIsReadingNote(false)}>
          <div className="max-w-2xl bg-[#fdfef0] text-black p-12 shadow-2xl rotate-1 relative font-serif">
            <h2 className="text-2xl font-bold mb-6 border-b-2 border-black pb-2">Entry #418</h2>
            <p className="mb-4 text-lg leading-relaxed">
              If you are reading this, you found the Manila Room.
              They say it's safe here. The buzzing is quieter... or maybe I'm just going deaf.
            </p>
            <p className="mb-4 text-lg leading-relaxed">
              I've been calculating the geometry. It doesn't make sense.
              The walls move when you blink. But this room... it's stable.
            </p>
            <p className="mt-8 text-sm italic text-gray-600">
              - K.L.
            </p>
            <p className="mt-8 text-xs font-mono text-center text-gray-500 border-t pt-4">
              [Press ESC or CLICK to close]
            </p>
          </div>
        </div>
      )}



      <Canvas shadows camera={{ fov: 75 }}>
        <Sky sunPosition={[100, 20, 100]} turbidity={10} rayleigh={0.5} mieCoefficient={0.005} mieDirectionalG={0.8} />

        <LightingController />

        <Physics gravity={[0, -9.8, 0]} defaultContactMaterial={{ friction: 0, restitution: 0 }}>
          <Player position={startPos} exitPos={exitPos} />
          <Level map={map} manilaPos={manilaPos} />
        </Physics>

        <InteractionManager />

        <VHSEffects />
      </Canvas>
    </>
  );
}

export default App;
