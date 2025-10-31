let debug = false;

// info for page elements 
const pondContainer = document.getElementById('pond-container');
const FISH_WIDTH = 300;
const FISH_HEIGHT = 200; 

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

        // If no intersection is found (unlikely), set a large distance.
        if (t === Infinity) {
            t = 10000;
        }

        const extension = 600;
        return [cx + (t + extension) * vx, cy + (t + extension) * vy];
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
     * @param {number[]} [coords=[-1,-1]] - The [x,y] point the fish must pass through (defaults to [-1,-1] for random location)
     * @param {HTMLElement[]} [crumbsToEat=[]] - An array of crumb elements to "eat".
     */
    function spawnFish(coords = [-1,-1], crumbsToEat = []) {
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

        const startX = edgeStart[0];
        const startY = edgeStart[1];
        const endX = edgeEnd[0];
        const endY = edgeEnd[1];
        
        const rotationAngle = angleDegrees;
        const angleRadians = angleDegrees * (Math.PI / 180);

        // TODO: review this stuff that gemini helped with 
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

        // --- Gemini: Logic to "eat" crumbs ---
        if (crumbsToEat.length > 0) {
            const totalDistance = Math.hypot(endX - startX, endY - startY);
            const distanceToMid = Math.hypot(midPoint[0] - startX, midPoint[1] - startY);
            
            // Calculate time in milliseconds for fish to reach crumbs
            const timeToMid_ms = (distanceToMid / totalDistance) * duration * 1000;

            // Wait for the fish to reach the crumbs
            setTimeout(() => {
                crumbsToEat.forEach(crumb => {
                    crumb.classList.add('eaten'); // Trigger "eaten" animation
                    // Remove from DOM after the "eaten" animation (1s)
                    setTimeout(() => {
                        crumb.remove();
                    }, 1000); 
                });
            }, timeToMid_ms);
        }
        // --- END: Logic to "eat" crumbs ---

        fish.addEventListener('animationend', () => {
            // fade out da fish
            fish.classList.add('fading-out');
            
            // Remove da fish from the DOM after the fade-out animation completes
            setTimeout(() => {
                fish.remove();
            }, 1000); 
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
            updatePondDimensions();
        }, 250);
    }

    function throwBreadcrumbs(coords) {
        // --- GEMINI: Breadcrumb Particle Effect ---
        const crumbCount = Math.floor(Math.random() * 4) + 2; // 2-5 crumbs
        const crumbsToEat = []; // Array to hold new crumbs

        for (let i = 0; i < crumbCount; i++) {
            const crumb = document.createElement('div');
            crumb.classList.add('crumb');

            const size = Math.floor(Math.random() * 41) + 20; // 20px to 60px
            const randomAngle = Math.random() * 2 * Math.PI; // Random direction
            const randomDistance = Math.random() * 60 + 30; // 30px to 90px spread

            const translateX = Math.cos(randomAngle) * randomDistance;
            const translateY = Math.sin(randomAngle) * randomDistance;

            // --- NEW: Variance for floating ---
            const floatDuration = Math.random() * 1.5 + 1.5; // 1.0s to 1.5s
            const floatRotation = Math.random() * 50 + 2;     // 2deg to 6deg
            const floatTranslate = Math.random() * 5 + 3;    // 1px to 3px
            // --- END: New Variance ---

            // --- NEW: Create Ripple Effect ---
            const ripple = document.createElement('div');
            ripple.classList.add('ripple');

            // --- MODIFIED: Spawn ripple at crumb's landing spot ---
            const rippleX = coords[0] + translateX;
            const rippleY = coords[1] + translateY;
            ripple.style.left = `${rippleX}px`;
            ripple.style.top = `${rippleY}px`;
            // --- END: Modification ---

            // Set initial size based on crumb size (e.g., 1.5x)
            ripple.style.setProperty('--start-size', `${size * 1.5}px`); 
            // The ripple animation should start after the crumb spread animation (0.5s)
            ripple.style.animationDelay = '0.5s';
            
            pondContainer.appendChild(ripple);

            // Remove the ripple from the DOM after its animation finishes
            // 500ms delay + 2000ms animation = 2500ms
            setTimeout(() => {
                ripple.remove();
            }, 2500);
            // --- END: Ripple Effect ---

            crumb.style.left = `${coords[0]}px`;
            crumb.style.top = `${coords[1]}px`;
            crumb.style.width = `${size}px`;
            crumb.style.height = `${size}px`;

            // Pass random values to CSS for the animation
            crumb.style.setProperty('--tx', `${translateX}px`);
            crumb.style.setProperty('--ty', `${translateY}px`);

            // --- NEW: Set variance properties ---
            crumb.style.setProperty('--float-duration', `${floatDuration}s`);
            crumb.style.setProperty('--float-rotate', `${floatRotation}deg`);
            crumb.style.setProperty('--float-translate', `${floatTranslate}px`);
            // --- END: New Properties ---

            pondContainer.appendChild(crumb);
            crumbsToEat.push(crumb); // Add to our array
        }
        // --- END: Breadcrumb Particle Effect ---

        // Now spawn a fish and pass it the crumbs to eat
        spawnFish(coords, crumbsToEat);
        console.log("Spawning fish through [" + coords[0] + ", " + coords[1] + "]." );
    }

    initPond(); 
    window.addEventListener('resize', handleResize);

    // to make the page feel more lively and benefit from making the Live Fish Sim (if it's not too insane to call it that)...
    // we add some functionality! click on the pond to throw some bread crumbs and spawn a feesh!
    document.body.addEventListener('click', (event) => {
        // we actually listen on the body (not the pond), since the pond is in the background (z-index: -1)
        // we check if the click was on one of the foreground elements
        const clickedOnRockPanel = event.target.closest('.rock-panel');
        const clickedOnHeadContainer = event.target.closest('h1'); 

        // and if the click was NOT on a foreground element, we spawn a fish!
        if (!clickedOnRockPanel && !clickedOnHeadContainer) {
            // pass the [x, y] coordinates of the click directly to spawnFish, instead of randomizing the location
            throwBreadcrumbs([event.clientX, event.clientY]);
        }
    });
});

// TODO: fish fed counter
// TODO: fish variance in spawn
