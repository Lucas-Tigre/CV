/**
 * Atualiza o estado de todas as explosões ativas.
 * @param {Array} explosions - O array de explosões para atualizar.
 * @returns {Array} O novo array de explosões após remover as que terminaram.
 */
export function updateExplosions(explosions) {
    // Cada explosão tem uma duração. Decrementamos e removemos quando acaba.
    return explosions.filter(e => {
        e.duration--;
        return e.duration > 0;
    });
}

/**
 * Renderiza todas as explosões ativas no canvas.
 * @param {CanvasRenderingContext2D} ctx - O contexto de renderização do canvas.
 * @param {Array} explosions - O array de explosões para renderizar.
 */
export function renderExplosions(ctx, explosions) {
    explosions.forEach(e => {
        // A explosão é um círculo que expande rapidamente e desaparece.
        const progress = 1 - (e.duration / 30); // Assumindo que a duração inicial é 30
        const currentRadius = e.radius * progress;

        ctx.save();
        ctx.globalAlpha = 1 - progress; // Efeito de fade out
        ctx.beginPath();
        ctx.fillStyle = e.color;
        ctx.arc(e.x, e.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}
