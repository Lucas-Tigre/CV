import { createProjectile } from './projectile.js';
// ======================
// SISTEMA DE INIMIGOS v2.0
// ======================

// ✅ Pega dimensões da tela com segurança (sem travar fora do navegador)
const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 800;
const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 600;

// 🔹 Função utilitária para gerar números aleatórios de forma simples
function rand(min = 0, max = 1) {
  return Math.random() * (max - min) + min;
}

// ======================
// GERAR INIMIGOS
// ======================
export function spawnEnemy(typeKey, config, player) {
  const type = config.enemySystem.types[typeKey];
  if (!type) return null; // segurança extra

  // 🔹 Define o número da wave, mesmo que ainda não exista
  const waveNumber = config.wave?.number ?? 1;

  // 🔹 Define a vida base do inimigo
  let health = type.health || (config.enemySystem.baseHealth + (waveNumber * config.enemySystem.healthIncreasePerLevel));

  // 🔹 Define dano base (CORRIGIDO)
  let damage = type.damage || (config.enemySystem.baseDamage || 5);
  damage += waveNumber * (config.enemySystem.damageIncreasePerLevel || 0.5);


  // 🔹 Define velocidade
  let baseSpeed = type.speed || config.enemySystem.baseSpeed;

  // 🔹 Define se é inimigo “elite”
  const isElite = typeKey === 'boss' || typeKey === 'finalBoss' || Math.random() < 0.02;

  if (isElite) {
    health *= 1.5; // elites têm mais vida
    damage *= 1.3; // e causam mais dano
    baseSpeed *= 1.1;
  }

  // 🔹 Posição aleatória fora da tela, usando a margem configurável.
  const margin = config.enemySystem.spawnMargin || 50; // Usa 50 como fallback.
  const side = Math.floor(rand(0, 4)); // 0: esquerda, 1: direita, 2: cima, 3: baixo
  let x, y;

  if (side === 0) { // esquerda
    x = -margin;
    y = rand(0, screenHeight);
  } else if (side === 1) { // direita
    x = screenWidth + margin;
    y = rand(0, screenHeight);
  } else if (side === 2) { // cima
    x = rand(0, screenWidth);
    y = -margin;
  } else { // baixo
    x = rand(0, screenWidth);
    y = screenHeight + margin;
  }

  // 🔹 Cria o inimigo com todas as propriedades iniciais
  const enemy = {
    x,
    y,
    face: Array.isArray(type.face) ? type.face[Math.floor(Math.random() * type.face.length)] : type.face,
    baseSpeed,
    speedX: 0,
    speedY: 0,
    health,
    maxHealth: health,
    damage,
    radius: type.radius || 15,
    color: isElite ? 'gold' : type.color || 'red',
    isElite,
    typeKey,
    collisionTimer: 0 // Inicializa o timer de colisão
  };

  // LÓGICA DE MOVIMENTO PARA O INIMIGO "CÓSMICO"
  // Define uma velocidade inicial para que ele atravesse a tela.
  if (typeKey === 'cosmic') {
    // Define um alvo no lado oposto da tela
    let targetX, targetY;
    if (side === 0) { // Nasceu na esquerda, alvo na direita
        targetX = screenWidth + margin;
        targetY = rand(0, screenHeight);
    } else if (side === 1) { // Nasceu na direita, alvo na esquerda
        targetX = -margin;
        targetY = rand(0, screenHeight);
    } else if (side === 2) { // Nasceu em cima, alvo embaixo
        targetX = rand(0, screenWidth);
        targetY = screenHeight + margin;
    } else { // Nasceu embaixo, alvo em cima
        targetX = rand(0, screenWidth);
        targetY = -margin;
    }

    const dx = targetX - enemy.x;
    const dy = targetY - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    enemy.speedX = (dx / dist) * enemy.baseSpeed;
    enemy.speedY = (dy / dist) * enemy.baseSpeed;
  }

  return enemy;
}

