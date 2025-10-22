// =============================================
// MÓDULO DE ÁUDIO PARA MÚSICA DE FUNDO
// =============================================

const musicTracks = {
    mainTheme: 'assets/audio/WordCLASSIC.mp3',
    bossBattle: 'assets/audio/10.40BFHT.mp3',
    finalBossTheme: 'assets/audio/FinalBoss50.mp3'
};

const audioCache = {};
let currentTrack = null;
let isFading = false;

/**
 * Pré-carrega uma faixa de áudio e a armazena no cache.
 * @param {string} trackName - O nome da faixa a ser pré-carregada.
 */
export function preloadMusic(trackName) {
    if (!musicTracks[trackName] || audioCache[trackName]) {
        return;
    }
    const audio = new Audio(musicTracks[trackName]);
    audio.preload = 'auto';
    audio.load();
    audioCache[trackName] = audio;
    console.log(`Pré-carregando música: ${trackName}`);
}

/**
 * Obtém um elemento de áudio do cache ou o cria se não existir.
 * @param {string} trackName - A chave da faixa no objeto `musicTracks`.
 * @returns {Audio|null} O elemento de áudio configurado.
 */
function getAudioElement(trackName) {
    if (audioCache[trackName]) {
        const audio = audioCache[trackName];
        audio.currentTime = 0; // Reinicia a música
        return audio;
    }

    if (!musicTracks[trackName]) {
        console.error(`Faixa de música "${trackName}" não encontrada.`);
        return null;
    }

    const audio = new Audio(musicTracks[trackName]);
    audio.loop = true;
    audioCache[trackName] = audio;
    return audio;
}

/**
 * Toca uma faixa musical, fazendo um fade out da faixa atual e um fade in da nova.
 * @param {string} trackName - O nome da faixa a ser tocada.
 */
export function playMusic(trackName) {
    if (isFading || (currentTrack && currentTrack.trackName === trackName)) {
        return;
    }

    const newAudio = getAudioElement(trackName);
    if (!newAudio) return;

    newAudio.volume = 0; // Garante que o volume comece em 0 para o fade in.
    isFading = true;

    // Faz o fade out da faixa atual, se houver uma tocando.
    if (currentTrack && currentTrack.audio.volume > 0) {
        let fadeOutInterval = setInterval(() => {
            currentTrack.audio.volume = Math.max(0, currentTrack.audio.volume - 0.05);
            if (currentTrack.audio.volume === 0) {
                clearInterval(fadeOutInterval);
                currentTrack.audio.pause();
                currentTrack.audio.src = ''; // Força o descarregamento do áudio.
                startFadeIn();
            }
        }, 100);
    } else {
        startFadeIn();
    }

    // Inicia o fade in da nova faixa.
    function startFadeIn() {
        currentTrack = { audio: newAudio, trackName: trackName };
        currentTrack.audio.play().catch(e => console.error("Falha ao tocar áudio:", e));

        let fadeInInterval = setInterval(() => {
            currentTrack.audio.volume = Math.min(0.5, currentTrack.audio.volume + 0.05); // Volume máximo de 0.5
            if (currentTrack.audio.volume >= 0.5) {
                clearInterval(fadeInInterval);
                isFading = false;
            }
        }, 100);
    }
}

/**
 * Para a música atualmente em reprodução com um efeito de fade out.
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
