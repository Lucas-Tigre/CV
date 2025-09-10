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
        absorb: 'https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-jump-coin-216.mp3',
        enemyDefeat: 'https://assets.mixkit.co/sfx/preview/mixkit-explosion-impact-1684.mp3',
        levelUp: 'https://assets.mixkit.co/sfx/preview/mixkit-unlock-game-notification-253.mp3',
        bigBang: 'https://assets.mixkit.co/sfx/preview/mixkit-big-explosion-2814.mp3',
        gameOver: 'https://assets.mixkit.co/sfx/preview/mixkit-arcade-retro-game-over-213.mp3',
        respawn: 'https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3',
        bossRoar: 'https://assets.mixkit.co/sfx/preview/mixkit-monster-deep-rumble-395.mp3'
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
