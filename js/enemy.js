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
    typeKey,
    collisionTimer: 0 // Inicializa o timer de colisão
  };

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
        // aplica dano contínuo.
        if (player.mode === 'attract' && dist < player.radius && !type.ignoresAttraction) {
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
                if (dist < (type.shootDistance || 200)) {
                    enemy.speedX = -(dx / dist) * enemy.baseSpeed * 0.7;
                    enemy.speedY = -(dy / dist) * enemy.baseSpeed * 0.7;
                } else {
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
                        damage: enemy.damage * 0.8,
                        owner: 'enemy'
                    });
                    enemy.shootCooldown = type.shootCooldown || 2000;
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

        const margin = 200;
        if (canvas && (enemy.x < -margin || enemy.x > canvas.width + margin || enemy.y < -margin || enemy.y > canvas.height + margin)) {
            return false;
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
