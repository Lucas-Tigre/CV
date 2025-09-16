import { config } from './config.js';
import * as particle from './particle.js';
import * as projectile from './projectile.js';

/**
 * Spawns a new enemy and adds it to the enemies array.
 * @param {Array} currentEnemies - The current array of enemies.
 * @param {string|null} typeKey - The specific type of enemy to spawn. If null, a random enemy is spawned.
 * @returns {Array} The new array of enemies.
 */
export function spawnEnemy(currentEnemies, typeKey = null) {
    let newEnemies = [...currentEnemies];
    try {
        if (!typeKey) {
            let random = Math.random();
            let cumulativeChance = 0;
            for (const [key, type] of Object.entries(config.enemySystem.types)) {
                if (type.chance > 0) {
                    cumulativeChance += type.chance;
                    if (random <= cumulativeChance) {
                        typeKey = key;
                        break;
                    }
                }
            }
        }
        if (!typeKey) {
            typeKey = 'fast';
        }

        const type = config.enemySystem.types[typeKey];
        if (!type) {
            console.error(`Enemy type "${typeKey}" not found in config.`);
            return newEnemies;
        }

        const isElite = typeKey === 'boss' || typeKey === 'finalBoss' || Math.random() < 0.1;
        let health = type.health || (config.enemySystem.baseHealth + (config.wave.number * config.enemySystem.healthIncreasePerLevel));
        if (type.healthMultiplier) {
            health *= type.healthMultiplier;
        }

        const enemy = {
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            type: typeKey,
            health: health,
            maxHealth: health,
            speedX: 0,
            speedY: 0,
            baseSpeed: type.speed * (isElite ? config.enemySystem.eliteMultiplier : 1),
            face: type.face[Math.floor(Math.random() * type.face.length)],
            isElite,
            behavior: type.behavior,
            color: type.color,
            size: type.size || (config.enemySystem.baseSize * (isElite ? config.enemySystem.eliteSizeMultiplier : 1))
        };

        if (enemy.behavior === 'crossScreen') {
            const edge = Math.floor(Math.random() * 4);
            let targetX, targetY;
            const padding = 100; // Spawn off-screen

            switch (edge) {
                case 0: // Top
                    enemy.x = Math.random() * window.innerWidth;
                    enemy.y = -padding;
                    targetX = Math.random() * window.innerWidth;
                    targetY = window.innerHeight + padding;
                    break;
                case 1: // Right
                    enemy.x = window.innerWidth + padding;
                    enemy.y = Math.random() * window.innerHeight;
                    targetX = -padding;
                    targetY = Math.random() * window.innerHeight;
                    break;
                case 2: // Bottom
                    enemy.x = Math.random() * window.innerWidth;
                    enemy.y = window.innerHeight + padding;
                    targetX = Math.random() * window.innerWidth;
                    targetY = -padding;
                    break;
                case 3: // Left
                    enemy.x = -padding;
                    enemy.y = Math.random() * window.innerHeight;
                    targetX = window.innerWidth + padding;
                    targetY = Math.random() * window.innerHeight;
                    break;
            }

            const dx = targetX - enemy.x;
            const dy = targetY - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            enemy.speedX = (dx / dist) * enemy.baseSpeed;
            enemy.speedY = (dy / dist) * enemy.baseSpeed;
        }

        if (type.huntRadius) enemy.huntRadius = type.huntRadius;
        if (type.behavior === 'huntAndShoot') {
            enemy.shootCooldown = type.shootCooldown;
            enemy.preferredDistance = type.preferredDistance;
        }
        if (typeKey === 'boss' || typeKey === 'finalBoss') {
            enemy.attackCooldown = Math.random() * 120 + 180; // Cooldown between 3-5 seconds (at 60fps)
        }

        newEnemies.push(enemy);
    } catch (error) {
        console.error("Erro ao spawnar inimigo:", error);
    }
    return newEnemies;
}

/**
 * Updates the position and state of all enemies.
 * @param {Array} enemies - The array of enemies to update.
 * @param {object} player - The player object.
 * @param {number} deltaTime - The time since the last frame.
 * @returns {object} - An object containing gameOver status, xp from defeated enemies, and the new enemies array.
 */
