# Development Progress Log

## Phase 1: Core Foundation (Completed)
**Goal:** Establish the project structure and basic movement mechanics.
- [x] **Project Setup:** Vite + React + TypeScript + Three.js (R3F) + Cannon.js.
- [x] **Physics Engine:** Integrated `useSphere` for player and `useBox`/`usePlane` for world.
- [x] **Player Controller:** 
    - Implemented WASD Movement, Jumping, and Sprinting.
    - Solved "Stickiness" issue by implementing custom velocity interpolation (ignoring friction).
- [x] **Camera System:** First-person view with Pointer Lock controls.
- [x] **Debugging:** Added and removed visual debug tools (Layout Boxes, Velocity Logs).

## Phase 2: World & Atmosphere (In Progress)
**Goal:** Create the infinite, unsettling "Liminal Space" vibe.
- [x] **Procedural Map Generation:**
    - Implemented **Recursive Backtracker** algorithm for randomized maze layouts.
    - Added logic to "sparsify" walls to create open rooms.
    - **Safe Spawn System:** Lifted map generation to `App.tsx` so Player always spawns in a valid cell (1,1).
- [x] **Immersive Environment (Next Step):**
    - [x] Apply iconic "Backrooms Yellow" wallpaper and carpet textures.
    - [ ] Implement flickering fluorescent lighting.
- [x] **Post-Processing (VHS Look):**
    - [x] Add Grain, Noise, Chromatic Aberration, and Scanlines.
- [ ] **Audio System:**
    - Add ambient "Hum-buzz" noise.
    - Add footstep sounds synchronized with movement.

## Phase 3: Gameplay Loop (Planned)
**Goal:** Implement the "Psychological Horror" loop based on Wikidot Level 0 lore (Isolation, Hallucinations, Non-Euclidean).
- [x] **Sanity System:**
    - Invisible "Sanity" stat decreses over time.
    - Low Sanity triggers visual distortions (Camera shake, darkness) and auditory hallucinations (whispers).
- [x] **Hallucinations (The "Entities"):**
    - Since Level 0 has no physical monsters, implement *fake* threats.
    - "Shadow People": Dark figures in the distance that vanish when looked at.
    - "Fake Geometries": Walls that shouldn't be there, or doors that disappear.
- [x] **Objective - The Manila Room:**
    - A rare room with Manila-colored wallpaper, a table, and a chair.
    - [x] **Note Reading Win Condition:** Finding the room is not enough; player must read the note on the table.
- [x] **Interaction:**
    - [x] Raycast system for looking at objects.
    - [x] Press 'E' to interact.
    - [x] UI Overlay for reading text.

## Phase 4: Polish & Optimization (Planned)
**Goal:** Refine the experience for release.
- [ ] **Performance:** Instanced Rendering for walls (currently individual meshes).
- [ ] **UI:** Main Menu, Pause Menu, Game Over screen.
- [ ] **Build:** Production build configuration.
