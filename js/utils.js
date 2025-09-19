import { config } from './config.js';

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

export function showUnlockMessage(message) {
    const el = document.createElement('div');
    el.className = 'unlock-message';
    el.textContent = message;
    document.body.appendChild(el);

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

export function initSoundSystem() {
    const soundPaths = {
        absorb: 'assets/audio/absorb.mp3',
        enemyDefeat: 'assets/audio/enemy_defeat.mp3',
        levelUp: 'assets/audio/level_up.mp3',
        gameOver: 'assets/audio/game_over.mp3',
        hit: 'assets/audio/hit.mp3',
        respawn: 'assets/audio/respawn.mp3',
        bossRoar: 'assets/audio/boss_roar.mp3',
        // O som do bigBang foi removido da lógica do jogo, então podemos removê-lo daqui também.
    };

    for (const [key, url] of Object.entries(soundPaths)) {
        config.soundEffects[key] = new Audio(url);
        config.soundEffects[key].volume = 0.5;
        config.soundEffects[key].muted = !config.soundEnabled;
        config.soundEffects[key].load();
    }

    const savedSoundPref = localStorage.getItem('soundEnabled');
    if (savedSoundPref !== null) {
        config.soundEnabled = savedSoundPref === 'true';
    }
}

let audioUnlocked = false;
export function unlockAudio() {
    if (audioUnlocked) return;
    audioUnlocked = true;

    Object.values(config.soundEffects).forEach(sound => {
        sound.play().then(() => sound.pause()).catch(() => {});
    });
}
