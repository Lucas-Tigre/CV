// =============================================
// IMPORTAÇÕES DOS MÓDULOS
// =============================================
import { config } from './config.js';
import * as state from './state.js';
import * as ui from './ui.js';
import * as particle from './particle.js';
import * as enemy from './enemy.js';
import * as projectile from './projectile.js';
import * as explosion from './explosion.js';
import { checkLevelUp as checkLevelUpLogic, showUnlockMessage, playSound, initSoundSystem, unlockAudio } from './utils.js';
import * as audio from './audio.js';

// Armazena uma cópia da configuração inicial de missões para garantir que o reset seja consistente.
export const initialQuests = JSON.parse(JSON.stringify(config.quests));

// =============================================
// ELEMENTOS DO DOM E CACHE DE ASSETS
// =============================================
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const imageCache = {};

// =============================================
// FUNÇÕES AUXILIARES
// =============================================
function toggleMenu(menuElement, show) {
    const display = show ? 'block' : 'none';
    if (menuElement) {
        menuElement.style.display = display;
    }
    config.gamePaused = show; // Pausa o jogo sempre que um menu é aberto.
}

// =============================================
// LÓGICA PRINCIPAL DO JOGO
// =============================================

/** Ativa uma batalha de chefe, limpando inimigos normais e iniciando a música do chefe. */
function triggerBossFight(level) {
    state.setEnemies([]);
    config.bossFightActive = true;
    showUnlockMessage(`UM CHEFE APARECEU!`);
    const bossType = level === 50 ? 'finalBoss' : 'boss';
    const musicTrack = level === 50 ? 'finalBossTheme' : 'bossBattle';
    audio.playMusic(musicTrack);
    state.setEnemies(enemy.spawnEnemy(state.enemies, bossType));
}

/** Verifica se o jogador tem XP suficiente para subir de nível e lida com a lógica de progressão. */
function checkLevelUp() {
    const levelUpResult = checkLevelUpLogic(
        config.level,
        config.xp,
        state.enemies.length,
        config.bossFightActive
    );

    config.level = levelUpResult.newLevel;
    config.xp = levelUpResult.newXp;

    if (levelUpResult.leveledUp) {
        config.skillPoints += levelUpResult.skillPointsGained;
        showUnlockMessage(levelUpResult.message);
        playSound('levelUp');
    }

    if (levelUpResult.bossToTrigger) {
        triggerBossFight(levelUpResult.bossToTrigger);
    }
}

/** Atualiza o progresso de uma missão ativa com base em uma ação do jogador. */
function updateQuest(questId, amount = 1) {
    const quest = config.quests.active.find(q => q.id === questId);
    if (quest) {
        quest.current += amount;
        if (quest.current >= quest.target) {
            config.xp += quest.reward;
            config.quests.completed.push(quest.id);
            config.quests.active = config.quests.active.filter(q => q.id !== questId);
            showUnlockMessage(`Missão completa! +${quest.reward}XP`);
            checkLevelUp();
        }
        ui.updateQuestUI(config.quests.active);
    }
}

/** Gerencia as ondas de inimigos, iniciando novas ondas quando a anterior é derrotada. */
function updateWave() {
    if (config.bossFightActive) {
        if (state.enemies.length === 0) {
            config.bossFightActive = false;
            showUnlockMessage(`Chefe derrotado!`);
            audio.playMusic('mainTheme');
        }
        return;
    }

    // Se não há inimigos e todos os inimigos da onda já foram gerados, inicia a próxima onda.
    if (state.enemies.length === 0 && config.wave.spawned >= config.wave.enemiesToSpawn) {
        config.wave.number++;
        // Aumenta a dificuldade de forma mais acentuada
        config.wave.enemiesToSpawn = 5 + Math.floor(config.wave.number * 2.5);
        config.wave.spawned = 0;
        config.wave.timer = 0;
        showUnlockMessage(`Onda ${config.wave.number} começando!`);
        updateQuest('wave5', 1);
    }

    // Gera inimigos em intervalos regulares até atingir o total da onda.
    config.wave.timer++;
    if (config.wave.spawned < config.wave.enemiesToSpawn && config.wave.timer > 90) {
        const newEnemies = enemy.spawnEnemy(state.enemies);
        state.setEnemies(newEnemies);
        config.wave.spawned++;
        config.wave.timer = 0;
    }
}

