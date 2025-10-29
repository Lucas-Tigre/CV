import { createProjectile } from './projectile.js';
// ======================
// SISTEMA DE INIMIGOS v2.0
// ======================

// 🔹 Função utilitária para gerar números aleatórios de forma simples
function rand(min = 0, max = 1) {
  return Math.random() * (max - min) + min;
}

// ======================
// GERAR INIMIGOS
// ======================
export function spawnEnemy(typeKey, config, player, canvas) {
  const type = config.enemySystem.types[typeKey];
  if (!type) return null; // segurança extra

  const screenWidth = canvas.width;
  const screenHeight = canvas.height;

  const waveNumber = config.wave?.number ?? 1;
  let health = type.health || (config.enemySystem.baseHealth + (waveNumber * config.enemySystem.healthIncreasePerLevel));
  let damage = type.damage || config.enemySystem.baseDamage;
  let baseSpeed = type.speed || config.enemySystem.baseSpeed;
  const isElite = typeKey === 'boss' || typeKey === 'finalBoss' || Math.random() < 0.02;

  if (isElite) {
    health *= 1.5;
    damage *= 1.3;
    baseSpeed *= 1.1;
  }

  const side = Math.floor(rand(0, 4));
  let x, y;
  if (side === 0) { x = -50; y = rand(0, canvas.height); }
  else if (side === 1) { x = canvas.width + 50; y = rand(0, canvas.height); }
  else if (side === 2) { x = rand(0, canvas.width); y = -50; }
  else { x = rand(0, canvas.width); y = canvas.height + 50; }

  const enemy = {
    x, y, baseSpeed, speedX: 0, speedY: 0, health, maxHealth: health, damage,
    size: type.size || config.enemySystem.baseSize,
    radius: type.size || config.enemySystem.baseSize,
    color: isElite ? 'gold' : type.color || 'red',
    face: Array.isArray(type.face) ? type.face[Math.floor(Math.random() * type.face.length)] : type.face,
    isElite,
    typeKey,
    shootCooldownTimer: type.shootCooldown || 0,
    collisionTimer: 0 // Novo: Timer para o cooldown de dano de colisão
  };

  // Define a velocidade inicial para inimigos que atravessam a tela
  if (type.behavior === 'crossScreen') {
    const targetX = rand(0, canvas.width);
    const targetY = rand(0, canvas.height);
    const dx = targetX - enemy.x;
    const dy = targetY - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    enemy.speedX = (dx / dist) * enemy.baseSpeed;
    enemy.speedY = (dy / dist) * enemy.baseSpeed;
  }

  return enemy;
}

