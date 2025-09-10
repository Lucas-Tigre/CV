import { config } from './config.js';

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
            typeKey = 'normal';
        }

        const type = config.enemySystem.types[typeKey];
        if (!type) {
            console.error(`Enemy type "${typeKey}" not found in config.`);
            return newEnemies;
        }

        const isElite = typeKey === 'boss' || typeKey === 'finalBoss' || Math.random() < 0.1;
        const healthMultiplier = type.health || (config.enemySystem.baseHealth + (config.wave.number * config.enemySystem.healthIncreasePerLevel));

        const enemy = {
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            type: typeKey,
            health: healthMultiplier,
            speedX: 0,
            speedY: 0,
            baseSpeed: type.speed * (isElite ? config.enemySystem.eliteMultiplier : 1),
            face: type.face[Math.floor(Math.random() * type.face.length)],
            isElite,
            behavior: type.behavior,
            color: type.color,
            size: type.size || (config.enemySystem.baseSize * (isElite ? config.enemySystem.eliteSizeMultiplier : 1))
        };

        if (typeKey === 'hunter' || typeKey === 'boss' || typeKey === 'finalBoss') enemy.huntRadius = type.huntRadius;
        if (type.special === 'teleport') enemy.teleportChance = type.teleportChance;

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
export function updateEnemies(enemies, player, deltaTime) {
    let gameOver = false;
    let xpFromDefeatedEnemies = 0;
    let remainingEnemies = [];

    enemies.forEach(enemy => {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distSq = dx * dx + dy * dy;

        // Black Hole Attraction & Damage Logic
        if (player.mode === 'attract' && distSq < player.radius * player.radius) {
            // Damping: Reduce the enemy's current velocity.
            enemy.speedX *= 0.9;
            enemy.speedY *= 0.9;

            const dist = Math.sqrt(distSq);
            const radialForce = 0.5; // Strong inward pull.
            const tangentialForce = 0.25; // Weaker orbital pull.
            const radial_nx = dx / dist;
            const radial_ny = dy / dist;
            const tangential_nx = -radial_ny;
            const tangential_ny = radial_nx;

            const forceMagnitude = (1 - dist / player.radius);
            enemy.speedX += (radial_nx * radialForce + tangential_nx * tangentialForce) * forceMagnitude;
            enemy.speedY += (radial_ny * radialForce + tangential_ny * tangentialForce) * forceMagnitude;

            enemy.health -= player.attractionDamage;
            if (enemy.health <= 0) {
                xpFromDefeatedEnemies += enemy.isElite ? 10 : 3;
                config.enemiesDestroyed++;
                return; // Skip the rest of the logic for this defeated enemy
            }
        } else {
             // Normal Behavior
            switch (enemy.behavior) {
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
                case 'teleport':
                    enemy.speedX += (Math.random() - 0.5) * 0.5;
                    enemy.speedY += (Math.random() - 0.5) * 0.5;
                    if (enemy.teleportChance && Math.random() < enemy.teleportChance) {
                        enemy.x = Math.random() * window.innerWidth;
                        enemy.y = Math.random() * window.innerHeight;
                    }
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
            player.health -= 0.3 * (deltaTime / 16.67);
            if (player.health <= 0) {
                player.health = 0;
                gameOver = true;
            }
        }

        remainingEnemies.push(enemy);
    });

    return { gameOver, xpFromDefeatedEnemies, newEnemies: remainingEnemies };
}
