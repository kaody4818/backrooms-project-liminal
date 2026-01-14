import { useBox, useHingeConstraint } from '@react-three/cannon';
import { useRef } from 'react';

interface DoorProps {
    position: [number, number, number];
    rotation: number;
}

export const Door = ({ position, rotation }: DoorProps) => {
    const doorWidth = 4.9; // Slightly less than CELL_SIZE 5 to fit
    const doorHeight = 4.5;
    const doorThickness = 0.4;

    // Static hinge anchor (Invisible)
    const [anchorRef] = useBox(() => ({
        type: 'Static',
        position: [position[0], doorHeight / 2, position[2]],
        rotation: [0, rotation, 0],
        args: [0.1, 0.1, 0.1], // Tiny box
        collisionFilterGroup: 0,
    }));

    // Dynamic physics box: The Door itself
    const [doorRef] = useBox(() => ({
        mass: 50,
        type: 'Dynamic',
        position: [position[0], doorHeight / 2, position[2]],
        rotation: [0, rotation, 0],
        args: [doorWidth, doorHeight, doorThickness],
        linearDamping: 0.5,
        angularDamping: 0.5,
        // Group 2: Door
        collisionFilterGroup: 2,
        // Mask: 1 (Default/Player/Walls) | 4 (Custom?). Exclude 3 (Furniture).
        // Default group is 1.
        collisionFilterMask: 1,
    }));

    // Hinge Constraint
    useHingeConstraint(doorRef, anchorRef, {
        pivotA: [-doorWidth / 2, 0, 0], // Hinge at left edge of door
        pivotB: [-doorWidth / 2, 0, 0], // Align with anchor
        axisA: [0, 1, 0], // Y-axis hinging
        axisB: [0, 1, 0],
        collideConnected: false,
    });

    return (
        <group>
            <mesh ref={doorRef as any} castShadow receiveShadow>
                <boxGeometry args={[doorWidth, doorHeight, doorThickness]} />
                <meshStandardMaterial color="#554433" roughness={0.7} />
                {/* Handle Front */}
                <mesh position={[doorWidth / 2 - 0.5, 0, doorThickness / 2 + 0.05]}>
                    <boxGeometry args={[0.1, 0.8, 0.1]} />
                    <meshStandardMaterial color="#222" />
                </mesh>
                {/* Handle Back */}
                <mesh position={[doorWidth / 2 - 0.5, 0, -doorThickness / 2 - 0.05]}>
                    <boxGeometry args={[0.1, 0.8, 0.1]} />
                    <meshStandardMaterial color="#222" />
                </mesh>
            </mesh>
            {/* Debug Anchor Visualization (Optional, keep hidden for now) */}
            {/* <mesh ref={anchorRef as any}>
                <boxGeometry args={[0.2, 0.2, 0.2]} />
                <meshStandardMaterial color="red" />
            </mesh> */}
        </group>
    );
};
