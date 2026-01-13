import { EffectComposer, Noise, Vignette, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { Vector2 } from 'three';
import { useGameStore } from '../../store/gameStore';

export const VHSEffects = () => {
    const sanity = useGameStore((state) => state.sanity);

    // Calculate effect intensities based on sanity (100 -> 0)
    // As sanity drops, effects get stronger
    // Reduced base values to prevent eye strain
    const noiseOpacity = 0.02 + (100 - sanity) * 0.002; // 0.02 -> 0.22 max
    const aberrationOffset = 0.0005 + (100 - sanity) * 0.0001; // Almost zero at start

    return (
        <EffectComposer>
            {/* Grainy Noise increases with madness */}
            <Noise
                premultiply
                blendFunction={BlendFunction.OVERLAY}
                opacity={noiseOpacity}
            />

            {/* Vignette tightens slightly? Maybe not needed dynamically yet */}
            <Vignette
                eskil={false}
                offset={0.1}
                darkness={1.1}
            />

            {/* Glitching increases with madness */}
            <ChromaticAberration
                offset={new Vector2(aberrationOffset, aberrationOffset)}
                radialModulation={false}
                modulationOffset={0}
            />

            <Bloom
                intensity={0.5}
                luminanceThreshold={0.9}
                luminanceSmoothing={0.025}
            />
        </EffectComposer>
    );
};
