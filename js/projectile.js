/**
 * Cria um novo projétil.
 * @param {number} x - A coordenada X inicial.
 * @param {number} y - A coordenada Y inicial.
 * @param {number} targetX - A coordenada X do alvo.
 * @param {number} targetY - A coordenada Y do alvo.
 * @param {string} type - O tipo de projétil ('normal' ou 'explosive').
 * @returns {object} O novo objeto de projétil.
 */
export function createProjectile(x, y, targetX, targetY, type = 'normal') {
    const dx = targetX - x;
    const dy = targetY - y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const projectileData = {
        speed: 5,
        size: 5,
        color: '#FF00FF', // Magenta para projéteis normais.
        damage: 10,
        lifespan: 180, // Duração de 3 segundos a 60fps.
        onDeath: null
    };

    if (type === 'explosive') {
        projectileData.color = '#FFA500'; // Laranja para explosivos.
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
 * Atualiza a posição e o estado de todos os projéteis ativos.
 * @param {Array} projectiles - O array de projéteis para atualizar.
 * @returns {object} Um objeto contendo os projéteis restantes e quaisquer novas explosões a serem criadas.
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
            // Se o projétil saiu da tela ou seu tempo de vida acabou, ele é removido.
            // Verifica se há um evento de "morte" a ser acionado.
            if (p.onDeath === 'explode') {
                newExplosions.push({
                    x: p.x,
                    y: p.y,
                    radius: p.explosionRadius,
                    damage: p.damage, // O dano da explosão pode ser o mesmo do projétil.
                    duration: 30,    // Duração de 0.5 segundos a 60fps.
                    color: p.color
                });
            }
        }
    });

    return { remainingProjectiles, newExplosions };
}

/**
 * Renderiza todos os projéteis ativos no canvas.
 * @param {CanvasRenderingContext2D} ctx - O contexto de renderização do canvas.
 * @param {Array} projectiles - O array de projéteis para renderizar.
 */
export function renderProjectiles(ctx, projectiles) {
    projectiles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
}