export function updateEnemies(enemies, player, deltaTime, particles, projectiles) {
    let gameOver = false;
    let xpFromDefeatedEnemies = 0;
    let remainingEnemies = [];
    let particlesFromExplosions = particles;
    let newProjectiles = projectiles;

    enemies.forEach(enemy => {
        // Boss attack logic
        if (enemy.attackCooldown !== undefined) {
            enemy.attackCooldown--;
            if (enemy.attackCooldown <= 0) {
                particlesFromExplosions = particle.createParticleExplosion(enemy.x, enemy.y, particlesFromExplosions);
                enemy.attackCooldown = Math.random() * 120 + 180; // Reset cooldown
            }
        }

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distSq = dx * dx + dy * dy;

        // Black Hole Attraction & Damage Logic
        const effectiveRadius = player.isPoweredUp ? player.radius * 1.5 : player.radius;
        if (player.mode === 'attract' && distSq < effectiveRadius * effectiveRadius) {
            // Damping: Reduce the enemy's current velocity. Bosses have more inertia.
            const damping = (enemy.type === 'boss' || enemy.type === 'finalBoss') ? 0.98 : 0.9;
            enemy.speedX *= damping;
            enemy.speedY *= damping;

            const dist = Math.sqrt(distSq);
            const radialForce = 0.5; // Strong inward pull.
            const tangentialForce = 0.25; // Weaker orbital pull.
            const radial_nx = dx / dist;
            const radial_ny = dy / dist;
            const tangential_nx = -radial_ny;
            const tangential_ny = radial_nx;

            const forceMagnitude = (1 - dist / effectiveRadius);
            enemy.speedX += (radial_nx * radialForce + tangential_nx * tangentialForce) * forceMagnitude;
            enemy.speedY += (radial_ny * radialForce + tangential_ny * tangentialForce) * forceMagnitude;

            const damage = player.isPoweredUp ? player.attractionDamage * 3 : player.attractionDamage;
            enemy.health -= damage;

            if (enemy.health <= 0) {
                xpFromDefeatedEnemies += enemy.isElite ? 10 : 3;
                config.enemiesDestroyed++;
                return; // Skip the rest of the logic for this defeated enemy
            }
        } else {
             // Normal Behavior
            switch (enemy.behavior) {
                case 'huntAndShoot':
                    {
                        const dist = Math.sqrt(distSq);
                        if (dist > enemy.preferredDistance) {
                            // Move closer
                            enemy.speedX = (dx / dist) * enemy.baseSpeed;
                            enemy.speedY = (dy / dist) * enemy.baseSpeed;
                        } else if (dist < enemy.preferredDistance * 0.8) {
                            // Move away
                            enemy.speedX = -(dx / dist) * enemy.baseSpeed;
                            enemy.speedY = -(dy / dist) * enemy.baseSpeed;
                        } else {
                            // Correct distance, stop and shoot
                            enemy.speedX *= 0.8;
                            enemy.speedY *= 0.8;
                        }

                        // Shooting logic
                        enemy.shootCooldown--;
                        if (enemy.shootCooldown <= 0) {
                            newProjectiles.push(projectile.createProjectile(enemy.x, enemy.y, player.x, player.y));
                            enemy.shootCooldown = config.enemySystem.types.hunter.shootCooldown;
                        }
                    }
                    break;
                case 'hunt':
                     if (enemy.huntRadius && distSq < enemy.huntRadius * enemy.huntRadius) {
                        const dist = Math.sqrt(distSq);
                        if (dist > 0) {
                           enemy.speedX = (dx / dist) * enemy.baseSpeed;
                           enemy.speedY = (dy / dist) * enemy.baseSpeed;
                        }
                    } else {
                        enemy.speedX += (Math.random() - 0.5) * 0.5;
                        enemy.speedY += (Math.random() - 0.5) * 0.5;
                    }
                    break;
                case 'crossScreen':
                    // Do nothing, let the initial velocity carry it.
                    break;
                default: // 'wander'
                    enemy.speedX += (Math.random() - 0.5) * 0.5;
                    enemy.speedY += (Math.random() - 0.5) * 0.5;
            }
        }

        enemy.x += enemy.speedX * (deltaTime / 16.67);
        enemy.y += enemy.speedY * (deltaTime / 16.67);
        enemy.speedX *= 0.95; // Friction
        enemy.speedY *= 0.95;

        enemy.x = Math.max(10, Math.min(window.innerWidth - 10, enemy.x));
        enemy.y = Math.max(10, Math.min(window.innerHeight - 10, enemy.y));

        const distToPlayer = Math.sqrt(distSq);
        if (distToPlayer < (player.size + enemy.size) * 0.6) {
            const damage = (config.enemySystem.types[enemy.type].damage || 5) * (deltaTime / 16.67);
            player.health -= damage;
            if (player.health <= 0) {
                player.health = 0;
                gameOver = true;
            }
        }

        remainingEnemies.push(enemy);
    });

    return { gameOver, xpFromDefeatedEnemies, newEnemies: remainingEnemies, newParticles: particlesFromExplosions, newProjectiles };
}
