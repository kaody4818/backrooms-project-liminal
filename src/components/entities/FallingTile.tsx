import { useBox } from '@react-three/cannon';
import { useThree } from '@react-three/fiber';
import { useRef, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';

export const FallingTile = ({ position, onDespawn, onCrash }: { position: [number, number, number], onDespawn: () => void, onCrash: () => void }) => {
    const setHealth = useGameStore(state => state.setHealth);
    const addTrauma = useGameStore(state => state.addTrauma);
    const { camera } = useThree();
    const hasDealtDamage = useRef(false);
    const hasCrashed = useRef(false);

    const [ref] = useBox(() => ({
        mass: 10,
        position,
        args: [1.2, 0.1, 1.2],
        linearDamping: 0.1,
        rotation: [Math.random() * 0.2, 0, Math.random() * 0.2],
        onCollide: () => {
            if (!ref.current) return;

            // Play Sound on first impact
            if (!hasCrashed.current) {
                onCrash();
                hasCrashed.current = true;
            }

            if (hasDealtDamage.current) return;
            const dist = camera.position.distanceTo(ref.current.position);

            if (dist < 2.5) {
                console.log(`[Hazard] Impact! Dist: ${dist.toFixed(2)}`);
                setHealth(h => h - 20);
                addTrauma(0.6); // Heavy Shake
                hasDealtDamage.current = true;
            } else if (dist < 5.0) {
                // Missed but close
                // Only add trauma once? Actually colliding with floor triggers this repeatedly?
                // Let's rely on hasCrashed?
                // Wait, sound happens on crash. Trauma triggers on crash too?
                // Yes, trauma should align with sound (impact).
                // But we want Shake only if close.

                // If we restrict trauma to hasCrashed block?
                // But damage check must happen if we walk into a static tile?
                // No, "FallingTile" implies damage when falling. Static debris shouldn't hurt much.
                // So putting damage check inside "first impact" block is okay?
                // Maybe not. If it bounces and hits player?
                // Let's keep damage separate but trauma synced to impact?
                addTrauma(0.2);
            }
        }
    }));

    // Despawn Timer
    useEffect(() => {
        const timer = setTimeout(onDespawn, 4000);
        return () => clearTimeout(timer);
    }, [onDespawn]);



    return (
        <mesh ref={ref as any} castShadow>
            {/* Use same geometry args for visual match */}
            <boxGeometry args={[1.2, 0.1, 1.2]} />
            <meshStandardMaterial color="#eeeeee" roughness={0.9} />
        </mesh>
    );
};
