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
  if (side === 0) { x = -50; y = rand(0, screenHeight); }
  else if (side === 1) { x = screenWidth + 50; y = rand(0, screenHeight); }
  else if (side === 2) { x = rand(0, screenWidth); y = -50; }
  else { x = rand(0, screenWidth); y = screenHeight + 50; }

  const enemy = {
    x, y, baseSpeed, speedX: 0, speedY: 0, health, maxHealth: health, damage,
    size: type.size || config.enemySystem.baseSize,
    radius: type.size || config.enemySystem.baseSize,
    color: isElite ? 'gold' : type.color || 'red',
    face: Array.isArray(type.face) ? type.face[Math.floor(Math.random() * type.face.length)] : type.face,
    isElite,
    typeKey
  };

  return enemy;
}

// ======================
// ATUALIZAÇÃO DOS INIMIGOS
// ======================
export function updateEnemies(enemies, player, deltaTime, existingProjectiles) {
    const newEnemies = [];
    const newlyCreatedParticles = [];
    const newProjectiles = [...existingProjectiles];
    let xpFromDefeatedEnemies = 0;

    for (const enemy of enemies) {
        let isAlive = true;

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
        enemy.speedX = (dx / dist) * enemy.baseSpeed;
        enemy.speedY = (dy / dist) * enemy.baseSpeed;
        enemy.x += enemy.speedX;
        enemy.y += enemy.speedY;

        if (player.mode === 'attract' || player.mode === 'vortex') {
            const distFromPlayer = Math.sqrt((player.x - enemy.x) ** 2 + (player.y - enemy.y) ** 2);
            if (distFromPlayer < player.radius) {
                const damagePerSecond = player.attractionDamage || 10;
                const damageThisFrame = damagePerSecond * (deltaTime / 1000);
                enemy.health -= damageThisFrame;
            }
        }

        const distPlayer = Math.sqrt((player.x - enemy.x) ** 2 + (player.y - enemy.y) ** 2);
        if (distPlayer < enemy.radius + player.size) {
            if (player.health > 0) {
                player.health -= enemy.damage;
            }
            enemy.health = 0;
        }

        if (enemy.health <= 0) {
            isAlive = false;
            xpFromDefeatedEnemies += enemy.maxHealth / 4;
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
  return spawnEnemy(enemyTypes[0], config, player);
}
