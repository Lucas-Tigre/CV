/**
 * Atualiza o estado de todas as explosões ativas, diminuindo sua duração.
 * @param {Array} explosions - O array de explosões para atualizar.
 * @returns {Array} Um novo array contendo apenas as explosões que ainda estão ativas.
 */
export function updateExplosions(explosions) {
    // Cada explosão tem uma duração. A cada frame, a duração diminui.
    // A explosão é removida quando sua duração chega a zero.
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
        // A explosão é renderizada como um círculo que expande e desaparece.
        const progress = 1 - (e.duration / 30); // Assumindo que a duração inicial é 30.
        const currentRadius = e.radius * progress;

        ctx.save();
        ctx.globalAlpha = 1 - progress; // A opacidade diminui conforme a explosão envelhece (efeito de fade out).
        ctx.beginPath();
        ctx.fillStyle = e.color;
        ctx.arc(e.x, e.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}
