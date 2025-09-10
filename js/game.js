// =============================================
// IMPORTS
// =============================================
import { config } from './config.js';
import * as state from './state.js';
import * as ui from './ui.js';
import * as particle from './particle.js';
import * as enemy from './enemy.js';
import * as sound from './utils.js';
import * as audio from './audio.js';

// =============================================
// DOM ELEMENTS & ASSETS
// =============================================
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const imageCache = {};

// =============================================
// CORE GAME LOGIC
// =============================================

function triggerBossFight(level) {
    state.setEnemies([]); // Clear existing enemies
    config.bossFightActive = true;
    sound.showUnlockMessage(`UM CHEFE APARECEU!`);

    const bossType = level === 50 ? 'finalBoss' : 'boss';
    const musicTrack = level === 50 ? 'finalBossTheme' : 'bossBattle';
    audio.playMusic(musicTrack);

    state.setEnemies(enemy.spawnEnemy(state.enemies, bossType));
}

function checkLevelUp() {
    if (config.level >= 50) {
        config.xp = config.level * 100; // Cap XP
        if (state.enemies.length === 0 && !config.bossFightActive) {
            triggerBossFight(50);
        }
        return;
    }

    const xpNeeded = config.level * 100;
    if (config.xp >= xpNeeded) {
        config.level++;
        config.xp -= xpNeeded;
        config.skillPoints++;
        sound.showUnlockMessage(`Nível ${config.level} alcançado! +1 Ponto de Habilidade`);
        sound.playSound('levelUp');

        if (config.level % 10 === 0) {
            triggerBossFight(config.level);
        }
    }
}

function updateQuest(questId, amount = 1) {
    const quest = config.quests.active.find(q => q.id === questId);
    if (quest) {
        quest.current += amount;
        if (quest.current >= quest.target) {
            config.xp += quest.reward;
            config.quests.completed.push(quest.id);
            config.quests.active = config.quests.active.filter(q => q.id !== questId);
            sound.showUnlockMessage(`Missão completa! +${quest.reward}XP`);
            checkLevelUp();
        }
        ui.updateQuestUI(config.quests.active);
    }
}

function updateWave() {
    if (config.bossFightActive) {
        if (state.enemies.length === 0) {
            config.bossFightActive = false;
            sound.showUnlockMessage(`Chefe derrotado!`);
            audio.playMusic('mainTheme');
        }
        return;
    }

    config.wave.timer++;
    if (state.enemies.length === 0 && config.wave.spawned >= config.wave.enemiesToSpawn) {
        config.wave.number++;
        config.wave.enemiesToSpawn = 5 + Math.floor(config.wave.number * 1.5);
        config.wave.spawned = 0;
        config.wave.timer = 0;
        sound.showUnlockMessage(`Onda ${config.wave.number} começando!`);
        updateQuest('wave5', 1);
    } else if (config.wave.spawned < config.wave.enemiesToSpawn && config.wave.timer > 120) {
        state.setEnemies(enemy.spawnEnemy(state.enemies));
        config.wave.spawned++;
        config.wave.timer = 0;
    }
}

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

function restartGame() {
    document.getElementById('game-over-screen').style.display = 'none';
    const player = config.players[0];
    player.health = player.maxHealth;
    config.gamePaused = false;
    config.bossFightActive = false;
    state.setParticles(particle.initParticles(player));
    state.setEnemies([]);
    Object.assign(config, {
        wave: { number: 1, enemiesToSpawn: 5, spawned: 0, timer: 0 },
        xp: 0,
        level: 1,
        particlesAbsorbed: 0,
        enemiesDestroyed: 0,
        skillPoints: 0
    });
    config.quests.active = [
        { id: 'absorb100', target: 100, current: 0, reward: 50, title: "Absorver 100 partículas" },
        { id: 'defeat20', target: 20, current: 0, reward: 100, title: "Derrotar 20 inimigos" },
        { id: 'wave5', target: 5, current: 1, reward: 200, title: "Alcançar onda 5" }
    ];
    audio.playMusic('mainTheme');
    if (!state.gameLoopRunning) {
        state.setGameLoopRunning(true);
        requestAnimationFrame(gameLoop);
    }
}

