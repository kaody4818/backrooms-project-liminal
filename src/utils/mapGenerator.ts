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
export const SECTOR_GOTHIC = 4;

export type Level1Data = {
    map: number[][],
    pillarPositions: [number, number][],
    cratePositions: [number, number][],
    sectorMap: number[][]
};

export const generateLevel1 = (width: number, height: number): Level1Data => {
    // 1. Initialize Map with Walls
    const map: number[][] = Array(height).fill(null).map(() => Array(width).fill(1));

    // Initialize Sector Map with Explicit Regions (Walls included)
    // Default everything to CORRIDOR first
    const sectorMap: number[][] = Array(height).fill(null).map(() => Array(width).fill(SECTOR_CORRIDOR));

    const pillarPositions: [number, number][] = [];
    const cratePositions: [number, number][] = [];

    // Helper to check bounds
    const isInBounds = (x: number, y: number) => x > 0 && x < width - 1 && y > 0 && y < height - 1;

    // --- 2. Define and Carve Sectors ---

    // Aquila: Top-Left (Open room with pillars)
    // Align with odd grid for maze compatibility (starts at 3,3)
    const aquilaRect = { x: 3, y: 3, w: 25, h: 25 };

    // Mark the entire region (including walls) as Aquila
    // We add a padding of 1 to include the walls ENCLOSING the room
    for (let y = aquilaRect.y - 1; y <= aquilaRect.y + aquilaRect.h; y++) {
        for (let x = aquilaRect.x - 1; x <= aquilaRect.x + aquilaRect.w; x++) {
            if (isInBounds(x, y)) {
                sectorMap[y][x] = SECTOR_AQUILA;
            }
        }
    }

    // Now Carve the room floor (strictly inside)
    for (let y = aquilaRect.y; y < aquilaRect.y + aquilaRect.h; y++) {
        for (let x = aquilaRect.x; x < aquilaRect.x + aquilaRect.w; x++) {
            if (isInBounds(x, y)) {
                map[y][x] = 0;
                // sectorMap is already set
                if ((x - aquilaRect.x) % 4 === 2 && (y - aquilaRect.y) % 4 === 2) {
                    pillarPositions.push([x, y]);
                }
            }
        }
    }

    // Gild: Bottom-Right (Room with crates)
    const gildRect = { x: width - 28, y: height - 28, w: 25, h: 25 };

    // Mark region (including walls) as Gild
    for (let y = gildRect.y - 1; y <= gildRect.y + gildRect.h; y++) {
        for (let x = gildRect.x - 1; x <= gildRect.x + gildRect.w; x++) {
            if (isInBounds(x, y)) {
                sectorMap[y][x] = SECTOR_GILD;
            }
        }
    }

    // Carve Gild floor
    for (let y = gildRect.y; y < gildRect.y + gildRect.h; y++) {
        for (let x = gildRect.x; x < gildRect.x + gildRect.w; x++) {
            if (isInBounds(x, y)) {
                map[y][x] = 0;
                if (Math.random() < 0.1) {
                    if (x > gildRect.x + 1 && x < gildRect.x + gildRect.w - 1 && y > gildRect.y + 1 && y < gildRect.y + gildRect.h - 1) {
                        cratePositions.push([x, y]);
                    }
                }
            }
        }
    }

    // --- 3. Generate Corridors (Maze) ---
    // Start at center based on dimensions
    let startX = Math.floor(width / 2);
    let startY = Math.floor(height / 2);

    // Ensure start is odd for maze generation (if preferred) or just valid bounds
    if (startX % 2 === 0) startX++;
    if (startY % 2 === 0) startY++;

    // Ensure center is open for spawn
    if (isInBounds(startX, startY)) {
        map[startY][startX] = 0;
        sectorMap[startY][startX] = SECTOR_CORRIDOR;
    }

    // Force carve the EXACT center for player spawn calculation (0,0 world pos -> center index)
    const centerIndexX = Math.floor(width / 2);
    const centerIndexY = Math.floor(height / 2);
    if (isInBounds(centerIndexX, centerIndexY)) {
        map[centerIndexY][centerIndexX] = 0;
        sectorMap[centerIndexY][centerIndexX] = SECTOR_CORRIDOR;
    }

    const stack: [number, number][] = [[startX, startY]];
    const dirs = [[0, -2], [0, 2], [-2, 0], [2, 0]];
    const shuffle = (array: any[]) => array.sort(() => Math.random() - 0.5);

    while (stack.length > 0) {
        const [cx, cy] = stack[stack.length - 1];
        const neighbors = [];

        for (const [dx, dy] of dirs) {
            const nx = cx + dx;
            const ny = cy + dy;

            if (isInBounds(nx, ny)) {
                if (map[ny][nx] === 1) {
                    // Valid wall to carve
                    neighbors.push([nx, ny, cx + dx / 2, cy + dy / 2]);
                } else if (map[ny][nx] === 0 && sectorMap[ny][nx] !== SECTOR_CORRIDOR) {
                    // Hit a sector (Aquila/Gild).
                    // Do NOT connect automatically to keep entrances rare.
                    // We will punch specific holes later.
                }
            }
        }

        if (neighbors.length > 0) {
            const validMoves = neighbors.filter(([nx, ny]) => map[ny][nx] === 1);
            if (validMoves.length > 0) {
                const [nx, ny, wx, wy] = shuffle(validMoves)[0];
                map[ny][nx] = 0;
                map[wy][wx] = 0;
                sectorMap[ny][nx] = SECTOR_CORRIDOR;
                sectorMap[wy][wx] = SECTOR_CORRIDOR;
                stack.push([nx, ny]);
            } else {
                stack.pop();
            }
        } else {
            stack.pop();
        }
    }

    // --- 4. Post-Processing: Connect Sectors (Limited Entrances) ---
    // Punch exactly 2 entrances for each sector to ensure they are accessible but enclosed.

    const punchEntrance = (rect: { x: number, y: number, w: number, h: number }, count: number) => {
        let punched = 0;
        let attempts = 0;
        while (punched < count && attempts < 50) {
            // Pick a random point on the perimeter
            const side = Math.floor(Math.random() * 4); // 0: Top, 1: Bottom, 2: Left, 3: Right
            let tx = 0, ty = 0;

            if (side === 0) { tx = rect.x + Math.floor(Math.random() * rect.w); ty = rect.y - 1; }
            else if (side === 1) { tx = rect.x + Math.floor(Math.random() * rect.w); ty = rect.y + rect.h; }
            else if (side === 2) { tx = rect.x - 1; ty = rect.y + Math.floor(Math.random() * rect.h); }
            else { tx = rect.x + rect.w; ty = rect.y + Math.floor(Math.random() * rect.h); }

            if (isInBounds(tx, ty) && map[ty][tx] === 1) {
                // Check if it connects to a corridor (orthogonal check)
                // We want to punch a wall that leads to a corridor, or at least opens up.
                // Simply turning a wall into a corridor floor is enough if the maze is dense.

                // Let's just punch it. The maze is likely adjacent.
                map[ty][tx] = 0;
                sectorMap[ty][tx] = SECTOR_CORRIDOR;
                punched++;
            }
            attempts++;
        }
    };

    punchEntrance(aquilaRect, 2);
    punchEntrance(gildRect, 2);

    // --- Gothic Sector: Top-Right (Curved/Circular arches) ---
    const gothicRect = { x: width - 28, y: 3, w: 25, h: 25 };

    // Mark region
    for (let y = gothicRect.y - 1; y <= gothicRect.y + gothicRect.h; y++) {
        for (let x = gothicRect.x - 1; x <= gothicRect.x + gothicRect.w; x++) {
            if (isInBounds(x, y)) {
                sectorMap[y][x] = SECTOR_GOTHIC;
            }
        }
    }

    // Carve circular/curved room
    const centerX = gothicRect.x + gothicRect.w / 2;
    const centerY = gothicRect.y + gothicRect.h / 2;
    const radius = Math.min(gothicRect.w, gothicRect.h) / 2 - 2;

    for (let y = gothicRect.y; y < gothicRect.y + gothicRect.h; y++) {
        for (let x = gothicRect.x; x < gothicRect.x + gothicRect.w; x++) {
            if (isInBounds(x, y)) {
                const dx = x - centerX;
                const dy = y - centerY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < radius) {
                    map[y][x] = 0; // Floor

                    // Radial Pillars
                    // Place pillars in a ring
                    if (dist > radius - 2 && dist < radius - 1) {
                        // approx ring
                        // Make sure it's not too dense, check angles?
                        // Simple grid check for ring:
                        if (x % 2 === 0 && y % 2 === 0) {
                            pillarPositions.push([x, y]);
                        }
                    } else if (dist < 3) {
                        // Central structure or pillar
                        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
                            pillarPositions.push([x, y]);
                        }
                    }
                }
            }
        }
    }

    punchEntrance(gothicRect, 2);

    return {
        map,
        pillarPositions,
        cratePositions,
        sectorMap
    };
};