// ======================
// ATUALIZAÇÃO DOS INIMIGOS
// ======================
export function updateEnemies(enemies, player, deltaTime, existingProjectiles, config, canvas) {
    const newEnemies = [];
    const newlyCreatedParticles = [];
    const newProjectiles = [...existingProjectiles];
    let xpFromDefeatedEnemies = 0;

    for (const enemy of enemies) {
        let isAlive = true;
        const typeConfig = config.enemySystem.types[enemy.typeKey];

        // Novo: Decrementa o timer de cooldown de colisão do inimigo
        if (enemy.collisionTimer > 0) {
            enemy.collisionTimer--;
        }

        // Lógica de movimento baseada no comportamento
        if (typeConfig.behavior === 'crossScreen') {
            enemy.x += enemy.speedX;
            enemy.y += enemy.speedY;
            if (enemy.x < -100 || enemy.x > canvas.width + 100 || enemy.y < -100 || enemy.y > canvas.height + 100) {
                isAlive = false;
            }
        } else if (typeConfig.behavior !== 'static') {
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;

            // Por padrão, o inimigo se move em direção ao jogador.
            let moveX = (dx / dist) * enemy.baseSpeed;
            let moveY = (dy / dist) * enemy.baseSpeed;

            // Se o inimigo (como o "Hunter") tem uma distância preferencial e está muito perto, ele para.
            if (typeConfig.preferredDistance && dist < typeConfig.preferredDistance) {
                moveX = 0;
                moveY = 0;
            }

            enemy.speedX = moveX;
            enemy.speedY = moveY;
            enemy.x += enemy.speedX;
            enemy.y += enemy.speedY;
        }

        // Lógica de disparo
        if (enemy.shootCooldownTimer > 0) {
            enemy.shootCooldownTimer--;
        }
        if (typeConfig.shootCooldown && enemy.shootCooldownTimer <= 0) {
            newProjectiles.push(createProjectile(enemy.x, enemy.y, player.x, player.y, typeConfig.projectileType));
            enemy.shootCooldownTimer = typeConfig.shootCooldown;
        }

        // Lógica de dano do jogador (vórtice, etc.)
        if ((player.mode === 'attract' || player.mode === 'vortex') && !typeConfig.ignoresAttraction) {
            const distFromPlayer = Math.sqrt((player.x - enemy.x) ** 2 + (player.y - enemy.y) ** 2);
            if (distFromPlayer < player.radius) {
                const damagePerSecond = player.attractionDamage || 10;
                const damageThisFrame = damagePerSecond * (deltaTime / 1000);
                enemy.health -= damageThisFrame;
            }
        }

        // Lógica de colisão com o jogador
        const distPlayer = Math.sqrt((player.x - enemy.x) ** 2 + (player.y - enemy.y) ** 2);
        if (distPlayer < enemy.radius + player.size) {
            // Se o jogador não estiver invencível, ele sofre dano e fica invencível.
            if (player.invincibleTimer <= 0) {
                player.health -= enemy.damage;
                player.invincibleTimer = player.invincibilityCooldown; // Ativa a invencibilidade.
            }

            // O inimigo só sofre dano de colisão se a configuração dele permitir E se não estiver em cooldown.
            if (!typeConfig.ignoresCollision && enemy.collisionTimer <= 0) {
                enemy.health -= player.collisionDamage;
                enemy.collisionTimer = config.enemySystem.collisionCooldown; // Reinicia o cooldown
            }
        }

        // REDE DE SEGURANÇA: Remove inimigos que saem muito da tela, independente do tipo.
        // Isso previne que inimigos perdidos bloqueiem o avanço das ondas.
        const safetyMargin = 200;
        if (enemy.x < -safetyMargin || enemy.x > canvas.width + safetyMargin || enemy.y < -safetyMargin || enemy.y > canvas.height + safetyMargin) {
            isAlive = false;
        }

        // Verifica se o inimigo foi derrotado
        if (enemy.health <= 0) {
            isAlive = false;
            xpFromDefeatedEnemies += enemy.maxHealth / 4;
            // Chance de dropar item de vida
            if (Math.random() < 0.15) {
                newlyCreatedParticles.push({
                    x: enemy.x, y: enemy.y, size: 7, color: 'lightgreen',
                    type: 'health', isAttracted: false,
                    speedX: rand(-1, 1), speedY: rand(-1, 1),
                    trail: []
                });
            }
        }

        if (isAlive) {
            newEnemies.push(enemy);
        }
    }

    return { newEnemies, newlyCreatedParticles, newProjectiles, xpFromDefeatedEnemies };
}

// ======================
// DESENHAR INIMIGOS NA TELA
// ======================
export function drawEnemies(ctx, enemies) {
  enemies.forEach(enemy => {
    ctx.beginPath();
    ctx.fillStyle = enemy.color;
    ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();

    if (enemy.face) {
        ctx.font = `${enemy.radius * 1.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(enemy.face, enemy.x, enemy.y);
    }

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
export function spawnRandomEnemy(config, player, canvas) {
  const enemyTypes = Object.keys(config.enemySystem.types);
  const totalChance = enemyTypes.reduce(
    (sum, key) => sum + (config.enemySystem.types[key].chance || 0),
    0
  );

  let random = Math.random() * totalChance;
  for (const key of enemyTypes) {
    const chance = config.enemySystem.types[key].chance || 0;
    if (random < chance) {
      return spawnEnemy(key, config, player, canvas);
    }
    random -= chance;
  }
  return spawnEnemy(enemyTypes[0], config, player, canvas);
}
