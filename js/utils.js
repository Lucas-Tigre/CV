import { config } from './config.js';

/** Toca um efeito sonoro pré-carregado. */
export function playSound(soundName) {
    try {
        if (config.soundEnabled && config.soundEffects[soundName]) {
            config.soundEffects[soundName].currentTime = 0;
            config.soundEffects[soundName].play().catch(e => console.log("Erro ao tocar som:", e));
        }
    } catch (error) {
        console.error("Erro no sistema de som:", error);
    }
}

/** Exibe uma mensagem de notificação animada na tela. */
export function showUnlockMessage(message) {
    const el = document.createElement('div');
    el.className = 'unlock-message';
    el.textContent = message;
    document.body.appendChild(el);

    // Animação de entrada e saída da mensagem.
    setTimeout(() => {
        el.style.opacity = '1';
        el.style.transform = 'translate(-50%, -50%) scale(1)';

        setTimeout(() => {
            el.style.opacity = '0';
            el.style.transform = 'translate(-50%, -50%) scale(0.5)';

            setTimeout(() => {
                if (document.body.contains(el)) {
                    document.body.removeChild(el);
                }
            }, 300);
        }, 2000);
    }, 10);
}

/** Carrega todos os efeitos sonoros e as preferências de som do usuário. */
export function initSoundSystem() {
    const soundPaths = {
        absorb: 'assets/audio/absorb.mp3',
        enemyDefeat: 'assets/audio/enemy_defeat.mp3',
        levelUp: 'assets/audio/level_up.mp3',
        gameOver: 'assets/audio/game_over.mp3',
        hit: 'assets/audio/hit.mp3',
        respawn: 'assets/audio/respawn.mp3',
        bossRoar: 'assets/audio/boss_roar.mp3',
    };

    for (const [key, url] of Object.entries(soundPaths)) {
        config.soundEffects[key] = new Audio(url);
        config.soundEffects[key].volume = 0.5;
        config.soundEffects[key].muted = !config.soundEnabled;
        config.soundEffects[key].load();
    }

    // Carrega a preferência de som do usuário (ligado/desligado) do armazenamento local.
    const savedSoundPref = localStorage.getItem('soundEnabled');
    if (savedSoundPref !== null) {
        config.soundEnabled = savedSoundPref === 'true';
    }
}

let audioUnlocked = false;
/** Desbloqueia a reprodução de áudio após a primeira interação do usuário com a página. */
export function unlockAudio() {
    if (audioUnlocked) return;
    audioUnlocked = true;

    // Tenta tocar e pausar cada som para "prepará-los" no navegador.
    Object.values(config.soundEffects).forEach(sound => {
        sound.play().then(() => sound.pause()).catch(() => {});
    });
}

/**
 * Verifica se o jogador tem XP suficiente para subir de nível.
 * Esta é uma função pura: ela não modifica o estado global, apenas calcula e retorna as mudanças.
 * @param {number} level - O nível atual do jogador.
 * @param {number} xp - A quantidade de XP atual do jogador.
 * @param {number} enemiesCount - O número de inimigos na tela.
 * @param {boolean} bossFightActive - Se uma luta de chefe está ativa.
 * @returns {object} Um objeto contendo o novo estado e os eventos que ocorreram (level up, chefe).
 */
export function checkLevelUp(level, xp, enemiesCount, bossFightActive) {
    const output = {
        newLevel: level,
        newXp: xp,
        skillPointsGained: 0,
        leveledUp: false,
        bossToTrigger: null,
        message: null,
    };

    // Se o nível máximo foi atingido, verifica se o chefe final deve ser acionado.
    if (level >= 50) {
        output.newXp = level * 100; // Mantém a barra de XP cheia no nível máximo.
        if (enemiesCount === 0 && !bossFightActive) {
            output.bossToTrigger = 50;
        }
        return output;
    }

    const xpNeeded = level * 100;
    if (xp >= xpNeeded) {
        output.newLevel = level + 1;
        output.newXp = xp - xpNeeded;
        output.skillPointsGained = 1;
        output.leveledUp = true;
        output.message = `Nível ${output.newLevel} alcançado! +1 Ponto de Habilidade`;

        // Aciona uma luta de chefe a cada 10 níveis.
        if (output.newLevel % 10 === 0) {
            output.bossToTrigger = output.newLevel;
        }
    }

    return output;
}
