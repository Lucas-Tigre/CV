// =============================================
// AUDIO MODULE FOR BACKGROUND MUSIC
// =============================================

// TODO: USER - Replace these placeholder URLs with your actual music file links from GitHub.
const musicTracks = {
    mainTheme: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Placeholder
    bossBattle: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', // Placeholder
    finalBossTheme: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' // Placeholder
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