// ======================
// ATUALIZAÇÃO DOS INIMIGOS
// ======================
export function updateEnemies(enemies, player, config, canvas, bigBangActive) {
    const newProjectiles = [];
    const newExplosions = [];
    const healingParticles = [];
    let damageToPlayer = 0;
    let xpGained = 0;
    let bigBangChargeGained = 0;
    let enemiesDefeated = 0;

    const updatedEnemies = enemies.filter(enemy => {
        if (enemy.collisionTimer > 0) enemy.collisionTimer -= 16.67;
        if (enemy.shootCooldown > 0) enemy.shootCooldown -= 16.67;

        const type = config.enemySystem.types[enemy.typeKey] || {};
        const behavior = type.behavior || 'hunter';

        if (bigBangActive && !type.isBoss) {
            enemy.health = 0;
        }

        if (enemy.health <= 0) {
            newExplosions.push({
                x: enemy.x,
                y: enemy.y,
                radius: enemy.radius * 2,
                color: enemy.color,
                duration: 30
            });

            xpGained += type.xpValue || 10;
            bigBangChargeGained += config.bigBangChargeRate || 1;
            enemiesDefeated++;

            if (Math.random() < (config.healingParticle?.dropChance || 0.1)) {
                healingParticles.push({
                    x: enemy.x,
                    y: enemy.y,
                    size: 7,
                    color: 'lightgreen',
                    isHealing: true,
                    speedX: (Math.random() - 0.5) * 2,
                    speedY: (Math.random() - 0.5) * 2,
                    healingAmount: config.healingParticle.amount,
                    trail: []
                });
            }

            return false;
        }

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        // APLICA DANO DE ATRAÇÃO (VÓRTICE)
        // Se o jogador estiver no modo 'attract' e o inimigo estiver dentro do raio,
        // aplica dano contínuo, a menos que seja o "Cósmico".
        if (player.mode === 'attract' && dist < player.radius && enemy.typeKey !== 'cosmic') {
            // O dano é aplicado por segundo, então dividimos por 60 para aplicar por frame.
            const damagePerFrame = player.attractionDamage / 60;
            enemy.health -= damagePerFrame;
        }

        switch (behavior) {
            case 'hunter':
                if (dist > (type.preferredDistance || 100)) {
                    enemy.speedX = (dx / dist) * enemy.baseSpeed;
                    enemy.speedY = (dy / dist) * enemy.baseSpeed;
                } else {
                    enemy.speedX *= 0.9;
                    enemy.speedY *= 0.9;
                }
                break;
            case 'shooter':
                // O 'shooter' agora é estacionário e apenas atira.
                enemy.speedX = 0;
                enemy.speedY = 0;

                // Lógica de tiro em linha reta.
                if (!enemy.shootCooldown || enemy.shootCooldown <= 0) {
                    // Atira apenas se o jogador estiver dentro do alcance.
                    if (dist < (type.shootDistance || 400)) {
                         newProjectiles.push(
                           createProjectile(
                             enemy.x,
                             enemy.y,
                             player.x,
                             player.y,
                             'explosive'
                           )
                         );
                        enemy.shootCooldown = type.shootCooldown || 2000;
                    }
                }
                break;
            case 'stationary':
                enemy.speedX = 0;
                enemy.speedY = 0;
                break;
            case 'crossScreen':
                break;
            default:
                enemy.speedX = (dx / dist) * enemy.baseSpeed;
                enemy.speedY = (dy / dist) * enemy.baseSpeed;
                break;
        }

        enemy.x += enemy.speedX;
        enemy.y += enemy.speedY;

        const distPlayer = Math.sqrt(Math.pow(player.x - enemy.x, 2) + Math.pow(player.y - enemy.y, 2));
        if (distPlayer < enemy.radius + player.size && !type.ignoresCollision) {
            if (player.invincibleTimer <= 0) {
                // CORREÇÃO: Garante que o dano do inimigo é sempre um número válido antes de ser aplicado.
                // Isso previne a corrupção do estado de vida do jogador para NaN.
                const enemyDamage = enemy.damage;
                const baseDamage = config.enemySystem.baseDamage || 1; // Fallback para o dano base ou 1.
                const damageToApply = (typeof enemyDamage === 'number' && !isNaN(enemyDamage)) ? enemyDamage : baseDamage;
                damageToPlayer += damageToApply;
            }
            if (enemy.collisionTimer <= 0) {
                enemy.health -= player.collisionDamage;
                enemy.collisionTimer = config.enemySystem.collisionCooldown;
            }
        }

        // SISTEMA DE CONTENÇÃO E REMOÇÃO DE INIMIGOS
        // O padrão é "quicar" nas bordas, mas o "Cósmico" é uma exceção.
        if (enemy.typeKey === 'cosmic') {
            // REGRA ESPECIAL PARA O "CÓSMICO": É removido ao sair da tela.
            const margin = (config.enemySystem.spawnMargin || 50) + 10;
            if (enemy.x < -margin || enemy.x > canvas.width + margin || enemy.y < -margin || enemy.y > canvas.height + margin) {
                return false; // Deleta o inimigo.
            }
        } else {
            // REGRA PADRÃO: Quica nas bordas para permanecer na área de jogo.
            const bounceDamping = 0.8;
            if (canvas) {
                if (enemy.x - enemy.radius < 0 && enemy.speedX < 0) {
                    enemy.speedX *= -bounceDamping;
                }
                if (enemy.x + enemy.radius > canvas.width && enemy.speedX > 0) {
                    enemy.speedX *= -bounceDamping;
                }
                if (enemy.y - enemy.radius < 0 && enemy.speedY < 0) {
                    enemy.speedY *= -bounceDamping;
                }
                if (enemy.y + enemy.radius > canvas.height && enemy.speedY > 0) {
                    enemy.speedY *= -bounceDamping;
                }
            }
        }

        return true;
    });

    return {
        updatedEnemies,
        newProjectiles,
        newExplosions,
        damageToPlayer,
        xpGained,
        bigBangChargeGained,
        enemiesDefeated,
        healingParticles,
        newEnemies: []
    };
}

