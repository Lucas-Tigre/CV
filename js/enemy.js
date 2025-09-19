import * as particle from './particle.js';
import * as projectile from './projectile.js';

/**
 * Gera um novo inimigo e o adiciona ao array de inimigos.
 * @param {object} config - O objeto de configuração do jogo.
 * @param {Array} currentEnemies - O array atual de inimigos.
 * @param {string|null} typeKey - O tipo específico de inimigo a ser gerado. Se nulo, um inimigo aleatório é gerado.
 * @returns {Array} O novo array de inimigos.
 */
export function spawnEnemy(config, currentEnemies, typeKey = null) {
    let newEnemies = [...currentEnemies];
    try {
        if (!typeKey) {
            let random = Math.random();
            let cumulativeChance = 0;
            for (const [key, type] of Object.entries(config.enemySystem.types)) {
                if (type.chance > 0) {
                    let currentChance = type.chance;
                    // Lógica de spawn progressivo para atiradores (temporariamente desativada para corrigir bug de spawn)
                    /*
                    if (key === 'shooter') {
                        // A chance aumenta 1% por onda, com um teto de 40%
                        currentChance += (config.wave.number * 0.01);
                        currentChance = Math.min(currentChance, 0.40);
                    }
                    */
                    cumulativeChance += currentChance;
                    if (random <= cumulativeChance) {
                        typeKey = key;
                        break;
                    }
                }
            }
        }
        if (!typeKey) {
            typeKey = 'fast'; // Inimigo padrão caso a lógica de chance falhe.
        }

        const type = config.enemySystem.types[typeKey];
        if (!type) {
            console.error(`Tipo de inimigo "${typeKey}" não encontrado na configuração.`);
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

        // Lógica de spawn para inimigos que cruzam a tela.
        if (enemy.behavior === 'crossScreen') {
            const edge = Math.floor(Math.random() * 4);
            let targetX, targetY;
            const padding = 100; // Gera o inimigo fora da tela para uma entrada mais suave.

            switch (edge) {
                case 0: // Topo
                    enemy.x = Math.random() * window.innerWidth;
                    enemy.y = -padding;
                    targetX = Math.random() * window.innerWidth;
                    targetY = window.innerHeight + padding;
                    break;
                case 1: // Direita
                    enemy.x = window.innerWidth + padding;
                    enemy.y = Math.random() * window.innerHeight;
                    targetX = -padding;
                    targetY = Math.random() * window.innerHeight;
                    break;
                case 2: // Fundo
                    enemy.x = Math.random() * window.innerWidth;
                    enemy.y = window.innerHeight + padding;
                    targetX = Math.random() * window.innerWidth;
                    targetY = -padding;
                    break;
                case 3: // Esquerda
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

        // Atribui propriedades específicas baseadas no tipo de inimigo.
        if (type.huntRadius) enemy.huntRadius = type.huntRadius;
        if (type.shootCooldown) {
            enemy.shootCooldown = type.shootCooldown;
            enemy.projectileType = type.projectileType || 'normal';
        }
        if (type.behavior === 'huntAndShoot') {
            enemy.preferredDistance = type.preferredDistance;
        }
        if (typeKey === 'boss' || typeKey === 'finalBoss') {
            enemy.attackCooldown = Math.random() * 120 + 180; // Cooldown do ataque do chefe (3 a 5 segundos).
        }

        newEnemies.push(enemy);
    } catch (error) {
        console.error("Erro ao gerar inimigo:", error);
    }
    return newEnemies;
}

/**
 * Atualiza a posição e o estado de todos os inimigos.
 * @param {Array} enemies - O array de inimigos para atualizar.
 * @param {object} player - O objeto do jogador.
 * @param {number} deltaTime - O tempo desde o último frame.
 * @param {Array} particles - O array de partículas (para explosões de chefe).
 * @param {Array} projectiles - O array de projéteis.
 * @returns {object} Um objeto contendo o XP ganho e os novos arrays de entidades.
 */
export function updateEnemies(config, enemies, player, deltaTime, particles, projectiles) {
    let xpFromDefeatedEnemies = 0;
    let remainingEnemies = [];
    let particlesFromExplosions = particles;
    let newProjectiles = projectiles;

    enemies.forEach(enemy => {
        // Lógica de ataque do chefe.
        if (enemy.attackCooldown !== undefined) {
            enemy.attackCooldown--;
            if (enemy.attackCooldown <= 0) {
                particlesFromExplosions = particle.createParticleExplosion(enemy.x, enemy.y, particlesFromExplosions);
                enemy.attackCooldown = Math.random() * 120 + 180; // Reinicia o cooldown.
            }
        }

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distSq = dx * dx + dy * dy;

        // Lógica de Atração e Dano do Vórtice do Jogador.
        const enemyType = config.enemySystem.types[enemy.type];
        const effectiveRadius = player.isPoweredUp ? player.radius * 1.5 : player.radius;
        if (player.mode === 'attract' && distSq < effectiveRadius * effectiveRadius && !enemyType.ignoresAttraction) {
            // Amortecimento: Reduz a velocidade atual do inimigo. Chefes têm mais inércia.
            const damping = (enemy.type === 'boss' || enemy.type === 'finalBoss') ? 0.98 : 0.9;
            enemy.speedX *= damping;
            enemy.speedY *= damping;

            const dist = Math.sqrt(distSq);
            const radialForce = 0.5; // Força de puxada para o centro.
            const tangentialForce = 0.25; // Força orbital (cria o efeito de vórtice).
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
                return; // Pula o resto da lógica para este inimigo, que já foi derrotado.
            }
        } else {
             // Comportamento Normal dos Inimigos (quando não estão sendo atraídos)
            switch (enemy.behavior) {
                case 'huntAndShoot':
                    {
                        const dist = Math.sqrt(distSq);
                        if (dist > enemy.preferredDistance) {
                            // Move-se em direção ao jogador.
                            enemy.speedX = (dx / dist) * enemy.baseSpeed;
                            enemy.speedY = (dy / dist) * enemy.baseSpeed;
                        } else if (dist < enemy.preferredDistance * 0.8) {
                            // Afasta-se se estiver muito perto.
                            enemy.speedX = -(dx / dist) * enemy.baseSpeed;
                            enemy.speedY = -(dy / dist) * enemy.baseSpeed;
                        } else {
                            // Para de se mover para atirar.
                            enemy.speedX *= 0.8;
                            enemy.speedY *= 0.8;
                        }

                        // Lógica de tiro.
                        enemy.shootCooldown--;
                        if (enemy.shootCooldown <= 0) {
                            newProjectiles.push(projectile.createProjectile(enemy.x, enemy.y, player.x, player.y, enemy.projectileType));
                            enemy.shootCooldown = config.enemySystem.types[enemy.type].shootCooldown;
                        }
                    }
                    break;
                case 'static':
                    {
                        // Fica parado.
                        enemy.speedX *= 0.8;
                        enemy.speedY *= 0.8;

                        // Lógica de tiro.
                        enemy.shootCooldown--;
                        if (enemy.shootCooldown <= 0) {
                            newProjectiles.push(projectile.createProjectile(enemy.x, enemy.y, player.x, player.y, enemy.projectileType));
                            enemy.shootCooldown = config.enemySystem.types[enemy.type].shootCooldown;
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
                        // Vagueia se o jogador estiver fora do raio de caça.
                        enemy.speedX += (Math.random() - 0.5) * 0.5;
                        enemy.speedY += (Math.random() - 0.5) * 0.5;
                    }
                    break;
                case 'crossScreen':
                    // Não faz nada, a velocidade inicial já foi definida no spawn.
                    break;
                default: // 'wander'
                    enemy.speedX += (Math.random() - 0.5) * 0.5;
                    enemy.speedY += (Math.random() - 0.5) * 0.5;
            }
        }

        // Atualização de Posição e Fricção
        enemy.x += enemy.speedX * (deltaTime / 16.67);
        enemy.y += enemy.speedY * (deltaTime / 16.67);
        enemy.speedX *= 0.95; // Fricção para suavizar o movimento.
        enemy.speedY *= 0.95;

        // Mantém o inimigo dentro dos limites da tela.
        enemy.x = Math.max(10, Math.min(window.innerWidth - 10, enemy.x));
        enemy.y = Math.max(10, Math.min(window.innerHeight - 10, enemy.y));

        // Lógica de Colisão com o Jogador
        const distToPlayer = Math.sqrt(distSq);
        if (distToPlayer < (player.size + enemy.size) * 0.6) {
            const damage = (config.enemySystem.types[enemy.type].damage || 5) * (deltaTime / 16.67);
            player.health -= damage;
        }

        remainingEnemies.push(enemy);
    });

    return { xpFromDefeatedEnemies, newEnemies: remainingEnemies, newParticles: particlesFromExplosions, newProjectiles };
}
