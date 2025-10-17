import { config } from './config.js';
import { playSound } from './utils.js';

// Um "pool" (piscina) de objetos para reutilizar partículas em vez de criar e destruir constantemente.
const particlePool = [];

/**
 * Pega uma partícula do pool ou cria uma nova se o pool estiver vazio.
 * @param {object} player - O objeto do jogador, para evitar gerar partículas muito perto dele.
 * @param {number} [x] - Posição x inicial opcional.
 * @param {number} [y] - Posição y inicial opcional.
 * @returns {object} Uma instância de partícula.
 */
export function getParticle(player, x, y) {
    const spawnPadding = 200; // Distância mínima do jogador para gerar uma nova partícula.
    let posX, posY;
    do {
        posX = x !== undefined ? x : Math.random() * window.innerWidth;
        posY = y !== undefined ? y : Math.random() * window.innerHeight;
    } while (
        player &&
        Math.abs(posX - player.x) < spawnPadding &&
        Math.abs(posY - player.y) < spawnPadding
    );

    if (particlePool.length > 0) {
        const p = particlePool.pop();
        p.x = posX;
        p.y = posY;
        p.size = Math.random() * 4 + 2;
        p.color = `hsl(${Math.random() * 360}, 80%, 60%)`;
        p.speedX = (Math.random() - 0.5) * 3;
        p.speedY = (Math.random() - 0.5) * 3;
        p.trail = [];
        return p;
    }
    return createParticle(posX, posY);
}

/**
 * Cria uma partícula especial de cura em uma posição específica.
 * @param {number} x - A posição x onde a partícula será criada.
 * @param {number} y - A posição y onde a partícula será criada.
 * @returns {object} O objeto da partícula de cura.
 */
export function createHealParticle(x, y) {
    return {
        x, y,
        size: 8,
        color: 'lightgreen',
        xpValue: 0, // Partículas de cura não dão XP.
        special: 'heal',
        healAmount: 10, // Quantidade de vida a ser recuperada.
        speedX: (Math.random() - 0.5) * 2,
        speedY: (Math.random() - 0.5) * 2,
        trail: []
    };
}

/**
 * Cria um novo objeto de partícula com propriedades aleatórias.
 * @param {number} x - A posição x da partícula.
 * @param {number} y - A posição y da partícula.
 * @returns {object} O novo objeto de partícula.
 */
export function createParticle(x, y) {
    let particleType;
    if (Math.random() < 0.02) { // 2% de chance de ser um power-up.
        particleType = { color: 'gold', size: 10, xp: 50, special: 'powerup' };
    } else {
        const types = [
            { color: `hsl(${Math.random() * 60 + 180}, 80%, 60%)`, size: 3, xp: 2 }, // Padrão
            { color: `hsl(${Math.random() * 60 + 60}, 80%, 60%)`, size: 5, xp: 5 },  // Maior
            { color: `hsl(${Math.random() * 60 + 300}, 80%, 60%)`, size: 2, xp: 7, special: 'speed' }, // Rápida
        ];
        particleType = Math.random() > 0.8 ? types[Math.floor(Math.random() * types.length)] : types[0];
    }

    return {
        x, y,
        size: particleType.size,
        color: particleType.color,
        xpValue: particleType.xp,
        special: particleType.special,
        speedX: (Math.random() - 0.5) * (particleType.special === 'speed' ? 6 : 3),
        speedY: (Math.random() - 0.5) * (particleType.special === 'speed' ? 6 : 3),
        trail: []
    };
}

/**
 * Cria uma explosão de partículas hostis (ataque do chefe).
 * @param {number} x - Posição x da explosão.
 * @param {number} y - Posição y da explosão.
 * @param {Array} existingParticles - O array de partículas existente para adicionar as novas.
 * @returns {Array} O novo array de partículas.
 */
export function createParticleExplosion(x, y, existingParticles) {
    const newParticles = [...existingParticles];
    const count = 20;
    const speed = 5;
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const particle = {
            x,
            y,
            speedX: Math.cos(angle) * speed * (Math.random() * 0.5 + 0.75),
            speedY: Math.sin(angle) * speed * (Math.random() * 0.5 + 0.75),
            size: 5,
            color: 'hsl(0, 100%, 70%)', // Vermelho brilhante
            isHostile: true,
            lifespan: 120, // 2 segundos a 60fps
            trail: []
        };
        newParticles.push(particle);
    }
    return newParticles;
}

/** Gera novas partículas se a contagem atual estiver abaixo de um limite mínimo. */
export function autoRespawnParticles(currentParticles, player) {
    let newParticles = [...currentParticles];
    if (newParticles.length < config.particleRespawn.minParticles) {
        for (let i = 0; i < config.particleRespawn.respawnAmount; i++) {
            const p = getParticle(player);
            p.size = 3;
            p.targetSize = p.size;
            newParticles.push(p);
        }
        playSound('respawn');
    }
    return newParticles;
}

/**
 * Atualiza o estado de todas as partículas (movimento, colisão, etc.).
 * @param {Array} currentParticles - O array de partículas a ser atualizado.
 * @param {object} player - O objeto do jogador.
 * @param {number} deltaTime - O tempo decorrido desde o último frame.
 * @param {number} lastUpdateIndex - O índice da última partícula atualizada (para otimização).
 * @returns {object} Um objeto contendo o novo estado das partículas e informações sobre eventos (XP, power-up).
 */
