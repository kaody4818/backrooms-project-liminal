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

export const generateWarehouse = (width: number, height: number): { map: number[][], cratePositions: [number, number][], pillarPositions: [number, number][] } => {
    // 0 = Empty Space (Floor)
    // 1 = Wall (Perimeter)
    // 
    // We handle Pillars and Crates as separate data, because pillars shouldn't be full walls in the grid 
    // (maybe they are, but let's keep the map clean for pathfinding if we ever add it).
    // Actually, for collision simplicity, let's mark pillars as 1 in map? 
    // No, pillars might be smaller than full cells. Let's return them as positions.
    // BUT physics depends on map (Level.tsx). 
    // If we use standard map logic, 1 is a full wall block.
    // Level 1 Pillars are usually thin concrete columns. 
    // So let's KEEP THE MAP OPEN (0) and place separate PILLAR objects.

    const map: number[][] = Array(height).fill(null).map(() => Array(width).fill(0));

    // Create Perimeter Walls
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (y === 0 || y === height - 1 || x === 0 || x === width - 1) {
                map[y][x] = 1;
            }
        }
    }

    const pillarPositions: [number, number][] = [];
    const cratePositions: [number, number][] = [];

    // Grid of Pillars
    const pillarSpacing = 4; // Every 4 cells
    for (let y = 2; y < height - 2; y += pillarSpacing) {
        for (let x = 2; x < width - 2; x += pillarSpacing) {
            // Adds some irregularity
            if (Math.random() > 0.1) {
                pillarPositions.push([x, y]);
            }
        }
    }

    // Random Crates (Clusters)
    const numClusters = 5;
    for (let i = 0; i < numClusters; i++) {
        const cx = 2 + Math.floor(Math.random() * (width - 4));
        const cy = 2 + Math.floor(Math.random() * (height - 4));

        // Add 1-4 crates around this point
        const count = 1 + Math.floor(Math.random() * 4);
        for (let j = 0; j < count; j++) {
            const ox = Math.floor(Math.random() * 3) - 1;
            const oy = Math.floor(Math.random() * 3) - 1;
            const tx = cx + ox;
            const ty = cy + oy;

            // Check bounds and ensure not on top of a pillar
            if (tx > 1 && tx < width - 1 && ty > 1 && ty < height - 1) {
                if (!pillarPositions.some(p => p[0] === tx && p[1] === ty)) {
                    cratePositions.push([tx, ty]);
                }
            }
        }
    }

    return { map, pillarPositions, cratePositions };
};

export const SECTOR_NONE = 0;
export const SECTOR_AQUILA = 1;
export const SECTOR_GILD = 2;
export const SECTOR_CORRIDOR = 3;

