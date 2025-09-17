/**
 * Creates a new projectile.
 * @param {number} x - The starting x-coordinate.
 * @param {number} y - The starting y-coordinate.
 * @param {number} targetX - The x-coordinate of the target.
 * @param {number} targetY - The y-coordinate of the target.
 * @returns {object} The new projectile object.
 */
export function createProjectile(x, y, targetX, targetY, type = 'normal') {
    const dx = targetX - x;
    const dy = targetY - y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const projectileData = {
        speed: 5,
        size: 5,
        color: '#FF00FF', // Magenta for normal
        damage: 10,
        lifespan: 180, // 3 seconds
        onDeath: null
    };

    if (type === 'explosive') {
        projectileData.color = '#FFA500'; // Orange for explosive
        projectileData.onDeath = 'explode';
        projectileData.explosionRadius = 50;
    }

    return {
        x,
        y,
        speedX: (dx / dist) * projectileData.speed,
        speedY: (dy / dist) * projectileData.speed,
        size: projectileData.size,
        color: projectileData.color,
        damage: projectileData.damage,
        lifespan: projectileData.lifespan,
        onDeath: projectileData.onDeath,
        explosionRadius: projectileData.explosionRadius
    };
}

/**
 * Updates the position of all active projectiles.
 * @param {Array} projectiles - The array of projectiles to update.
 * @returns {object} An object containing the new projectiles and explosions.
 */
export function updateProjectiles(projectiles) {
    const remainingProjectiles = [];
    const newExplosions = [];

    projectiles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.lifespan--;

        const isOnScreen = p.x > 0 && p.x < window.innerWidth && p.y > 0 && p.y < window.innerHeight;

        if (p.lifespan > 0 && isOnScreen) {
            remainingProjectiles.push(p);
        } else {
            // Projectile is removed, check for onDeath event
            if (p.onDeath === 'explode') {
                newExplosions.push({
                    x: p.x,
                    y: p.y,
                    radius: p.explosionRadius,
                    damage: p.damage, // Explosion damage can be the same as projectile damage
                    duration: 30, // 0.5 seconds
                    color: p.color
                });
            }
        }
    });

    return { remainingProjectiles, newExplosions };
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
