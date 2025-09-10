import { config } from './config.js';
import { playSound } from './utils.js';

const particlePool = [];

function getParticle(player, x, y) {
    const spawnPadding = 200;
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

function createParticle(x, y) {
    const types = [
        { color: `hsl(${Math.random() * 60 + 180}, 80%, 60%)`, size: 3, xp: 1 },
        { color: `hsl(${Math.random() * 60 + 60}, 80%, 60%)`, size: 5, xp: 2 },
        { color: `hsl(${Math.random() * 60 + 300}, 80%, 60%)`, size: 2, xp: 3, special: 'speed' },
        { color: 'white', size: 6, xp: 5, special: 'heal' }
    ];
    const type = Math.random() > 0.8 ? types[Math.floor(Math.random() * types.length)] : types[0];
    return {
        x: x, y: y, size: type.size, color: type.color, xpValue: type.xp, special: type.special,
        speedX: (Math.random() - 0.5) * (type.special === 'speed' ? 6 : 3),
        speedY: (Math.random() - 0.5) * (type.special === 'speed' ? 6 : 3),
        trail: []
    };
}

export function initParticles(player) {
    const particles = [];
    for (let i = 0; i < config.particleCount; i++) {
        particles.push(getParticle(player));
    }
    return particles;
}

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

export function updateParticles(currentParticles, player, deltaTime, lastUpdateIndex) {
    let newParticles = [...currentParticles];
    let absorbedXp = 0;
    const updatesThisFrame = Math.min(100, newParticles.length);
    let newLastUpdateIndex = lastUpdateIndex;

    for (let i = 0; i < updatesThisFrame; i++) {
        const idx = (newLastUpdateIndex + i) % newParticles.length;
        const p = newParticles[idx];
        if (!p) continue;

        if (p.size > (p.targetSize || 3)) p.size -= 0.1;

        p.x += p.speedX * (deltaTime / 16.67);
        p.y += p.speedY * (deltaTime / 16.67);

        const dx = player.x - p.x;
        const dy = player.y - p.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < player.radius * player.radius) {
            const dist = Math.sqrt(distSq);
            const suctionRadius = player.radius * 0.2;
            const isVeryClose = dist < suctionRadius;

            if (player.mode === 'attract') {
                const radialForce = isVeryClose ? 0.8 : 0.4; // Increased radial force
                const tangentialForce = 0.2; // Decreased tangential force
                const radial_nx = dx / dist;
                const radial_ny = dy / dist;
                const tangential_nx = -radial_ny;
                const tangential_ny = radial_nx;

                // Combine radial (pull) and tangential (orbit) forces
                const forceMagnitude = (1 - dist / player.radius);
                p.speedX += (radial_nx * radialForce + tangential_nx * tangentialForce) * forceMagnitude * (deltaTime / 16.67);
                p.speedY += (radial_ny * radialForce + tangential_ny * tangentialForce) * forceMagnitude * (deltaTime / 16.67);

                if (isVeryClose && dist < player.size * 0.8) {
                    absorbedXp += p.xpValue || 1;
                    config.particlesAbsorbed++;
                    playSound('absorb');
                    particlePool.push(newParticles.splice(idx, 1)[0]);
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

        if (p.x < 0 || p.x > window.innerWidth) p.speedX *= -0.8;
        if (p.y < 0 || p.y > window.innerHeight) p.speedY *= -0.8;

        p.trail.push({ x: p.x, y: p.y, size: p.size });
        if (p.trail.length > 5) p.trail.shift();
    }

    newLastUpdateIndex = (newLastUpdateIndex + updatesThisFrame) % (newParticles.length || 1);

    return { newParticles, absorbedXp, newLastUpdateIndex };
}
