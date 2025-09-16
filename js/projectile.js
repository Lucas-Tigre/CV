/**
 * Creates a new projectile.
 * @param {number} x - The starting x-coordinate.
 * @param {number} y - The starting y-coordinate.
 * @param {number} targetX - The x-coordinate of the target.
 * @param {number} targetY - The y-coordinate of the target.
 * @returns {object} The new projectile object.
 */
export function createProjectile(x, y, targetX, targetY) {
    const dx = targetX - x;
    const dy = targetY - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = 5;

    return {
        x,
        y,
        speedX: (dx / dist) * speed,
        speedY: (dy / dist) * speed,
        size: 5,
        color: '#FF00FF', // Magenta for now
        damage: 10,
        lifespan: 180 // 3 seconds at 60fps
    };
}

/**
 * Updates the position of all active projectiles.
 * @param {Array} projectiles - The array of projectiles to update.
 * @returns {Array} The new array of projectiles after moving and culling.
 */
export function updateProjectiles(projectiles) {
    return projectiles.filter(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.lifespan--;
        // Keep the projectile if it's within its lifespan and on screen
        return p.lifespan > 0 && p.x > 0 && p.x < window.innerWidth && p.y > 0 && p.y < window.innerHeight;
    });
}

/**
 * Renders all active projectiles on the canvas.
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
 * @param {Array} projectiles - The array of projectiles to render.
 */
export function renderProjectiles(ctx, projectiles) {
    projectiles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
}
