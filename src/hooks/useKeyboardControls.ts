import { useEffect, useRef } from 'react';

export const useKeyboardControls = () => {
    const movement = useRef({
        moveForward: false,
        moveBackward: false,
        moveLeft: false,
        moveRight: false,
        jump: false,
        sprint: false,
    });

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.code) {
                case 'KeyW': movement.current.moveForward = true; break;
                case 'KeyS': movement.current.moveBackward = true; break;
                case 'KeyA': movement.current.moveLeft = true; break;
                case 'KeyD': movement.current.moveRight = true; break;
                case 'Space': movement.current.jump = true; break;
                case 'ShiftLeft': movement.current.sprint = true; break;
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            switch (e.code) {
                case 'KeyW': movement.current.moveForward = false; break;
                case 'KeyS': movement.current.moveBackward = false; break;
                case 'KeyA': movement.current.moveLeft = false; break;
                case 'KeyD': movement.current.moveRight = false; break;
                case 'Space': movement.current.jump = false; break;
                case 'ShiftLeft': movement.current.sprint = false; break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    return movement;
};
