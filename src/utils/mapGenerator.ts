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
export const SECTOR_OUROBOROS = 5;
export const SECTOR_OFFICE = 6;
export const SECTOR_INFIRMARY = 7;
export const SECTOR_RUBBER = 8;
export const SECTOR_ART = 9;

export type FurnitureItem = {
    x: number;
    y: number; // Grid Y (which is world Z)
    type: 'computer_table' | 'hospital_bed' | 'chair' | 'painting';
    rotation: number;
};

export type DoorItem = {
    x: number;
    y: number;
    rotation: number; // 0 or Math.PI/2
};

export type Level1Data = {
    map: number[][],
    pillarPositions: [number, number][],
    cratePositions: [number, number][],
    contraptionPositions: [number, number][],
    workerPositions: [number, number][],
    sectorMap: number[][],
    furniturePositions: FurnitureItem[],
    doorPositions: DoorItem[]
};

export const generateLevel1 = (width: number, height: number): Level1Data => {
    // 1. Initialize Map with Walls
    const map: number[][] = Array(height).fill(null).map(() => Array(width).fill(1));

    // Initialize Sector Map with Explicit Regions (Walls included)
    // Default everything to CORRIDOR first
    const sectorMap: number[][] = Array(height).fill(null).map(() => Array(width).fill(SECTOR_CORRIDOR));

    const pillarPositions: [number, number][] = [];
    const cratePositions: [number, number][] = [];
    const contraptionPositions: [number, number][] = [];
    const workerPositions: [number, number][] = [];
    const furniturePositions: FurnitureItem[] = [];
    const doorPositions: DoorItem[] = [];

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

    // Ouroboros: Bottom-Left (Construction Site)
    const ouroborosRect = { x: 3, y: height - 28, w: 25, h: 25 };

    // Mark region
    for (let y = ouroborosRect.y - 1; y <= ouroborosRect.y + ouroborosRect.h; y++) {
        for (let x = ouroborosRect.x - 1; x <= ouroborosRect.x + ouroborosRect.w; x++) {
            if (isInBounds(x, y)) {
                sectorMap[y][x] = SECTOR_OUROBOROS;
            }
        }
    }

    // Carve Ouroboros layout (Chaotic Construction)
    const landingX = 15;
    const landingY = 45;

    for (let y = ouroborosRect.y; y < ouroborosRect.y + ouroborosRect.h; y++) {
        for (let x = ouroborosRect.x; x < ouroborosRect.x + ouroborosRect.w; x++) {
            if (isInBounds(x, y)) {
                // FORCE SAFE LANDING ZONE (3x3)
                if (Math.abs(x - landingX) <= 1 && Math.abs(y - landingY) <= 1) {
                    map[y][x] = 0;
                    continue; // Skip random gen for this zone
                }

                // Determine if this spot is open or has a "structure" (wall/pillar)
                // Ouroboros is "under construction", so maybe incomplete walls
                if (Math.random() > 0.3) {
                    map[y][x] = 0; // Open floor

                    // Random Contraptions
                    if (Math.random() < 0.05) {
                        contraptionPositions.push([x, y]);
                    }
                    // Random Workers
                    else if (Math.random() < 0.02) {
                        workerPositions.push([x, y]);
                    }
                } else {
                    // Leave as wall (1)
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
                    // Hit a sector (Aquila/Gild/Ouroboros).
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
    punchEntrance(ouroborosRect, 2);

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

    // --- 5. Generate Special Corridor Rooms ---
    // Iterate to find suitable spots for special rooms
    // We look for walls adjacent to a corridor floor to punch a room into.



    // --- Better Room Generation Approach: Scan for Dead Ends / Small corridors ---
    // Iterate map, find dead ends.
    // Assign type.

    // Dead Ends detection
    const deadEnds: { x: number, y: number, entryDir: 'n' | 's' | 'e' | 'w' }[] = [];
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            if (map[y][x] === 0 && sectorMap[y][x] === SECTOR_CORRIDOR) {
                let walls = 0;
                if (map[y - 1][x] === 1) walls++;
                if (map[y + 1][x] === 1) walls++;
                if (map[y][x - 1] === 1) walls++;
                if (map[y][x + 1] === 1) walls++;

                if (walls === 3) {
                    let entryDir: 'n' | 's' | 'e' | 'w' = 'n'; // Direction TO the exit? Or FROM the exit?
                    // Let's say direction OF the open side.
                    if (map[y - 1][x] === 0) entryDir = 'n';
                    if (map[y + 1][x] === 0) entryDir = 's';
                    if (map[y][x - 1] === 0) entryDir = 'w';
                    if (map[y][x + 1] === 0) entryDir = 'e';
                    deadEnds.push({ x, y, entryDir });
                }
            }
        }
    }

    // Shuffle dead ends
    const shuffledEnds = deadEnds.sort(() => Math.random() - 0.5);

    // Also fix the Dead Ends logic which had the same issue
    shuffledEnds.forEach((end, index) => {
        if (index > 20) return;

        let doorX = end.x;
        let doorY = end.y;
        let doorRot = 0;

        // entryDir is direction OF the open side (Corridor).
        // If 'n' (North), corridor is y-1. Boundary is y - 0.5.

        if (end.entryDir === 'n') { doorY = end.y - 0.5; doorRot = 0; }
        else if (end.entryDir === 's') { doorY = end.y + 0.5; doorRot = 0; }
        else if (end.entryDir === 'w') { doorX = end.x - 0.5; doorRot = Math.PI / 2; }
        else if (end.entryDir === 'e') { doorX = end.x + 0.5; doorRot = Math.PI / 2; }

        const rand = Math.random();

        if (rand < 0.4) {
            sectorMap[end.y][end.x] = SECTOR_OFFICE;
            furniturePositions.push({ x: end.x, y: end.y, type: 'computer_table', rotation: Math.random() * Math.PI * 2 });
            doorPositions.push({ x: doorX, y: doorY, rotation: doorRot });
        }
        else if (rand < 0.5) {
            sectorMap[end.y][end.x] = SECTOR_RUBBER;
            furniturePositions.push({ x: end.x, y: end.y, type: 'chair', rotation: Math.random() * Math.PI * 2 });
            doorPositions.push({ x: doorX, y: doorY, rotation: doorRot });
        }
    });

    // For Larger rooms (Infirmary / Art), we need to forcibly CARVE space using the "createRoom" logic I thought of first,
    // but simplified to just find a spot that doesn't overlap.

    const tryCarveRoom = (type: number, w: number, h: number, decorType: 'hospital_bed' | 'painting') => {
        for (let i = 0; i < 50; i++) {
            const cx = Math.floor(Math.random() * (width - w - 2)) + 1;
            const cy = Math.floor(Math.random() * (height - h - 2)) + 1;

            // Check if space is Wall
            let clear = true;
            for (let y = cy; y < cy + h; y++) for (let x = cx; x < cx + w; x++) {
                if (map[y][x] === 0) { clear = false; break; }
            }
            if (!clear) continue;

            // Find connection
            let connectX = -1, connectY = -1;
            // Check only simple adjacency
            // Try to find a neighbor on the side
            if (map[cy - 1][cx + Math.floor(w / 2)] === 0 && sectorMap[cy - 1][cx] === SECTOR_CORRIDOR) { connectX = cx + Math.floor(w / 2); connectY = cy; } // Top
            else if (map[cy + h][cx + Math.floor(w / 2)] === 0 && sectorMap[cy + h][cx] === SECTOR_CORRIDOR) { connectX = cx + Math.floor(w / 2); connectY = cy + h - 1; } // Bottom
            else if (map[cy + Math.floor(h / 2)][cx - 1] === 0 && sectorMap[cy][cx - 1] === SECTOR_CORRIDOR) { connectX = cx; connectY = cy + Math.floor(h / 2); } // Left
            else if (map[cy + Math.floor(h / 2)][cx + w] === 0 && sectorMap[cy][cx + w] === SECTOR_CORRIDOR) { connectX = cx + w - 1; connectY = cy + Math.floor(h / 2); } // Right

            if (connectX !== -1) {
                // Carve
                for (let y = cy; y < cy + h; y++) for (let x = cx; x < cx + w; x++) {
                    map[y][x] = 0;
                    sectorMap[y][x] = type;
                }

                // Add Decor in middle
                furniturePositions.push({ x: cx + Math.floor(w / 2), y: cy + Math.floor(h / 2), type: decorType, rotation: 0 });

                // Add Door at connection boundary
                let dx = connectX;
                let dy = connectY;
                let rot = 0;

                // Recalculate precise boundary based on relationship
                if (connectY < cy) { dy = cy - 0.5; dx = cx + Math.floor(w / 2); rot = 0; }
                else if (connectY >= cy + h) { dy = cy + h - 0.5; dx = cx + Math.floor(w / 2); rot = 0; }
                else if (connectX < cx) { dx = cx - 0.5; dy = cy + Math.floor(h / 2); rot = Math.PI / 2; }
                else if (connectX >= cx + w) { dx = cx + w - 0.5; dy = cy + Math.floor(h / 2); rot = Math.PI / 2; }

                doorPositions.push({ x: dx, y: dy, rotation: rot });
                return;
            }
        }
    };

    // Create a few large rooms
    tryCarveRoom(SECTOR_INFIRMARY, 3, 3, 'hospital_bed');
    tryCarveRoom(SECTOR_ART, 4, 4, 'painting');
    tryCarveRoom(SECTOR_INFIRMARY, 3, 3, 'hospital_bed');

    return {
        map,
        pillarPositions,
        cratePositions,
        contraptionPositions,
        workerPositions,
        sectorMap,
        furniturePositions,
        doorPositions
    };
};