// =============================================
// RENDER
// =============================================
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const player = config.players[0];

    state.particles.forEach(p => {
        p.trail.forEach((trail, i) => {
            const alpha = i / p.trail.length;
            ctx.fillStyle = p.color.replace(')', `, ${alpha})`).replace('hsl', 'hsla');
            ctx.beginPath();
            ctx.arc(trail.x, trail.y, trail.size * alpha, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });

    state.enemies.forEach(e => {
        const enemyType = config.enemySystem.types[e.type];
        const image = imageCache[enemyType.imageUrl];

        if (image && image.complete) {
            // Draw image if it's loaded
            ctx.drawImage(image, e.x - e.size, e.y - e.size, e.size * 2, e.size * 2);
        } else {
            // Fallback to drawing a circle and emoji
            ctx.fillStyle = e.color;
            ctx.beginPath();
            ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
            ctx.fill();
            if (e.isElite) {
                ctx.strokeStyle = 'gold';
                ctx.lineWidth = 3;
                ctx.stroke();
            }
            ctx.font = `${e.size * 0.8}px Arial`;
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(e.face, e.x, e.y);
        }
    });

    // Render the player's damage aura if in attract mode
    if (player.mode === 'attract') {
        const pulse = Math.abs(Math.sin(Date.now() * 0.005)); // Creates a value that pulses between 0 and 1
        // Anima a opacidade para um efeito sutil
        ctx.strokeStyle = `rgba(142, 45, 226, ${0.2 + pulse * 0.2})`;
        // Mantém a largura da linha fina e constante
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
        ctx.stroke();
    }

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
// GAME LOOP
// =============================================
function updatePhysics(deltaTime) {
    if (config.gamePaused) return;
    const player = config.players[0];

    const { newParticles, absorbedXp, newLastUpdateIndex } = particle.updateParticles(state.particles, player, deltaTime, state.lastUpdateIndex);
    state.setParticles(newParticles);
    state.setLastUpdateIndex(newLastUpdateIndex);
    if (absorbedXp > 0) {
        config.xp += absorbedXp;
        updateQuest('absorb100', absorbedXp);
        checkLevelUp();
    }

    // Particle respawn logic
    config.gameTime++;
    if (config.gameTime % config.particleRespawn.checkInterval === 0) {
        state.setParticles(particle.autoRespawnParticles(state.particles, player));
    }

    if (state.enemies.length > 0) {
        const enemyUpdate = enemy.updateEnemies(state.enemies, player, deltaTime);
        state.setEnemies(enemyUpdate.newEnemies);

        if (enemyUpdate.xpFromDefeatedEnemies > 0) {
            config.xp += enemyUpdate.xpFromDefeatedEnemies;
            updateQuest('defeat20', 1); // Assuming 1 enemy defeated for now
            checkLevelUp();
        }

        if (enemyUpdate.gameOver) {
            config.gamePaused = true;
            sound.playSound('gameOver');
            audio.stopMusic();
            ui.showGameOver({
                level: config.level,
                wave: config.wave.number,
                particles: config.particlesAbsorbed,
                enemies: config.enemiesDestroyed
            });
        }
    }
    updateWave();
}

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
// INITIALIZATION
// =============================================
function preloadImages() {
    for (const type of Object.values(config.enemySystem.types)) {
        if (type.imageUrl) {
            const img = new Image();
            img.src = type.imageUrl;
            imageCache[type.imageUrl] = img;
        }
    }
}

function setupControls() {
    const player = config.players[0];
    canvas.addEventListener('mousemove', (e) => { player.x = e.clientX; player.y = e.clientY; });
    window.addEventListener('keydown', (e) => {
        if (config.gamePaused) return;
        switch (e.key) {
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
        const menu = document.getElementById('menu');
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    });
    document.getElementById('menu').addEventListener('click', (e) => {
        const menuItem = e.target.closest('.menu-item');
        if (!menuItem) return;
        const action = menuItem.getAttribute('data-action');
        switch(action) {
            case 'setMode':
                player.mode = menuItem.getAttribute('data-mode');
                ui.highlightActiveMode(player.mode);
                break;
            case 'showGalaxies':
                ui.showGalaxyMap(config.galaxies.list, config.galaxies.unlocked, (key) => {
                    config.galaxies.current = key;
                    document.body.style.background = config.galaxies.list[key].background;
                    sound.showUnlockMessage(`Galáxia ${config.galaxies.list[key].name} selecionada!`);
                });
                break;
            case 'showSkills':
                ui.showSkillTree(config.skills.tree, config.skillPoints, (key) => {
                    console.log(`Upgrade skill: ${key}`);
                });
                break;
            case 'showSkins':
                ui.showSkinsModal(config.skins.available, config.skins.current, (id) => {
                    config.skins.current = id;
                    player.face = config.skins.available.find(s => s.id === id).emoji;
                    sound.showUnlockMessage(`Skin selecionada!`);
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
    document.getElementById('restart-btn').addEventListener('click', restartGame);
}

function initGame() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const player = config.players[0];
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    preloadImages();
    state.setParticles(particle.initParticles(player));
    sound.initSoundSystem();
    audio.playMusic('mainTheme');
    ui.updateHealthBar(player.health, player.maxHealth);
    ui.updateXPBar(config.xp, config.level);
    updateStats();
    ui.updateQuestUI(config.quests.active);
    ui.toggleSoundUI(config.soundEnabled);
    setupControls();
    state.setGameLoopRunning(true);
    requestAnimationFrame(gameLoop);
}

// =============================================
// START GAME
// =============================================
window.addEventListener('load', initGame);
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});
