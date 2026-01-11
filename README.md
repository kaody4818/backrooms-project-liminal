# Backrooms: Project Liminal

A web-based 3D psychological horror experience built with React, Three.js, and React Three Fiber.
This project creates an immersive, liminal space inspired by the "Backrooms" creepypasta.

![Project Status](https://img.shields.io/badge/Status-In%20Development-yellow)
![Version](https://img.shields.io/badge/Version-Proto%201.2-blue)

## 🌌 Explore the Levels

### Level 0: "The Lobby"
The classic monoyellow madness. Infinite beige carpets, buzzing fluorescent lights, and the feeling of being watched.
*   **Hazards:** Sanity Decay, Shadow Man.
*   **Objective:** Find the path forward.

### Level 0.2: "Remodeled Mess" **(NEW)**
A sector formerly under renovation by the "Backrooms Remodelling Co."
White paint, red carpets, and abandoned tools. But funding was cut, and the geometry is collapsing.
*   **Hazards:** Falling Ceiling Tiles ("The Collapse"), Debris.
*   **Lore:** Find scattered notes from disgruntled contractors.

## 🎮 How to Play

### Controls
*   **Move:** `W`, `A`, `S`, `D`
*   **Sprint:** `Shift`
*   **Jump:** `Space`
*   **Look:** Mouse (Click game screen to lock cursor)
*   **Interact:** `E` (Open doors, Read notes)
*   **Pause/Unlock Cursor:** `ESC`
*   **Debug Teleport:** `P` (To Level 0.2)

### Mechanics
*   **Sanity System:** Staying in the dark or looking at anomalies drains your sanity. Low sanity causes audio/visual hallucinations.
*   **Health:** Physical damage from hazards (like falling tiles) will kill you.
*   **Lore System:** Read notes found in the world to understand the story. Reading pauses the world (and safety).

## 🛠️ Tech Stack

*   **Core:** React 18, Vite, TypeScript
*   **3D Engine:** Three.js, @react-three/fiber
*   **Physics:** @react-three/cannon (Ammo.js based)
*   **Helpers:** @react-three/drei
*   **State:** Zustand
*   **Styling:** TailwindCSS

## 🚀 Installation & Run

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-repo/backrooms-project-liminal.git
    cd backrooms-project-liminal
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Start the development server:
    ```bash
    npm run dev
    ```

4.  Open `http://localhost:5173` in your browser.

---
*Created as part of an Advanced AI Agentic Coding experiment.*
