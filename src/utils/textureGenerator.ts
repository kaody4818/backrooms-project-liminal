export const createWallpaperTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Background
    ctx.fillStyle = '#d4b962'; // Darker yellow
    ctx.fillRect(0, 0, 512, 512);

    // Pattern (Generic mono-yellow noise/pattern)
    ctx.fillStyle = '#e8cd76'; // Lighter yellow
    for (let y = 0; y < 512; y += 40) {
        for (let x = 0; x < 512; x += 40) {
            if ((x + y) % 80 === 0) {
                ctx.beginPath();
                ctx.arc(x, y, 15, 0, Math.PI * 2);
                ctx.fill();
            }

            // Add some noise
            if (Math.random() > 0.5) {
                ctx.fillStyle = `rgba(200, 180, 100, ${Math.random() * 0.1})`;
                ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
                ctx.fillStyle = '#e8cd76'; // Reset
            }
        }
    }

    // Grunge overlay
    for (let i = 0; i < 1000; i++) {
        ctx.fillStyle = `rgba(0,0,0, ${Math.random() * 0.05})`;
        ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
    }

    return canvas.toDataURL();
};

export const createCarpetTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Base
    ctx.fillStyle = '#cfb997'; // Beige
    ctx.fillRect(0, 0, 512, 512);

    // Constant Noise for carpet fiber look
    for (let i = 0; i < 50000; i++) {
        const shade = Math.random() > 0.5 ? 255 : 0;
        ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, 0.05)`;
        ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
    }

    // Damp stains
    for (let i = 0; i < 5; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const radius = 50 + Math.random() * 100;

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, 'rgba(100, 80, 50, 0.2)');
        gradient.addColorStop(1, 'rgba(100, 80, 50, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    return canvas.toDataURL();
};

export const createManilaWallTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    if (context) {
        // Beige/Manila background
        context.fillStyle = '#E2CFA4';
        context.fillRect(0, 0, 512, 512);

        // Add subtle noise/paper texture
        for (let i = 0; i < 50000; i++) {
            context.fillStyle = `rgba(100, 80, 50, ${Math.random() * 0.05})`;
            context.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
        }

        // Add faint vertical striping (paper grain)
        context.globalAlpha = 0.05;
        for (let i = 0; i < 512; i += 4) {
            context.fillStyle = '#8B4513';
            context.fillRect(i, 0, 1, 512);
        }
    }
    return canvas.toDataURL();
};

export const createWoodFloorTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    if (context) {
        // Dark wood background
        context.fillStyle = '#3E2723';
        context.fillRect(0, 0, 512, 512);

        const plankWidth = 64;
        const plankHeight = 256;

        // Draw planks
        for (let y = 0; y < 512; y += plankHeight) {
            for (let x = 0; x < 512; x += plankWidth) {
                // Slight color variation for each plank
                const shade = Math.random() * 20 - 10;
                const colorVal = Math.max(0, Math.min(255, 62 + shade));
                context.fillStyle = `rgb(${colorVal}, ${colorVal * 0.6}, ${colorVal * 0.3})`;

                // Offset every other row
                const xOffset = (y / plankHeight) % 2 === 0 ? 0 : plankWidth / 2;
                const drawX = (x + xOffset) % 512;

                context.fillRect(drawX, y, plankWidth - 2, plankHeight - 2); // -2 for gap
            }
        }
    }
    return canvas.toDataURL();
};

export const createCeilingTileTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Base White
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, 512, 512);

    // Tiles (64x64 grid)
    const tileSize = 64;

    for (let y = 0; y < 512; y += tileSize) {
        for (let x = 0; x < 512; x += tileSize) {

            // Tile Border (Darker gap)
            ctx.fillStyle = '#d0d0d0';
            ctx.fillRect(x, y, tileSize, tileSize);

            // Tile Face (Lighter)
            ctx.fillStyle = '#f5f5f5';
            ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);

            // Perforations/Dots (Acoustic look)
            ctx.fillStyle = '#cccccc';
            for (let i = 0; i < 20; i++) {
                const dx = x + 4 + Math.random() * (tileSize - 8);
                const dy = y + 4 + Math.random() * (tileSize - 8);
                ctx.fillRect(dx, dy, 2, 2);
            }
        }
    }

    // Dirt/Occlusion
    for (let i = 0; i < 500; i++) {
        ctx.fillStyle = `rgba(0,0,0, ${Math.random() * 0.05})`;
        ctx.fillRect(Math.random() * 512, Math.random() * 512, 4, 4);
    }

    return canvas.toDataURL();
};
