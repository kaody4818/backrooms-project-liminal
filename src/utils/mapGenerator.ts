// Basic Recursive Backtracker Maze Generator
export const CELL_SIZE = 5; // Size of each block in world units
export const WALL_HEIGHT = 4;

export type CellType = 'wall' | 'floor' | 'empty';

export const generateMaze = (width: number, height: number): { map: number[][], manilaPos: [number, number] } => {
    // 1 = Wall, 0 = Floor
    const map: number[][] = Array(height).fill(null).map(() => Array(width).fill(1));

    const dirs = [
        [0, -2], // North
        [0, 2],  // South
        [-2, 0], // West
        [2, 0],  // East
    ];

    const shuffle = (array: number[][]) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };

    const isInBounds = (x: number, y: number) => x > 0 && x < width - 1 && y > 0 && y < height - 1;

    const stack: [number, number][] = [];
    const startX = 1;
    const startY = 1;

    map[startY][startX] = 0;
    stack.push([startX, startY]);

    // Track the furthest point for the Manila Room (simple heuristic: last point popped from stack or tracked max depth)
    let manilaPos: [number, number] = [1, 1];
    let maxStackSize = 0;

    while (stack.length > 0) {
        if (stack.length > maxStackSize) {
            maxStackSize = stack.length;
            manilaPos = [...stack[stack.length - 1]];
        }

        const [cx, cy] = stack[stack.length - 1];
        const neighbors = [];

        for (const [dx, dy] of dirs) {
            const nx = cx + dx;
            const ny = cy + dy;

            if (isInBounds(nx, ny) && map[ny][nx] === 1) {
                neighbors.push([nx, ny, cx + dx / 2, cy + dy / 2]);
            }
        }

        if (neighbors.length > 0) {
            const [nx, ny, wx, wy] = shuffle(neighbors)[0];
            map[ny][nx] = 0;
            map[wy][wx] = 0; // Carve wall between
            stack.push([nx, ny]);
        } else {
            stack.pop();
        }
    }

    // Sparsify: Making it more "room-like" by randomly removing some walls
    // This reduces the perfect maze look and creates open areas
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            if (map[y][x] === 1 && Math.random() < 0.1) { // 10% chance to remove internal wall
                // Avoid removing border walls
                if (x > 1 && x < width - 2 && y > 1 && y < height - 2) {
                    map[y][x] = 0;
                }
            }
        }
    }

    return { map, manilaPos };
};
