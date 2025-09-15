import { config } from './config.js';
import { playSound } from './utils.js';

const particlePool = [];

export function getParticle(player, x, y) {
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

export function createParticle(x, y) {
    let particleType;
    // Adiciona uma pequena chance de criar um power-up
    if (Math.random() < 0.2) { // 2% de chance
        particleType = { color: 'gold', size: 10, xp: 50, special: 'powerup' };
    } else {
        const types = [
            { color: `hsl(${Math.random() * 60 + 180}, 80%, 60%)`, size: 3, xp: 2 },
            { color: `hsl(${Math.random() * 60 + 60}, 80%, 60%)`, size: 5, xp: 5 },
            { color: `hsl(${Math.random() * 60 + 300}, 80%, 60%)`, size: 2, xp: 7, special: 'speed' },
            { color: 'white', size: 6, xp: 10, special: 'heal' }
        ];
        particleType = Math.random() > 0.8 ? types[Math.floor(Math.random() * types.length)] : types[0];
    }

    return {
        x: x, y: y, size: particleType.size, color: particleType.color, xpValue: particleType.xp, special: particleType.special,
        speedX: (Math.random() - 0.5) * (particleType.special === 'speed' ? 6 : 3),
        speedY: (Math.random() - 0.5) * (particleType.special === 'speed' ? 6 : 3),
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
            color: 'hsl(0, 100%, 70%)', // Bright red
            isHostile: true,
            lifespan: 120, // 2 seconds at 60fps
            trail: []
        };
        newParticles.push(particle);
    }
    return newParticles;
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
    let powerupCollected = false;
    const updatesThisFrame = Math.min(100, newParticles.length);
    let newLastUpdateIndex = lastUpdateIndex;

    for (let i = 0; i < updatesThisFrame; i++) {
        const idx = (newLastUpdateIndex + i) % newParticles.length;
        const p = newParticles[idx];
        if (!p) continue;

        if (p.isHostile) {
            p.x += p.speedX;
            p.y += p.speedY;
            p.lifespan--;
            if (p.lifespan <= 0) {
                newParticles.splice(idx, 1);
                i--; // Adjust index after splice
            }
            continue; // Hostile particles skip all other logic
        }

        if (p.size > (p.targetSize || 3)) p.size -= 0.1;

        const dx = player.x - p.x;
        const dy = player.y - p.y;
        const distSq = dx * dx + dy * dy;

        const effectiveRadius = player.isPoweredUp ? player.radius * 1.5 : player.radius;

        if (distSq < effectiveRadius * effectiveRadius) {
            const dist = Math.sqrt(distSq);
            const suctionRadius = effectiveRadius * 0.2;
            const isVeryClose = dist < suctionRadius;

            if (player.mode === 'attract') {
                p.speedX *= 0.9;
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
                    }
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

        p.x += p.speedX * (deltaTime / 16.67);
        p.y += p.speedY * (deltaTime / 16.67);

        if (p.x < 0 || p.x > window.innerWidth) p.speedX *= -0.8;
        if (p.y < 0 || p.y > window.innerHeight) p.speedY *= -0.8;

        p.trail.push({ x: p.x, y: p.y, size: p.size });
        if (p.trail.length > 5) p.trail.shift();
    }

    newLastUpdateIndex = (newLastUpdateIndex + updatesThisFrame) % (newParticles.length || 1);

    return { newParticles, absorbedXp, newLastUpdateIndex, powerupCollected };
}
