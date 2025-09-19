// =============================================
// MÓDULO DE ÁUDIO PARA MÚSICA DE FUNDO
// =============================================

// TODO: USUÁRIO - Substitua estas URLs de placeholder pelos links dos seus arquivos de música.
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
 * Cria e configura um objeto de Áudio para uma faixa.
 * @param {string} trackName - A chave da faixa no objeto musicTracks.
 * @returns {Audio|null} - O objeto de Áudio configurado ou nulo se a faixa não existir.
 */
function createAudioElement(trackName) {
    if (!musicTracks[trackName]) {
        console.error(`Faixa de música "${trackName}" não encontrada.`);
        return null;
    }
    const audio = new Audio(musicTracks[trackName]);
    audio.loop = true;
    audio.volume = 0; // Começa com volume 0 para o fade in
    return audio;
}

/**
 * Toca uma faixa de música, fazendo fade out na faixa atual e fade in na nova.
 * @param {string} trackName - O nome da faixa a ser tocada.
 */
export function playMusic(trackName) {
    if (isFading || (currentTrack && currentTrack.trackName === trackName)) {
        return; // Não interrompe o fade ou reinicia a mesma faixa
    }

    const newAudio = createAudioElement(trackName);
    if (!newAudio) return;

    isFading = true;

    // Faz fade out da faixa atual, se existir
    if (currentTrack && currentTrack.audio.volume > 0) {
        let fadeOutInterval = setInterval(() => {
            currentTrack.audio.volume = Math.max(0, currentTrack.audio.volume - 0.05);
            if (currentTrack.audio.volume === 0) {
                clearInterval(fadeOutInterval);
                currentTrack.audio.pause();
                currentTrack.audio.src = ''; // Força o descarregamento do áudio
                startFadeIn();
            }
        }, 100);
    } else {
        startFadeIn();
    }

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
 * Para a música atualmente em execução com um efeito de fade out.
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