export const generateLevel1 = (width: number, height: number): {
    map: number[][],
    pillarPositions: [number, number][],
    cratePositions: [number, number][],
    sectorMap: number[][]
} => {
    // Initialize Maps
    // 1 = Wall, 0 = Floor
    const map: number[][] = Array(height).fill(null).map(() => Array(width).fill(1));
    const sectorMap: number[][] = Array(height).fill(null).map(() => Array(width).fill(SECTOR_NONE));

    const pillarPositions: [number, number][] = [];
    const cratePositions: [number, number][] = [];

    // Helper to check bounds
    const isInBounds = (x: number, y: number) => x > 0 && x < width - 1 && y > 0 && y < height - 1;

    // --- 1. Define Sectors ---

    // Aquila: Top-Left Quadrant (approx)
    // Large open room with pillars
    const aquilaRect = { x: 4, y: 4, w: Math.floor(width * 0.4), h: Math.floor(height * 0.4) };

    // Gild: Bottom-Right Quadrant (approx)
    // Large room with crates
    const gildRect = { x: Math.floor(width * 0.55), y: Math.floor(height * 0.55), w: Math.floor(width * 0.4), h: Math.floor(height * 0.4) };

    // --- 2. Carve Sectors ---

    // Carve Aquila
    for (let y = aquilaRect.y; y < aquilaRect.y + aquilaRect.h; y++) {
        for (let x = aquilaRect.x; x < aquilaRect.x + aquilaRect.w; x++) {
            map[y][x] = 0; // Floor
            sectorMap[y][x] = SECTOR_AQUILA;

            // Aquila Content: Pillars (Grid)
            // Sparse grid, e.g., every 6 tiles
            if ((x - aquilaRect.x) % 6 === 3 && (y - aquilaRect.y) % 6 === 3) {
                pillarPositions.push([x, y]);
            }
        }
    }

    // Carve Gild
    for (let y = gildRect.y; y < gildRect.y + gildRect.h; y++) {
        for (let x = gildRect.x; x < gildRect.x + gildRect.w; x++) {
            map[y][x] = 0; // Floor
            sectorMap[y][x] = SECTOR_GILD;

            // Gild Content: Random Crates
            // Higher density
            if (Math.random() < 0.08) {
                // Ensure not blocking everything? 
                // Simple random for now. 
                cratePositions.push([x, y]);
            }
        }
    }

    // --- 3. Generate Corridors (Maze) ---
    // We run a maze generator on the REMAINING solid space (1s)
    // but we need to respect a grid to avoid messy walls. 
    // We'll use recursive backtracker on odd coordinates.

    const dirs = [
        [0, -2], [0, 2], [-2, 0], [2, 0]
    ];
    const shuffle = (array: number[][]) => array.sort(() => Math.random() - 0.5);

    // Find valid start points for maze (any odd coordinate that is a wall)
    // We want to fill the "void" with corridors.

    for (let y = 1; y < height - 1; y += 2) {
        for (let x = 1; x < width - 1; x += 2) {
            if (map[y][x] === 1) {
                // Found a wall, let's see if we can start a maze here 
                // (and if it's not inside a restricted buffer, though our sectors are carved 0 already so check is implicit)

                const stack: [number, number][] = [[x, y]];
                map[y][x] = 0;
                sectorMap[y][x] = SECTOR_CORRIDOR;

                while (stack.length > 0) {
                    const [cx, cy] = stack[stack.length - 1];
                    const neighbors = [];

                    for (const [dx, dy] of dirs) {
                        const nx = cx + dx;
                        const ny = cy + dy;

                        // Check if in bounds and is a WALL (state 1)
                        // If it's 0, it means it's either another corridor or a Sector.
                        // We generally don't carve INTO a Sector, but we might want to connect to it.
                        // For now, strict maze generation: only carve into 1 (Wall).
                        if (isInBounds(nx, ny) && map[ny][nx] === 1) {
                            neighbors.push([nx, ny, cx + dx / 2, cy + dy / 2]);
                        }
                    }

                    if (neighbors.length > 0) {
                        const [nx, ny, wx, wy] = shuffle(neighbors)[0];
                        map[ny][nx] = 0;
                        map[wy][wx] = 0; // Carve wall between

                        sectorMap[ny][nx] = SECTOR_CORRIDOR;
                        sectorMap[wy][wx] = SECTOR_CORRIDOR;

                        stack.push([nx, ny]);
                    } else {
                        stack.pop();
                    }
                }
            }
        }
    }

    // --- 4. Content: Corridor Rooms (Side Rooms) ---
    // Iterate corridors and occasionally carve a small room (3x3 or 4x4)
    // For simplicity, let's just create a few "Office" pockets.

    const numOffices = 5;
    for (let i = 0; i < numOffices; i++) {
        // Try to find a corridor spot
        let placed = false;
        let attempts = 0;
        while (!placed && attempts < 50) {
            const rx = Math.floor(Math.random() * (width - 6)) + 3;
            const ry = Math.floor(Math.random() * (height - 6)) + 3;

            if (sectorMap[ry][rx] === SECTOR_CORRIDOR) {
                // Carve a small 3x3 room next to it
                for (let oy = 0; oy < 3; oy++) {
                    for (let ox = 0; ox < 3; ox++) {
                        map[ry + oy][rx + ox] = 0;
                        sectorMap[ry + oy][rx + ox] = SECTOR_CORRIDOR; // Treat as part of corridor system
                    }
                }
                placed = true;
            }
            attempts++;
        }
    }


    // --- 5. Connections (Breaches) ---
    // Ensure Sectors connect to Corridors.
    // The maze generator stops when it hits a 0. It doesn't carve into it.
    // So there could be a 1-thick wall between Maze and Sector everywhere.
    // We need to punch holes.

    // Iterate over the boundary of Aquila and Gild
    const punchHoles = (rect: { x: number, y: number, w: number, h: number }) => {
        // Top/Bottom edges
        const holes = 2; // Number of entrances

        // Top Edge
        if (rect.y > 1) {
            const mx = rect.x + Math.floor(rect.w / 2);
            // Punch up
            map[rect.y - 1][mx] = 0;
            sectorMap[rect.y - 1][mx] = SECTOR_CORRIDOR;
        }
        // Bottom Edge
        if (rect.y + rect.h < height - 1) {
            const mx = rect.x + Math.floor(rect.w / 2);
            map[rect.y + rect.h][mx] = 0;
            sectorMap[rect.y + rect.h][mx] = SECTOR_CORRIDOR;
        }
        // Left Edge
        if (rect.x > 1) {
            const my = rect.y + Math.floor(rect.h / 2);
            map[my][rect.x - 1] = 0;
            sectorMap[my][rect.x - 1] = SECTOR_CORRIDOR;
        }
        // Right Edge
        if (rect.x + rect.w < width - 1) {
            const my = rect.y + Math.floor(rect.h / 2);
            map[my][rect.x + rect.w] = 0;
            sectorMap[my][rect.x + rect.w] = SECTOR_CORRIDOR;
        }
    };

    punchHoles(aquilaRect);
    punchHoles(gildRect);

    return { map, pillarPositions, cratePositions, sectorMap };
};
