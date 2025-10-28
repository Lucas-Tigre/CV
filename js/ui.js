import { getLeaderboard } from './supabaseService.js';

/**
 * Busca os dados do placar de líderes e os exibe na tabela.
 */
export async function displayLeaderboard() {
    const leaderboardBody = document.getElementById('leaderboard-body');
    if (!leaderboardBody) return;

    leaderboardBody.innerHTML = '<tr><td colspan="3">Carregando...</td></tr>';

    try {
        const scores = await getLeaderboard();
        leaderboardBody.innerHTML = ''; // Limpa o estado de carregamento

        if (scores.length === 0) {
            leaderboardBody.innerHTML = '<tr><td colspan="3">Nenhuma pontuação registrada.</td></tr>';
            return;
        }

        scores.forEach((score, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${escapeHtml(score.username)}</td>
                <td>${score.score}</td>
            `;
            leaderboardBody.appendChild(row);
        });
    } catch (error) {
        console.error('Falha ao exibir o placar de líderes:', error);
        leaderboardBody.innerHTML = '<tr><td colspan="3">Erro ao carregar.</td></tr>';
    }
}

/**
 * Escapa caracteres HTML para prevenir ataques de XSS.
 * @param {string} text - O texto a ser escapado.
 * @returns {string} O texto escapado.
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Este módulo contém todas as funções que manipulam diretamente o DOM para atualizar a interface do usuário (UI).
 */

/** Atualiza a barra de vida do jogador. */
export function updateHealthBar(health, maxHealth) {
    const healthPercent = (health / maxHealth) * 100;
    const healthBar = document.getElementById('health-bar');
    if (!healthBar) return;

    healthBar.style.width = `${healthPercent}%`;
    healthBar.style.backgroundColor =
        healthPercent > 60 ? '#00F5A0' :
        healthPercent > 30 ? '#FFA500' : '#FF0000';

    // Adiciona uma animação de pulsação quando a vida está baixa.
    if (healthPercent < 30) {
        healthBar.style.animation = 'pulse 1s infinite';
    } else {
        healthBar.style.animation = 'none';
    }
}

/** Atualiza a barra de experiência (XP) e o texto de nível. */
export function updateXPBar(xp, level) {
    const xpNeeded = level * 100;
    const xpPercent = (xp / xpNeeded) * 100;
    document.getElementById('xp-bar').style.width = `${xpPercent}%`;
    document.getElementById('xp-text').textContent =
        `${xp}/${xpNeeded} XP (Nível ${level})`;
}

/** Atualiza o painel de estatísticas com os dados atuais do jogo. */
export function updateStatsPanel(stats) {
    document.getElementById('stat-level').textContent = stats.level;
    document.getElementById('stat-xp').textContent = `${stats.xp}/${stats.level * 100}`;
    document.getElementById('stat-particles').textContent = stats.particlesAbsorbed;
    document.getElementById('stat-enemies').textContent = stats.enemies;
    document.getElementById('stat-wave').textContent = stats.wave;
}

/** Renderiza a lista de missões ativas na tela. */
export function updateQuestUI(activeQuests) {
    const container = document.getElementById('quests-container');
    container.innerHTML = ''; // Limpa as missões antigas antes de renderizar as novas.

    activeQuests.forEach(quest => {
        const progress = Math.min(100, (quest.current / quest.target) * 100);
        const questEl = document.createElement('div');
        questEl.className = 'quest-item';
        questEl.innerHTML = `
            <div>${quest.title}</div>
            <div class="quest-progress">
                <div class="quest-progress-bar" style="width: ${progress}%"></div>
            </div>
            <small>${quest.current}/${quest.target} (${Math.round(progress)}%)</small>
        `;
        container.appendChild(questEl);
    });
}

/** Exibe a tela de fim de jogo com as estatísticas finais. */
export function showGameOver(stats) {
    document.getElementById('go-level').textContent = stats.level;
    document.getElementById('go-wave').textContent = stats.wave;
    document.getElementById('go-particles').textContent = stats.particlesAbsorbed;
    document.getElementById('go-enemies').textContent = stats.enemiesDestroyed;
    createStars(); // Cria o efeito de estrelas no fundo.
    document.getElementById('game-over-screen').style.display = 'flex';
}

/** Cria um fundo de estrelas animadas para a tela de fim de jogo. */
function createStars() {
    const container = document.getElementById('game-over-stars');
    container.innerHTML = '';
    for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.width = `${Math.random() * 3 + 1}px`;
        star.style.height = star.style.width;
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.animationDelay = `${Math.random() * 5}s`;
        container.appendChild(star);
    }
}

/** Destaca o modo de interação ativo no menu. */
export function highlightActiveMode(activeMode) {
    document.querySelectorAll('[data-action="setMode"]').forEach(item => {
        if (item.getAttribute('data-mode') === activeMode) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

/** Atualiza o indicador de som (ligado/desligado) na interface. */
export function toggleSoundUI(soundEnabled) {
    document.getElementById('sound-status').textContent = soundEnabled ? 'ON' : 'OFF';
}

/** Atualiza o contador de FPS (Frames Por Segundo) na tela. */
export function updateFps(fps) {
    document.getElementById('fps-counter').textContent = `FPS: ${fps}`;
}

/** Exibe o mapa de galáxias e lida com a seleção. */
export function showGalaxyMap(galaxies, unlockedGalaxies, onSelect) {
    const map = document.getElementById('galaxy-map');
    map.style.display = 'block';

    const galaxiesList = document.getElementById('galaxies-list');
    galaxiesList.innerHTML = '';

    for (const [key, galaxy] of Object.entries(galaxies)) {
        const isUnlocked = unlockedGalaxies.includes(key);
        const galaxyEl = document.createElement('div');
        galaxyEl.className = `galaxy ${isUnlocked ? 'unlocked' : 'locked'}`;
        galaxyEl.innerHTML = `
            <h3>${galaxy.name}</h3>
            <p>${galaxy.description}</p>
            ${!isUnlocked ? `<small>Requisito: ${galaxy.unlockCondition}</small>` : ''}
        `;

        if (isUnlocked) {
            // Clona o nó para remover event listeners antigos antes de adicionar um novo.
            const newGalaxyEl = galaxyEl.cloneNode(true);
            galaxyEl.parentNode?.replaceChild(newGalaxyEl, galaxyEl);
            newGalaxyEl.addEventListener('click', () => {
                onSelect(key);
                map.style.display = 'none';
            });
        }
        galaxiesList.appendChild(galaxyEl);
    }
}

/** Exibe a árvore de habilidades e lida com os upgrades. */
export function showSkillTree(skills, skillPoints, onUpgrade) {
    const tree = document.getElementById('skill-tree');
    tree.style.display = 'block';

    const skillsList = document.getElementById('skills-list');
    skillsList.innerHTML = '';

    for (const [key, skill] of Object.entries(skills)) {
        const skillEl = document.createElement('div');
        skillEl.className = `skill ${skill.currentLevel > 0 ? 'unlocked' : 'locked'} ${skill.currentLevel >= skill.maxLevel ? 'maxed' : ''}`;
        skillEl.innerHTML = `
            <h3>${skill.name} (Nível ${skill.currentLevel}/${skill.maxLevel})</h3>
            <p>${skill.effect}</p>
            <div class="skill-cost">Custo: ${skill.cost} pontos</div>
            ${skill.currentLevel < skill.maxLevel && skillPoints >= skill.cost ? `<button class="upgrade-btn" data-skill="${key}">Melhorar</button>` : ''}
        `;
        skillsList.appendChild(skillEl);
    }

    // Adiciona os event listeners aos botões de upgrade.
    document.querySelectorAll('.upgrade-btn').forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', function() {
            const skillKey = this.getAttribute('data-skill');
            onUpgrade(skillKey);
        });
    });
}

/** Exibe o modal de skins e lida com a seleção. */
export function showSkinsModal(skins, currentSkin, onSelect) {
    const modal = document.getElementById('skins-modal');
    modal.style.display = 'flex';
    const grid = document.getElementById('skins-grid');
    grid.innerHTML = '';

    skins.forEach(skin => {
        const skinCard = document.createElement('div');
        skinCard.className = `skin-card ${skin.type} ${skin.id === currentSkin ? 'selected' : ''} ${skin.unlocked ? '' : 'locked'}`;
        skinCard.innerHTML = `
            <div class="skin-emoji">${skin.emoji}</div>
            <div class="skin-name">${skin.name}</div>
            ${!skin.unlocked ? `<div class="skin-requirement">${skin.unlockCondition}</div>` : ''}
        `;
        if (skin.unlocked) {
            const newSkinCard = skinCard.cloneNode(true);
            skinCard.parentNode?.replaceChild(newSkinCard, skinCard);
            newSkinCard.addEventListener('click', () => {
                onSelect(skin.id);
            });
        }
        grid.appendChild(skinCard);
    });
}

/**
 * Atualiza a barra de carga do Big Bang.
 * @param {number} chargePercent - A porcentagem atual de carga do Big Bang (0 a 100).
 */
export function updateBigBangChargeBar(chargePercent) {
    const container = document.getElementById('bigbang-charge-container');
    if (!container) return;

    // Controla a visibilidade usando a classe CSS .visible
    if (chargePercent > 0) {
        container.classList.add('visible');
    } else {
        container.classList.remove('visible');
    }

    // A barra de progresso em si.
    const progressBar = document.getElementById('bigbang-charge-progress');
    if (progressBar) {
        progressBar.style.width = `${chargePercent}%`;
    }

    // Quando a barra está cheia, adiciona um efeito para indicar que está pronto.
    if (chargePercent >= 100) {
        container.classList.add('bigbang-ready');
    } else {
        container.classList.remove('bigbang-ready');
    }
}

/**
 * Atualiza a visibilidade do indicador de Big Bang pronto.
 * @param {number} chargePercent - A porcentagem atual de carga do Big Bang (0 a 100).
 */
export function updateBigBangIndicator(chargePercent) {
    const indicator = document.getElementById('bigbang-indicator');
    if (!indicator) return;

    if (chargePercent >= 100) {
        indicator.style.display = 'block';
        indicator.classList.add('ready');
    } else {
        indicator.style.display = 'none';
        indicator.classList.remove('ready');
    }
}