// ======================
// DESENHAR INIMIGOS NA TELA
// ======================
export function drawEnemies(ctx, enemies) {
  enemies.forEach(enemy => {
    // 🔹 Corpo do inimigo
    ctx.beginPath();
    ctx.fillStyle = enemy.color;
    ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();

    // 🔹 "Face" do inimigo (emoji)
    if (enemy.face) {
        ctx.font = `${enemy.radius * 1.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(enemy.face, enemy.x, enemy.y);
    }

    // 🔹 Barra de vida
    const healthPercentage = Math.max(0, enemy.health / enemy.maxHealth);
    const barWidth = enemy.radius * 2;
    const barHeight = 4;
    const barX = enemy.x - enemy.radius;
    const barY = enemy.y - enemy.radius - 10;

    ctx.fillStyle = 'red';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = 'lime';
    ctx.fillRect(barX, barY, barWidth * healthPercentage, barHeight);
  });
}

// ======================
// GERADOR DE INIMIGOS ALEATÓRIOS
// ======================
export function spawnRandomEnemy(config, player) {
  const enemyTypes = Object.keys(config.enemySystem.types);
  const totalChance = enemyTypes.reduce(
    (sum, key) => sum + (config.enemySystem.types[key].chance || 0),
    0
  );

  let random = Math.random() * totalChance;
  for (const key of enemyTypes) {
    const chance = config.enemySystem.types[key].chance || 0;
    if (random < chance) {
      return spawnEnemy(key, config, player);
    }
    random -= chance;
  }

  // fallback de segurança
  return spawnEnemy(enemyTypes[0], config, player);
}
