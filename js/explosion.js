/**
 * Updates the state of all active explosions.
 * @param {Array} explosions - The array of explosions to update.
 * @returns {Array} The new array of explosions after culling finished ones.
 */
export function updateExplosions(explosions) {
    // Each explosion has a duration. We decrement it and remove it when it's over.
    return explosions.filter(e => {
        e.duration--;
        return e.duration > 0;
    });
}

/**
 * Renders all active explosions on the canvas.
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
 * @param {Array} explosions - The array of explosions to render.
 */
export function renderExplosions(ctx, explosions) {
    explosions.forEach(e => {
        // The explosion is a circle that quickly expands and fades.
        const progress = 1 - (e.duration / 30); // Assuming initial duration is 30
        const currentRadius = e.radius * progress;

        ctx.save();
        ctx.globalAlpha = 1 - progress; // Fade out effect
        ctx.beginPath();
        ctx.fillStyle = e.color;
        ctx.arc(e.x, e.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}
