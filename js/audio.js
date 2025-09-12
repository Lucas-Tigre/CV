// =============================================
// AUDIO MODULE FOR BACKGROUND MUSIC
// =============================================

// TODO: USER - Substitua estas URLs de placeholder pelos links dos seus arquivos de música.
// Você pode usar links diretos para arquivos .mp3, .wav, .ogg, etc.
// Exemplo: 'https://github.com/seu-usuario/seu-repo/raw/main/musica.mp3'
const musicTracks = {
    // Música que toca durante o gameplay normal.
    mainTheme: 'assets/audio/main_theme.mp3',

    // Música que toca durante as batalhas com chefes normais (níveis 10, 20, 30, 40).
    bossBattle: 'assets/audio/boss_battle.mp3',

    // Música especial que toca durante a batalha com o chefe final (nível 50).
    finalBossTheme: 'assets/audio/final_boss_theme.mp3'
};

let currentTrack = null;
let isFading = false;

/**
 * Creates and configures an Audio object for a track.
 * @param {string} trackName - The key of the track in the musicTracks object.
 * @returns {Audio|null} - The configured Audio object or null if the track doesn't exist.
 */
function createAudioElement(trackName) {
    if (!musicTracks[trackName]) {
        console.error(`Music track "${trackName}" not found.`);
        return null;
    }
    const audio = new Audio(musicTracks[trackName]);
    audio.loop = true;
    audio.volume = 0; // Start with volume 0 for fading in
    return audio;
}

/**
 * Plays a music track, fading out the current track and fading in the new one.
 * @param {string} trackName - The name of the track to play.
 */
export function playMusic(trackName) {
    if (isFading || (currentTrack && currentTrack.trackName === trackName)) {
        return; // Don't interrupt fading or restart the same track
    }

    const newAudio = createAudioElement(trackName);
    if (!newAudio) return;

    isFading = true;

    // Fade out the current track if it exists
    if (currentTrack && currentTrack.audio.volume > 0) {
        let fadeOutInterval = setInterval(() => {
            currentTrack.audio.volume = Math.max(0, currentTrack.audio.volume - 0.05);
            if (currentTrack.audio.volume === 0) {
                clearInterval(fadeOutInterval);
                currentTrack.audio.pause();
                startFadeIn();
            }
        }, 100);
    } else {
        startFadeIn();
    }

    function startFadeIn() {
        currentTrack = { audio: newAudio, trackName: trackName };
        currentTrack.audio.play().catch(e => console.error("Audio play failed:", e));

        let fadeInInterval = setInterval(() => {
            currentTrack.audio.volume = Math.min(0.5, currentTrack.audio.volume + 0.05); // Max volume 0.5
            if (currentTrack.audio.volume >= 0.5) {
                clearInterval(fadeInInterval);
                isFading = false;
            }
        }, 100);
    }
}

/**
 * Stops the currently playing music with a fade out.
 */
export function stopMusic() {
    if (!currentTrack || isFading) return;

    isFading = true;
    let fadeOutInterval = setInterval(() => {
        currentTrack.audio.volume = Math.max(0, currentTrack.audio.volume - 0.05);
        if (currentTrack.audio.volume === 0) {
            clearInterval(fadeOutInterval);
            currentTrack.audio.pause();
            currentTrack = null;
            isFading = false;
        }
    }, 100);
}