export function updateParticles(currentParticles, player, deltaTime, lastUpdateIndex) {
    let newParticles = [...currentParticles];
    let absorbedXp = 0;
    let powerupCollected = false;
    let healCollected = false;
    let healAmount = 0;
    const updatesThisFrame = Math.min(100, newParticles.length); // Limita o número de atualizações por frame.
    let newLastUpdateIndex = lastUpdateIndex;

    for (let i = 0; i < updatesThisFrame; i++) {
        const idx = (newLastUpdateIndex + i) % newParticles.length;
        const p = newParticles[idx];
        if (!p) continue;

        // Lógica para partículas hostis (ataques de chefe).
        if (p.isHostile) {
            p.x += p.speedX;
            p.y += p.speedY;
            p.lifespan--;
            if (p.lifespan <= 0) {
                newParticles.splice(idx, 1);
                i--; // Ajusta o índice do loop após remover um item.
            }
            continue; // Partículas hostis não seguem a lógica abaixo.
        }

        if (p.size > (p.targetSize || 3)) p.size -= 0.1;

        const dx = player.x - p.x;
        const dy = player.y - p.y;
        const distSq = dx * dx + dy * dy;

        const effectiveRadius = player.isPoweredUp ? player.radius * 1.5 : player.radius;

        if (distSq < effectiveRadius * effectiveRadius) {
            const dist = Math.sqrt(distSq);
            const suctionRadius = effectiveRadius * 0.2; // Raio de "sucção" imediata.
            const isVeryClose = dist < suctionRadius;

            if (player.mode === 'attract') {
                p.speedX *= 0.9; // Amortecimento do movimento.
                p.speedY *= 0.9;
                const radialForce = 0.6;
                const tangentialForce = 0.3;
                const radial_nx = dx / dist;
                const radial_ny = dy / dist;
                const tangential_nx = -radial_ny;
                const tangential_ny = radial_nx;
                const forceMagnitude = (1 - dist / player.radius);
                p.speedX += (radial_nx * radialForce + tangential_nx * tangentialForce) * forceMagnitude * (deltaTime / 16.67);
                p.speedY += (radial_ny * radialForce + tangential_ny * tangentialForce) * forceMagnitude * (deltaTime / 16.67);

                if (isVeryClose && dist < player.size * 0.8) {
                    if (p.special === 'powerup') {
                        powerupCollected = true;
                    } else if (p.special === 'heal') {
                        healCollected = true;
                        healAmount = p.healAmount;
                    }
                    absorbedXp += p.xpValue || 1;
                    config.particlesAbsorbed++;
                    playSound('absorb');
                    particlePool.push(newParticles.splice(idx, 1)[0]); // Devolve a partícula ao pool.
                    i--;
                    continue;
                }
            } else if (player.mode === 'repel') {
                const nx = dx / dist;
                const ny = dy / dist;
                p.speedX -= nx * 0.2 * (1 - dist / player.radius) * (deltaTime / 16.67);
                p.speedY -= ny * 0.2 * (1 - dist / player.radius) * (deltaTime / 16.67);
            }
        }

        p.x += p.speedX * (deltaTime / 16.67);
        p.y += p.speedY * (deltaTime / 16.67);

        // Colisão com as bordas da tela.
        if (p.x < 0 || p.x > window.innerWidth) p.speedX *= -0.8;
        if (p.y < 0 || p.y > window.innerHeight) p.speedY *= -0.8;

        // Lógica do rastro da partícula.
        p.trail.push({ x: p.x, y: p.y, size: p.size });
        if (p.trail.length > 5) p.trail.shift();
    }

    newLastUpdateIndex = (newLastUpdateIndex + updatesThisFrame) % (newParticles.length || 1);

    return { newParticles, absorbedXp, newLastUpdateIndex, powerupCollected, healCollected, healAmount };
}

/**
 * Renderiza todas as partículas ativas e seus rastros no canvas.
 * @param {CanvasRenderingContext2D} ctx - O contexto de renderização do canvas.
 * @param {Array} particles - O array de partículas a serem renderizadas.
 */
export function renderParticles(ctx, particles) {
    particles.forEach(p => {
        p.trail.forEach((trail, i) => {
            const alpha = i / p.trail.length;
            ctx.fillStyle = p.color.replace(')', `, ${alpha})`).replace('hsl', 'hsla');
            ctx.beginPath();
            ctx.arc(trail.x, trail.y, trail.size * alpha, 0, Math.PI * 2);
            ctx.fill();
        });
        if (p.special === 'heal') {
            // Desenha o retângulo vermelho de fundo.
            ctx.fillStyle = 'red';
            ctx.fillRect(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);

            // Desenha a cruz branca no centro.
            ctx.fillStyle = 'white';
            ctx.fillRect(p.x - p.size / 2, p.y - p.size * 1.5, p.size, p.size * 3);
            ctx.fillRect(p.x - p.size * 1.5, p.y - p.size / 2, p.size * 3, p.size);
        } else {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}
