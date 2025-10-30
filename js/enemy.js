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
export function updateEnemies(enemies, player) {
  enemies.forEach(enemy => {
    // 🔹 Calcula a direção para o jogador
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 0.001; // evita divisão por 0

    // 🔹 Define velocidade de movimento (seguindo o jogador)
    enemy.speedX = (dx / dist) * enemy.baseSpeed;
    enemy.speedY = (dy / dist) * enemy.baseSpeed;

    // 🔹 Atualiza posição
    enemy.x += enemy.speedX;
    enemy.y += enemy.speedY;

    // 🔹 Limita velocidade mínima (evita congelamento)
    const minSpeed = 0.05;
    if (Math.abs(enemy.speedX) < minSpeed) enemy.speedX = 0;
    if (Math.abs(enemy.speedY) < minSpeed) enemy.speedY = 0;

    // 🔹 Detecta colisão com jogador
    const distPlayer = Math.sqrt((player.x - enemy.x) ** 2 + (player.y - enemy.y) ** 2);
    if (distPlayer < enemy.radius + player.radius) {
      if (player.health > 0) {
        player.health -= enemy.damage;
      }
    }
  });
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
