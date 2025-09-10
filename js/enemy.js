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
                if (type.chance > 0) { // Only consider enemies that can spawn randomly
                    cumulativeChance += type.chance;
                    if (random <= cumulativeChance) {
                        typeKey = key;
                        break;
                    }
                }
            }
        }

        // If no type was selected (e.g., all have 0 chance), default to normal
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
            speed: type.speed * (isElite ? config.enemySystem.eliteMultiplier : 1),
            face: type.face[Math.floor(Math.random() * type.face.length)],
            isElite,
            behavior: type.behavior,
            color: type.color,
            size: type.size || (config.enemySystem.baseSize * (isElite ? config.enemySystem.eliteSizeMultiplier : 1))
        };

        if (typeKey === 'hunter' || typeKey === 'boss' || typeKey === 'finalBoss') {
            enemy.huntRadius = type.huntRadius;
        }
        if (type.special === 'teleport') {
            enemy.teleportChance = type.teleportChance;
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
 * @returns {boolean} - Returns true if the game should be over.
 */
export function updateEnemies(enemies, player, deltaTime) {
    let gameOver = false;
    enemies.forEach(enemy => {
        // Behavior logic
        switch (enemy.behavior) {
            case 'hunt':
                const dx = player.x - enemy.x;
                const dy = player.y - enemy.y;
                const distSq = dx * dx + dy * dy;

                if (enemy.huntRadius && distSq < enemy.huntRadius * enemy.huntRadius) {
                    const dist = Math.sqrt(distSq);
                    if (dist > 0) {
                        enemy.x += (dx / dist) * enemy.speed * (deltaTime / 16.67);
                        enemy.y += (dy / dist) * enemy.speed * (deltaTime / 16.67);
                    }
                } else {
                    // Wander if player is out of range
                    enemy.x += (Math.random() - 0.5) * enemy.speed * 0.5 * (deltaTime / 16.67);
                    enemy.y += (Math.random() - 0.5) * enemy.speed * 0.5 * (deltaTime / 16.67);
                }
                break;

            case 'teleport':
                enemy.x += (Math.random() - 0.5) * enemy.speed * (deltaTime / 16.67);
                enemy.y += (Math.random() - 0.5) * enemy.speed * (deltaTime / 16.67);

                if (enemy.teleportChance && Math.random() < enemy.teleportChance) {
                    enemy.x = Math.random() * window.innerWidth;
                    enemy.y = Math.random() * window.innerHeight;
                }
                break;

            default: // 'wander'
                enemy.x += (Math.random() - 0.5) * enemy.speed * (deltaTime / 16.67);
                enemy.y += (Math.random() - 0.5) * enemy.speed * (deltaTime / 16.67);
        }

        // Keep inside screen
        enemy.x = Math.max(10, Math.min(window.innerWidth - 10, enemy.x));
        enemy.y = Math.max(10, Math.min(window.innerHeight - 10, enemy.y));

        // Collision with player
        const distToPlayer = Math.sqrt(
            Math.pow(enemy.x - player.x, 2) +
            Math.pow(enemy.y - player.y, 2)
        );

        if (distToPlayer < (player.size + enemy.size) * 0.6) {
            player.health -= 0.3 * (deltaTime / 16.67);

            if (player.health <= 0) {
                player.health = 0;
                gameOver = true;
            }
        }
    });
    return gameOver;
}
