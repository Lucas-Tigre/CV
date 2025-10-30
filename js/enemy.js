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

  // 🔹 Define dano base
  let damage = type.damage || (config.enemySystem.baseDamage + (waveNumber * config.enemySystem.damageIncreasePerLevel));

  // 🔹 Define velocidade
  let baseSpeed = type.speed || config.enemySystem.baseSpeed;

  // 🔹 Define se é inimigo “elite”
  const isElite = typeKey === 'boss' || typeKey === 'finalBoss' || Math.random() < 0.02;

  if (isElite) {
    health *= 1.5; // elites têm mais vida
    damage *= 1.3; // e causam mais dano
    baseSpeed *= 1.1;
  }

  // 🔹 Posição aleatória fora da tela (pra parecer que vem “de longe”)
  const side = Math.floor(rand(0, 4)); // 0: esquerda, 1: direita, 2: cima, 3: baixo
  let x, y;

  if (side === 0) { // esquerda
    x = -50;
    y = rand(0, screenHeight);
  } else if (side === 1) { // direita
    x = screenWidth + 50;
    y = rand(0, screenHeight);
  } else if (side === 2) { // cima
    x = rand(0, screenWidth);
    y = -50;
  } else { // baixo
    x = rand(0, screenWidth);
    y = screenHeight + 50;
  }

  // 🔹 Cria o inimigo com todas as propriedades iniciais
  const enemy = {
    x,
    y,
    baseSpeed,
    speedX: 0,
    speedY: 0,
    health,
    maxHealth: health,
    damage,
    radius: type.radius || 15,
    color: isElite ? 'gold' : type.color || 'red',
    isElite,
    typeKey
  };

  return enemy;
}

// ======================
// ATUALIZAÇÃO DOS INIMIGOS
// ======================
export function updateEnemies(enemies, player, config, canvas, bigBangActive) {
    const newProjectiles = [];
    const newExplosions = [];

    // Usar filter para criar a nova lista de inimigos, removendo os que morreram ou saíram da tela
    const updatedEnemies = enemies.filter(enemy => {
        // Decrementa timers
        if (enemy.collisionTimer > 0) enemy.collisionTimer -= 16.67; // Aproximado para 60 FPS
        if (enemy.shootCooldown > 0) enemy.shootCooldown -= 16.67;

        // Lógica de movimento baseada no comportamento
        const type = config.enemySystem.types[enemy.typeKey] || {};
        const behavior = type.behavior || 'hunter';

        // Lógica de dano e morte pelo Big Bang
        if (bigBangActive && !type.isBoss) {
            enemy.health = 0; // Inimigos normais morrem instantaneamente
        }

        if (enemy.health <= 0) {
            // Se o inimigo morreu, cria uma explosão e não o inclui na nova lista
            newExplosions.push({
                x: enemy.x,
                y: enemy.y,
                radius: enemy.radius * 2,
                color: enemy.color,
                duration: 1000
            });
            // Adiciona XP ao jogador pela morte do inimigo
            if (player) {
                player.xp += type.xpValue || 10;
            }
            return false; // Remove o inimigo
        }

        // Lógica de movimento
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        switch (behavior) {
            case 'hunter':
                // Para a uma certa distância do jogador
                if (dist > (type.preferredDistance || 100)) {
                    enemy.speedX = (dx / dist) * enemy.baseSpeed;
                    enemy.speedY = (dy / dist) * enemy.baseSpeed;
                } else {
                    enemy.speedX *= 0.9; // Desacelera perto do jogador
                    enemy.speedY *= 0.9;
                }
                break;
            case 'shooter':
                // Tenta manter distância e atira
                if (dist < (type.shootDistance || 200)) { // se muito perto, afasta
                    enemy.speedX = -(dx / dist) * enemy.baseSpeed * 0.7;
                    enemy.speedY = -(dy / dist) * enemy.baseSpeed * 0.7;
                } else { // se longe, aproxima
                    enemy.speedX = (dx / dist) * enemy.baseSpeed * 0.5;
                    enemy.speedY = (dy / dist) * enemy.baseSpeed * 0.5;
                }
                if (!enemy.shootCooldown || enemy.shootCooldown <= 0) {
                    newProjectiles.push({
                        x: enemy.x,
                        y: enemy.y,
                        speedX: (dx / dist) * config.projectile.speed,
                        speedY: (dy / dist) * config.projectile.speed,
                        radius: config.projectile.radius,
                        color: config.projectile.color,
                        damage: enemy.damage * 0.8, // Dano do projétil
                        owner: 'enemy'
                    });
                    enemy.shootCooldown = type.shootCooldown || 2000; // Recarga
                }
                break;
            case 'stationary':
                // Fica parado
                enemy.speedX = 0;
                enemy.speedY = 0;
                break;
            case 'crossScreen':
                // Atravessa a tela - a velocidade inicial é mantida
                break;
            default:
                // Comportamento padrão: Perseguir
                enemy.speedX = (dx / dist) * enemy.baseSpeed;
                enemy.speedY = (dy / dist) * enemy.baseSpeed;
                break;
        }

        enemy.x += enemy.speedX;
        enemy.y += enemy.speedY;

        // Lógica de colisão com o jogador
        const distPlayer = Math.sqrt(Math.pow(player.x - enemy.x, 2) + Math.pow(player.y - enemy.y, 2));
        if (distPlayer < enemy.radius + player.radius && !type.ignoresCollision) {
            // Dano no jogador
            if (player.invincibilityTimer <= 0) {
                player.health -= enemy.damage * config.player.collisionDamageModifier;
                player.invincibilityTimer = config.player.invincibilityDuration;
            }
            // Dano no inimigo
            if (enemy.collisionTimer <= 0) {
                enemy.health -= player.collisionDamage;
                enemy.collisionTimer = config.enemySystem.collisionInvincibilityDuration;
            }
        }

        // "Rede de segurança" para remover inimigos que saem da tela
        const margin = 200;
        if (canvas && (enemy.x < -margin || enemy.x > canvas.width + margin || enemy.y < -margin || enemy.y > canvas.height + margin)) {
            return false; // Remove o inimigo
        }

        return true; // Mantém o inimigo na lista
    });

    // Ponto de retorno ÚNICO e ESTRUTURADO
    return {
        updatedEnemies,
        newProjectiles,
        newExplosions,
        newEnemies: [] // Novos inimigos são gerados pela função updateWave em game.js
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
