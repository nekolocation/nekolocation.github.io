let debug = false;

// info for page elements 
const pondContainer = document.getElementById('pond-container');
const FISH_WIDTH = 300;
const FISH_HEIGHT = 300;

// randomized time range for each new fish to spawn (in MS)
let min_spawn_delay = 5000;
let max_spawn_delay = 15000;

document.addEventListener('DOMContentLoaded', () => {
    let POND_WIDTH = window.innerWidth;
    let POND_HEIGHT = window.innerHeight;
    let fishSpawnerTimeout;
    let resizeTimer;

    /**
     * Updates viewport dimensions.
     */
    function updatePondDimensions() {
        POND_WIDTH = window.innerWidth;
        POND_HEIGHT = window.innerHeight;
    }

    /**
     * Calculates the exact point where a ray, starting from 'coords' at a given 'angle',
     * intersects with the boundaries of the pond.
     * @param {number[]} coords - The starting [x, y] coordinates.
     * @param {number} angle - The angle in degrees (0 is right, 90 is down).
     * @returns {number[]} - The [x, y] coordinates of the intersection point on the edge.
     */
    function findEndpoint(coords, angle) {
        const [cx, cy] = coords;
        const angleRadians = angle * (Math.PI / 180);
        const vx = Math.cos(angleRadians);
        const vy = Math.sin(angleRadians);

        let t = Infinity;

        // Calculate the scaling factor 't' to reach each of the four boundaries.
        // We are looking for the smallest positive 't'.
        if (vx !== 0) {
            const tx1 = (0 - cx) / vx; // Time to left edge
            const tx2 = (POND_WIDTH - cx) / vx; // Time to right edge
            if (tx1 > 0) t = Math.min(t, tx1);
            if (tx2 > 0) t = Math.min(t, tx2);
        }
        if (vy !== 0) {
            const ty1 = (0 - cy) / vy; // Time to top edge
            const ty2 = (POND_HEIGHT - cy) / vy; // Time to bottom edge
            if (ty1 > 0) t = Math.min(t, ty1);
            if (ty2 > 0) t = Math.min(t, ty2);
        }

        // If no intersection is found (unlikely), return a distant point.
        if (t === Infinity) {
            return [cx + vx * 10000, cy + vy * 10000];
        }

        return [cx + t * vx, cy + t * vy];
    }


    /**
     * Starts the continuous, randomly-timed fish spawning loop.
     */
    function startRandomSpawning() {
        if (fishSpawnerTimeout) clearTimeout(fishSpawnerTimeout);
        
        const nextDelay = Math.random() * (max_spawn_delay - min_spawn_delay) + min_spawn_delay;

        fishSpawnerTimeout = setTimeout(() => {
            // Only spawn a fish if the tab is currently active and visible.
            if (!document.hidden) {
                spawnFish();
            }
            startRandomSpawning();
        }, nextDelay);
    }

    /**
     * Creates and animates a single fish element.
     */
    function spawnFish(coords = [-1,-1]) {
        if (POND_WIDTH === 0 || POND_HEIGHT === 0) return;

        const fish = document.createElement('div');
        fish.classList.add('fish', 'fish-animation');

        const duration = Math.random() * 10 + 5;
        fish.style.animationDuration = `${duration}s`;

        let midX = 0;
        let midY = 0; 

        if (coords[0] !== -1 || coords[1] !== -1) {
            // if function passed coords, use it to spawn fish (to pass through "breadcrumbs") 
            midX = coords[0];
            midY = coords[1];
        }
        else {
            // if no manual entry, pick a random point within the inner 90% of the canvas (this will be a point the fish passes through)
            midX = (Math.random() * 0.90 + 0.05) * POND_WIDTH;
            midY = (Math.random() * 0.90 + 0.05) * POND_HEIGHT;
        }
        let midPoint = [midX, midY];

        // next, select a random angle for the fish's path, extended from that random point
        const angleDegrees = Math.random() * 360;
        const inverseAngle = (angleDegrees + 180) % 360;

        // we find the end-points of the fish's path using trig!
        const edgeStart = findEndpoint(midPoint, inverseAngle);
        const edgeEnd = findEndpoint(midPoint, angleDegrees);

        // once we have those points, we need to extend them outwards to ensure the fish is fully off-screen!
        // TODO: figure out a better way to do this; Gemini helped me lol 
        const angleRadians = angleDegrees * (Math.PI / 180);
        const offsetX = Math.cos(angleRadians) * FISH_WIDTH;
        const offsetY = Math.sin(angleRadians) * FISH_WIDTH;

        const startX = edgeStart[0] - offsetX;
        const startY = edgeStart[1] - offsetY;
        const endX = edgeEnd[0] + offsetX;
        const endY = edgeEnd[1] + offsetY;
        
        const rotationAngle = angleDegrees;

            // --- FIX FOR ANIMATION ---
            // The CSS animation rotates the element *and then* translates it. This moves
            // the element in its own rotated coordinate system, not the screen's.
            // To fix this, we must "un-rotate" the translation vector before passing it to CSS.

            // The desired movement in screen coordinates
            const dx = endX - startX;
            const dy = endY - startY;

            // Calculate the translation vector needed in the rotated coordinate system
            const cosA = Math.cos(angleRadians);
            const sinA = Math.sin(angleRadians);
            const tx = dx * cosA + dy * sinA;
            const ty = -dx * sinA + dy * cosA;

            // To align the fish's center with the path, we offset the start position.
            const startX_var = startX - FISH_WIDTH / 2;
            const startY_var = startY - FISH_HEIGHT / 2;

            // The end position variable is calculated from the start and the corrected translation.
            const endX_var = startX_var + tx;
            const endY_var = startY_var + ty;
        
        // use corrected CSS variables for the fish animations
        fish.style.setProperty('--start-x-pos', `${startX_var}px`);
        fish.style.setProperty('--start-y-pos', `${startY_var}px`);
        fish.style.setProperty('--end-x-pos', `${endX_var}px`);
        fish.style.setProperty('--end-y-pos', `${endY_var}px`);
        fish.style.setProperty('--rotation-angle', `${rotationAngle}deg`);

        pondContainer.appendChild(fish);

        fish.addEventListener('animationend', () => {
            // fade out da fish
            fish.classList.add('fading-out');
            
            // Remove the fish from the DOM after the fade-out animation completes
            setTimeout(() => {
                fish.remove();
            }, 1000); // This duration must match the CSS transition time
        });
    }

    /**
     * fill the pond with water
     */
    function initPond() {
        updatePondDimensions();
        if (fishSpawnerTimeout) clearTimeout(fishSpawnerTimeout);
        startRandomSpawning();
    }

    /**
     * resize handler with debouncing (ie: avoiding tons of fish spawning when we tab out and back in)
     */
    function handleResize() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            // Existing fish will continue their animation. 
            // We just update the dimensions for new fish.
            updatePondDimensions();
        }, 250);
    }

    initPond();
    window.addEventListener('resize', handleResize);
});

