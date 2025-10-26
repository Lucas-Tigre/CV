import { config } from './config.js';
import * as particle from './particle.js';
import * as projectile from './projectile.js';

/**
 * Gera um novo inimigo e o adiciona ao array de inimigos.
 * @param {Array} currentEnemies - O array atual de inimigos.
 * @param {string|null} typeKey - O tipo específico de inimigo a ser gerado. Se nulo, um inimigo aleatório é gerado.
 * @returns {Array} O novo array de inimigos com o novo inimigo adicionado.
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

        // Lógica de surgimento para inimigos que cruzam a tela.
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

        // Atribui propriedades específicas com base no tipo de inimigo.
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
 * @param {Array} particles - O array de partículas (usado para explosões de chefe).
 * @param {Array} projectiles - O array de projéteis.
 * @returns {object} Um objeto contendo o XP ganho e os novos arrays de entidades.
 */
export function updateEnemies(enemies, player, deltaTime, projectiles) {
    let xpFromDefeatedEnemies = 0;
    let newlyCreatedParticles = [];
    let newProjectiles = [...projectiles];

    const remainingEnemies = enemies.filter(enemy => {
        // Primeiro, aplique a lógica de dano para ver se o inimigo sobrevive.
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distSq = dx * dx + dy * dy;
        const enemyType = config.enemySystem.types[enemy.type];
        const effectiveRadius = player.isPoweredUp ? player.radius * 1.5 : player.radius;

        if (player.mode === 'attract' && distSq < effectiveRadius * effectiveRadius && !enemyType.ignoresAttraction) {
            const damage = player.isPoweredUp ? player.attractionDamage * 3 : player.attractionDamage;
            enemy.health -= damage;
        }

        // Se o inimigo foi derrotado por dano neste frame, processe a morte e o remova.
        if (enemy.health <= 0) {
            xpFromDefeatedEnemies += enemy.isElite ? 10 : 3;
            config.enemiesDestroyed++;
            config.bigBangCharge = Math.min(100, config.bigBangCharge + config.bigBangChargeRate);
            if (Math.random() < 0.05) { // 5% de chance de dropar cura.
                newlyCreatedParticles.push(particle.createHealParticle(enemy.x, enemy.y));
            }
            return false; // Remove o inimigo da lista para o próximo frame.
        }

        // Se o inimigo sobreviveu, aplique a lógica de movimento, ataque e colisão.
        if (enemy.attackCooldown !== undefined) {
            enemy.attackCooldown--;
            if (enemy.attackCooldown <= 0) {
                newlyCreatedParticles.push(...particle.createParticleExplosion(enemy.x, enemy.y, []));
                enemy.attackCooldown = Math.random() * 120 + 180;
            }
        }

        // Lógica de movimento e ataque
        if (player.mode === 'attract' && distSq < effectiveRadius * effectiveRadius && !enemyType.ignoresAttraction) {
             const dist = Math.sqrt(distSq);
             const damping = (enemy.type === 'boss' || enemy.type === 'finalBoss') ? 0.98 : 0.9;
             enemy.speedX *= damping;
             enemy.speedY *= damping;

             const radialForce = 0.5;
             const tangentialForce = 0.25;
             const radial_nx = dx / dist;
             const radial_ny = dy / dist;
             const tangential_nx = -radial_ny;
             const tangential_ny = radial_nx;

             const forceMagnitude = (1 - dist / effectiveRadius);
             enemy.speedX += (radial_nx * radialForce + tangential_nx * tangentialForce) * forceMagnitude;
             enemy.speedY += (radial_ny * radialForce + tangential_ny * tangentialForce) * forceMagnitude;
        } else {
            switch (enemy.behavior) {
                case 'huntAndShoot': {
                    const dist = Math.sqrt(distSq);
                    if (dist > enemy.preferredDistance) {
                        enemy.speedX = (dx / dist) * enemy.baseSpeed;
                        enemy.speedY = (dy / dist) * enemy.baseSpeed;
                    } else if (dist < enemy.preferredDistance * 0.8) {
                        enemy.speedX = -(dx / dist) * enemy.baseSpeed;
                        enemy.speedY = -(dy / dist) * enemy.baseSpeed;
                    } else {
                        enemy.speedX *= 0.8;
                        enemy.speedY *= 0.8;
                    }
                    if (enemy.shootCooldown) {
                        enemy.shootCooldown--;
                        if (enemy.shootCooldown <= 0) {
                            newProjectiles.push(projectile.createProjectile(enemy.x, enemy.y, player.x, player.y, enemy.projectileType));
                            enemy.shootCooldown = config.enemySystem.types[enemy.type].shootCooldown;
                        }
                    }
                    break;
                }
                case 'static': {
                    enemy.speedX *= 0.8;
                    enemy.speedY *= 0.8;
                    if (enemy.shootCooldown) {
                        enemy.shootCooldown--;
                        if (enemy.shootCooldown <= 0) {
                            newProjectiles.push(projectile.createProjectile(enemy.x, enemy.y, player.x, player.y, enemy.projectileType));
                            enemy.shootCooldown = config.enemySystem.types[enemy.type].shootCooldown;
                        }
                    }
                    break;
                }
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
                    break; // A velocidade já foi definida no spawn.
                default:
                    enemy.speedX += (Math.random() - 0.5) * 0.5;
                    enemy.speedY += (Math.random() - 0.5) * 0.5;
                    enemy.speedX *= 0.95;
                    enemy.speedY *= 0.95;
            }
        }

        enemy.x += enemy.speedX * (deltaTime / 16.67);
        enemy.y += enemy.speedY * (deltaTime / 16.67);

        // Lógica de colisão com o jogador
        const distToPlayer = Math.sqrt(distSq);
        if (distToPlayer < (player.size + enemy.size) * 0.6) {
            const damage = (config.enemySystem.types[enemy.type].damage || 5) * (deltaTime / 16.67);
            player.health -= damage;
        }

        // Verifica se o inimigo deve ser removido por sair da tela.
        if (enemy.behavior === 'crossScreen') {
            const padding = 200;
            if (enemy.x < -padding || enemy.x > window.innerWidth + padding || enemy.y < -padding || enemy.y > window.innerHeight + padding) {
                return false; // Remove o inimigo.
            }
        }

        // Mantém o inimigo dentro da tela se não for do tipo 'crossScreen'.
        if (enemy.behavior !== 'crossScreen') {
            enemy.x = Math.max(10, Math.min(window.innerWidth - 10, enemy.x));
            enemy.y = Math.max(10, Math.min(window.innerHeight - 10, enemy.y));
        }

        return true; // Mantém o inimigo vivo para o próximo frame.
    });

    return { xpFromDefeatedEnemies, newEnemies: remainingEnemies, newlyCreatedParticles, newProjectiles };
}

/**
 * Renderiza todos os inimigos no canvas.
 * @param {CanvasRenderingContext2D} ctx - O contexto do canvas.
 * @param {Array} enemies - O array de inimigos a ser renderizado.
 */
export function renderEnemies(ctx, enemies) {
    enemies.forEach(enemy => {
        // Desenha o corpo do inimigo.
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
        ctx.fill();

        // Desenha a "cara" do inimigo (emoji).
        ctx.font = `${enemy.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(enemy.face, enemy.x, enemy.y);

        // Desenha a barra de vida se a vida não estiver no máximo.
        if (enemy.health < enemy.maxHealth) {
            const healthBarWidth = enemy.size * 1.5;
            const healthBarHeight = 5;
            const healthBarX = enemy.x - healthBarWidth / 2;
            const healthBarY = enemy.y - enemy.size - 10;

            // Fundo da barra de vida.
            ctx.fillStyle = '#333';
            ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);

            // Vida atual.
            const healthPercentage = enemy.health / enemy.maxHealth;
            ctx.fillStyle = 'red';
            ctx.fillRect(healthBarX, healthBarY, healthBarWidth * healthPercentage, healthBarHeight);
        }
    });
}