/** Atualiza o painel de estatísticas na interface do usuário. */
function updateStats() {
    const stats = {
        level: config.level,
        xp: config.xp,
        particlesAbsorbed: config.particlesAbsorbed,
        enemies: state.enemies.length,
        wave: config.wave.number
    };
    ui.updateStatsPanel(stats);
}

/** Gerencia o tempo de duração do power-up do jogador. */
function handlePowerUpTimer() {
    const player = config.players[0];
    if (player.isPoweredUp && player.powerUpTimer > 0) {
        player.powerUpTimer--;
        if (player.powerUpTimer <= 0) {
            player.isPoweredUp = false;
        }
    }
}

/** Gera um lote inicial de partículas de forma assíncrona para não travar o jogo. */
function spawnBatch() {
    const player = config.players[0];
    const particlesToSpawn = config.particleCount;
    const batchSize = 25;
    const currentParticles = state.particles;
    for (let i = 0; i < batchSize; i++) {
        if (currentParticles.length < particlesToSpawn) {
            currentParticles.push(particle.getParticle(player));
        } else {
            return;
        }
    }
    state.setParticles(currentParticles);
    if (currentParticles.length < particlesToSpawn) {
        requestAnimationFrame(spawnBatch);
    }
}

/** Reinicia o jogo para o estado inicial, restaurando o progresso e as habilidades. */
export function restartGame() {
    document.getElementById('game-over-screen').style.display = 'none';
    const player = config.players[0];

    // Restaura o estado do jogador para os valores base.
    player.health = player.baseMaxHealth;
    player.isPoweredUp = false;
    player.powerUpTimer = 0;
    player.radius = player.baseRadius;
    player.attractionDamage = player.baseAttractionDamage;
    player.maxHealth = player.baseMaxHealth;
    config.xpMultiplier = config.baseXpMultiplier;

    // Restaura o estado do jogo.
    config.gamePaused = false;
    config.bossFightActive = false;
    state.setParticles([]);
    requestAnimationFrame(spawnBatch);
    state.setEnemies([]);
    state.setProjectiles([]);
    state.setExplosions([]);

    // Restaura as habilidades.
    for (const key in config.skills.tree) {
        config.skills.tree[key].currentLevel = 0;
    }

    // Restaura o progresso de nível, onda e missões.
    Object.assign(config, {
        wave: { number: 1, enemiesToSpawn: 5, spawned: 0, timer: 0 },
        xp: 0,
        level: 1,
        particlesAbsorbed: 0,
        enemiesDestroyed: 0,
        skillPoints: 0
    });
    config.quests = JSON.parse(JSON.stringify(initialQuests));

    // Reinicia a música e o loop do jogo.
    audio.playMusic('mainTheme');
    if (!state.gameLoopRunning) {
        state.setGameLoopRunning(true);
        requestAnimationFrame(gameLoop);
    }
}

/** Aplica o upgrade de uma habilidade se o jogador tiver pontos suficientes. */
function upgradeSkill(key) {
    const skill = config.skills.tree[key];
    const player = config.players[0];

    if (!skill) {
        console.error(`Tentativa de upgrade para habilidade inexistente: ${key}`);
        return;
    }

    if (skill.requires) {
        for (const req of skill.requires) {
            const [reqKey, reqLevel] = req.split(':');
            if (config.skills.tree[reqKey]?.currentLevel < parseInt(reqLevel, 10)) {
                showUnlockMessage(`Requisito não cumprido: ${config.skills.tree[reqKey].name} Nível ${reqLevel}`);
                return;
            }
        }
    }

    if (config.skillPoints < skill.cost) {
        showUnlockMessage("Pontos de habilidade insuficientes!");
        return;
    }
    if (skill.currentLevel >= skill.maxLevel) {
        showUnlockMessage("Nível máximo já alcançado!");
        return;
    }

    config.skillPoints -= skill.cost;
    skill.currentLevel++;
    playSound('levelUp');

    switch (key) {
        case 'healthBoost':
            const healthIncrease = player.baseMaxHealth * 0.10;
            player.maxHealth += healthIncrease;
            player.health += healthIncrease;
            break;
        case 'attractRadius':
            player.radius = player.baseRadius * (1 + 0.20 * skill.currentLevel);
            break;
        case 'vortexPower':
            player.attractionDamage = player.baseAttractionDamage * (1 + 0.30 * skill.currentLevel);
            break;
        case 'particleMastery':
            config.xpMultiplier = config.baseXpMultiplier * (1 + 0.20 * skill.currentLevel);
            break;
    }
}

