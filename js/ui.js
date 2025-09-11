/**
 * This module contains all functions that directly manipulate the DOM to update the UI.
 */

export function updateHealthBar(health, maxHealth) {
    const healthPercent = (health / maxHealth) * 100;
    const healthBar = document.getElementById('health-bar');
    if (!healthBar) return;

    healthBar.style.width = `${healthPercent}%`;
    healthBar.style.backgroundColor =
        healthPercent > 60 ? '#00F5A0' :
        healthPercent > 30 ? '#FFA500' : '#FF0000';

    if (healthPercent < 30) {
        healthBar.style.animation = 'pulse 1s infinite';
    } else {
        healthBar.style.animation = 'none';
    }
}

export function updateXPBar(xp, level) {
    const xpNeeded = level * 100;
    const xpPercent = (xp / xpNeeded) * 100;
    document.getElementById('xp-bar').style.width = `${xpPercent}%`;
    document.getElementById('xp-text').textContent =
        `${xp}/${xpNeeded} XP (Nível ${level})`;
}

export function updateStatsPanel(stats) {
    document.getElementById('stat-level').textContent = stats.level;
    document.getElementById('stat-xp').textContent = `${stats.xp}/${stats.level * 100}`;
    document.getElementById('stat-particles').textContent = stats.particlesAbsorbed;
    document.getElementById('stat-enemies').textContent = stats.enemies;
    document.getElementById('stat-wave').textContent = stats.wave;
}

export function updateQuestUI(activeQuests) {
    const container = document.getElementById('quests-container');
    container.innerHTML = '';

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

export function showGameOver(stats) {
    document.getElementById('go-level').textContent = stats.level;
    document.getElementById('go-wave').textContent = stats.wave;
    document.getElementById('go-particles').textContent = stats.particles;
    document.getElementById('go-enemies').textContent = stats.enemies;
    createStars();
    document.getElementById('game-over-screen').style.display = 'flex';
}

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

export function highlightActiveMode(activeMode) {
    document.querySelectorAll('[data-action="setMode"]').forEach(item => {
        if (item.getAttribute('data-mode') === activeMode) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

export function toggleSoundUI(soundEnabled) {
    document.getElementById('sound-status').textContent = soundEnabled ? 'ON' : 'OFF';
}

export function updateFps(fps) {
    document.getElementById('fps-counter').textContent = `FPS: ${fps}`;
}

export function showGalaxyMap(galaxies, unlockedGalaxies, onSelect, onClose) {
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
            galaxyEl.addEventListener('click', () => {
                onSelect(key);
                map.style.display = 'none';
                onClose(); // Game is unpaused when a selection is made
            });
        }
        galaxiesList.appendChild(galaxyEl);
    }
}

export function showSkillTree(skills, skillPoints, onUpgrade, onClose) {
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

    document.querySelectorAll('.upgrade-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const skillKey = this.getAttribute('data-skill');
            onUpgrade(skillKey);
            showSkillTree(skills, skillPoints - skills[skillKey].cost, onUpgrade, onClose);
        });
    });
}

export function showSkinsModal(skins, currentSkin, onSelect, onClose) {
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
            skinCard.addEventListener('click', () => {
                onSelect(skin.id);
                showSkinsModal(skins, skin.id, onSelect, onClose);
            });
        }
        grid.appendChild(skinCard);
    });
}

// This function needs to be called from game.js to set up the callbacks
export function setupModalCloseButtons(onClose) {
    document.getElementById('close-galaxy-map').addEventListener('click', () => {
        document.getElementById('galaxy-map').style.display = 'none';
        onClose();
    });
    document.getElementById('close-skill-tree').addEventListener('click', () => {
        document.getElementById('skill-tree').style.display = 'none';
        onClose();
    });
    document.getElementById('close-skins').addEventListener('click', () => {
        document.getElementById('skins-modal').style.display = 'none';
        onClose();
    });
}