// =============================================
// RENDERIZAÇÃO
// =============================================
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const player = config.players[0];

    particle.renderParticles(ctx, state.particles);
    enemy.renderEnemies(ctx, state.enemies);
    projectile.renderProjectiles(ctx, state.projectiles);
    explosion.renderExplosions(ctx, state.explosions);

    // Renderiza a aura de dano do jogador quando o modo de atração está ativo.
    if (player.mode === 'attract') {
        const effectiveRadius = player.isPoweredUp ? player.radius * 1.5 : player.radius;
        const auraColor = player.isPoweredUp ? '255, 215, 0' : '142, 45, 226';
        const opacity = 1 - (state.auraPulseRadius / effectiveRadius);
        ctx.strokeStyle = `rgba(${auraColor}, ${opacity})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x, player.y, state.auraPulseRadius, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Renderiza o jogador.
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = `${player.faceSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(player.face, player.x, player.y);
}

// =============================================
// LOOP PRINCIPAL E FÍSICA DO JOGO
// =============================================
function updatePhysics(deltaTime) {
    if (config.gamePaused) return;
    const player = config.players[0];

    handlePowerUpTimer();

    // Atualiza a animação da aura pulsante.
    const effectiveRadius = player.isPoweredUp ? player.radius * 1.5 : player.radius;
    let newAuraRadius = state.auraPulseRadius + 2;
    if (newAuraRadius > effectiveRadius) newAuraRadius = 0;
    state.setAuraPulseRadius(newAuraRadius);

    // Atualiza todas as entidades do jogo.
    const particleUpdate = particle.updateParticles(state.particles, player, deltaTime, state.lastUpdateIndex);
    state.setParticles(particleUpdate.newParticles);
    state.setLastUpdateIndex(particleUpdate.newLastUpdateIndex);

    if (particleUpdate.powerupCollected) {
        player.isPoweredUp = true;
        player.powerUpTimer = 300;
        playSound('levelUp');
    }

    if (particleUpdate.absorbedXp > 0) {
        const finalXp = Math.round(particleUpdate.absorbedXp * (config.xpMultiplier || 1));
        config.xp += finalXp;
        updateQuest('absorb100', finalXp);
        checkLevelUp();
    }

    config.gameTime++;
    if (config.gameTime % config.particleRespawn.checkInterval === 0) {
        state.setParticles(particle.autoRespawnParticles(state.particles, player));
    }

    const projectileUpdate = projectile.updateProjectiles(state.projectiles);
    state.setProjectiles(projectileUpdate.remainingProjectiles);
    if (projectileUpdate.newExplosions.length > 0) {
        state.setExplosions([...state.explosions, ...projectileUpdate.newExplosions]);
        playSound('enemyDefeat');
    }

    state.setExplosions(explosion.updateExplosions(state.explosions));

    if (state.enemies.length > 0) {
        const enemyUpdate = enemy.updateEnemies(state.enemies, player, deltaTime, state.particles, state.projectiles);
        state.setEnemies(enemyUpdate.newEnemies);
        state.setParticles(enemyUpdate.newParticles);
        state.setProjectiles(enemyUpdate.newProjectiles);

        if (enemyUpdate.xpFromDefeatedEnemies > 0) {
            config.xp += enemyUpdate.xpFromDefeatedEnemies;
            updateQuest('defeat20', enemyUpdate.xpFromDefeatedEnemies > 0 ? 1 : 0);
            checkLevelUp();
        }
    }
    updateWave();

    // --- DETECÇÃO DE COLISÃO ---

    // Colisão: Jogador vs Partículas Hostis (geradas pelo Chefe).
    let hostileParticles = state.particles;
    for (let i = hostileParticles.length - 1; i >= 0; i--) {
        const p = hostileParticles[i];
        if (p.isHostile) {
            const dx = player.x - p.x;
            const dy = player.y - p.y;
            if (Math.sqrt(dx * dx + dy * dy) < player.size + p.size) {
                player.health -= 5;
                playSound('hit');
                hostileParticles.splice(i, 1);
            }
        }
    }
    state.setParticles(hostileParticles);

    // Colisão: Jogador vs Projéteis de Inimigos.
    let currentProjectiles = state.projectiles;
    for (let i = currentProjectiles.length - 1; i >= 0; i--) {
        const proj = currentProjectiles[i];
        const dx = player.x - proj.x;
        const dy = player.y - proj.y;
        if (Math.sqrt(dx * dx + dy * dy) < player.size + proj.size) {
            player.health -= proj.damage;
            playSound('hit');
            if (proj.onDeath === 'explode') {
                state.setExplosions([...state.explosions, { x: proj.x, y: proj.y, radius: proj.explosionRadius, damage: proj.damage, duration: 30, color: proj.color }]);
                playSound('enemyDefeat');
            }
            currentProjectiles.splice(i, 1);
        }
    }
    state.setProjectiles(currentProjectiles);

    // Colisão: Jogador vs Explosões.
    state.explosions.forEach(exp => {
        const dx = player.x - exp.x;
        const dy = player.y - exp.y;
        if (Math.sqrt(dx * dx + dy * dy) < exp.radius) {
            player.health -= exp.damage * (deltaTime / 16.67);
        }
    });

    // --- VERIFICAÇÃO DE FIM DE JOGO ---
    if (player.health <= 0) {
        player.health = 0;
        if (!config.gamePaused) {
            config.gamePaused = true;
            playSound('gameOver');
            audio.stopMusic();
            ui.showGameOver({ level: config.level, wave: config.wave.number, particles: config.particlesAbsorbed, enemies: config.enemiesDestroyed });
        }
    }
}

/** O loop principal do jogo, que é chamado a cada frame pela `requestAnimationFrame`. */
function gameLoop(timestamp) {
    if (!state.gameLoopRunning) return;
    requestAnimationFrame(gameLoop);
    state.setLastTime(state.lastTime || timestamp);
    const deltaTime = timestamp - state.lastTime;
    state.setLastTime(timestamp);
    state.incrementFrameCount();
    if (timestamp - state.fpsLastChecked >= 1000) {
        const newFps = Math.round((state.frameCount * 1000) / (timestamp - state.fpsLastChecked));
        state.setFps(newFps, timestamp, 0);
        ui.updateFps(newFps);
    }
    const physicsSteps = Math.min(Math.floor(deltaTime / (1000 / 60)), 3);
    for (let i = 0; i < physicsSteps; i++) {
        updatePhysics(1000 / 60);
    }
    ui.updateHealthBar(config.players[0].health, config.players[0].maxHealth);
    ui.updateXPBar(config.xp, config.level);
    updateStats();
    render();
}

// =============================================
// INICIALIZAÇÃO E CONFIGURAÇÃO DE CONTROLES
// =============================================

/** Pré-carrega as imagens dos inimigos para evitar que apareçam subitamente no jogo. */
function preloadImages() {
    for (const type of Object.values(config.enemySystem.types)) {
        if (type.imageUrl) {
            const img = new Image();
            img.src = type.imageUrl;
            imageCache[type.imageUrl] = img;
        }
    }
}

/** Configura todos os `event listeners` para os controles do jogo. */
function setupControls() {
    const player = config.players[0];
    const menu = document.getElementById('menu');

    // Desbloqueia o áudio na primeira interação do usuário para contornar políticas de autoplay dos navegadores.
    const handleFirstInteraction = () => {
        unlockAudio();
        audio.playMusic('mainTheme');
        canvas.removeEventListener('mousemove', handleFirstInteraction);
        window.removeEventListener('keydown', handleFirstInteraction);
    };

    canvas.addEventListener('mousemove', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);

    canvas.addEventListener('mousemove', (e) => { player.x = e.clientX; player.y = e.clientY; });

    window.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        if (key === 'm') {
            toggleMenu(menu, menu.style.display !== 'block');
        }
        if (config.gamePaused && key !== 'm') return;
        switch (key) {
            case '1': player.mode = 'attract'; break;
            case '2': player.mode = 'repel'; break;
            case '3': player.mode = 'vortex'; break;
        }
        ui.highlightActiveMode(player.mode);
    });

    window.addEventListener('keyup', (e) => {
        if (['1', '2', '3'].includes(e.key)) {
            player.mode = 'normal';
            ui.highlightActiveMode(player.mode);
        }
    });

    document.getElementById('menu-toggle').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMenu(menu, menu.style.display !== 'block');
    });

    menu.addEventListener('click', (e) => {
        const menuItem = e.target.closest('.menu-item');
        if (!menuItem) return;
        const action = menuItem.getAttribute('data-action');

        toggleMenu(menu, false);

        switch(action) {
            case 'setMode':
                player.mode = menuItem.getAttribute('data-mode');
                ui.highlightActiveMode(player.mode);
                break;
            case 'showGalaxies':
                toggleMenu(document.getElementById('galaxy-map'), true);
                ui.showGalaxyMap(config.galaxies.list, config.galaxies.unlocked, (key) => {
                    config.galaxies.current = key;
                    document.body.style.background = config.galaxies.list[key].background;
                    showUnlockMessage(`Galáxia ${config.galaxies.list[key].name} selecionada!`);
                    toggleMenu(document.getElementById('galaxy-map'), false);
                });
                break;
            case 'showSkills':
                {
                    const skillTreeMenu = document.getElementById('skill-tree');
                    toggleMenu(skillTreeMenu, true);
                    const refreshUI = () => {
                        ui.showSkillTree(config.skills.tree, config.skillPoints, (skillKey) => {
                            upgradeSkill(skillKey);
                            refreshUI();
                        });
                    };
                    refreshUI();
                }
                break;
            case 'showSkins':
                toggleMenu(document.getElementById('skins-modal'), true);
                ui.showSkinsModal(config.skins.available, config.skins.current, (id) => {
                    config.skins.current = id;
                    player.face = config.skins.available.find(s => s.id === id).emoji;
                    showUnlockMessage(`Skin selecionada!`);
                });
                break;
            case 'resetGame':
                restartGame();
                break;
            case 'toggleSound':
                config.soundEnabled = !config.soundEnabled;
                ui.toggleSoundUI(config.soundEnabled);
                break;
        }
    });

    document.getElementById('restart-btn').addEventListener('click', () => {
        toggleMenu(null, false);
        restartGame();
    });

    document.getElementById('close-galaxy-map').addEventListener('click', () => {
        toggleMenu(document.getElementById('galaxy-map'), false);
    });
    document.getElementById('close-skill-tree').addEventListener('click', () => {
        toggleMenu(document.getElementById('skill-tree'), false);
    });
    document.getElementById('close-skins').addEventListener('click', () => {
        toggleMenu(document.getElementById('skins-modal'), false);
    });
}

/** Função principal que inicializa o jogo quando a página é carregada. */
function initGame() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const player = config.players[0];
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;

    // Armazena os valores base do jogador para serem usados nos upgrades de habilidades.
    if (player.baseRadius === undefined) {
        player.baseRadius = player.radius;
        player.baseAttractionDamage = player.attractionDamage;
        player.baseMaxHealth = player.maxHealth;
        config.baseXpMultiplier = 1;
        config.xpMultiplier = 1;
    }

    preloadImages();
    requestAnimationFrame(spawnBatch);

    initSoundSystem();
    ui.updateHealthBar(player.health, player.maxHealth);
    ui.updateXPBar(config.xp, config.level);
    updateStats();
    ui.updateQuestUI(config.quests.active);
    ui.toggleSoundUI(config.soundEnabled);

    // Exibe o nome da galáxia do jogador.
    const username = localStorage.getItem('username') || 'Viajante';
    document.getElementById('galaxy-owner-display').textContent = `Galáxia de ${username}`;

    setupControls();
    state.setGameLoopRunning(true);
    requestAnimationFrame(gameLoop);
}

// Configura os listeners de eventos globais.
window.addEventListener('load', initGame);
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});
