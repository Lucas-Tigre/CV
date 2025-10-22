// =============================================
// MÓDULO DE ÁUDIO PARA MÚSICA DE FUNDO
// =============================================

const musicTracks = {
    // Música que toca durante o jogo normal.
    mainTheme: 'assets/audio/WordCLASSIC.mp3',

    // Música que toca durante as batalhas com chefes.
    bossBattle: 'assets/audio/10.40BFHT.mp3',

    // Música especial para a batalha com o chefe final.
    finalBossTheme: 'assets/audio/FinalBoss50.mp3'
};

let currentTrack = null;
let isFading = false;

/**
 * Cria e configura um elemento de áudio para uma faixa musical.
 * @param {string} trackName - A chave da faixa no objeto `musicTracks`.
 * @returns {Audio|null} O elemento de áudio configurado ou nulo se a faixa não for encontrada.
 */
function createAudioElement(trackName) {
    if (!musicTracks[trackName]) {
        console.error(`Faixa de música "${trackName}" não encontrada.`);
        return null;
    }
    const audio = new Audio(musicTracks[trackName]);
    audio.loop = true;
    audio.volume = 0; // Começa com volume 0 para o efeito de fade in.
    return audio;
}

/**
 * Toca uma faixa musical, fazendo um fade out da faixa atual e um fade in da nova.
 * @param {string} trackName - O nome da faixa a ser tocada.
 */
export function playMusic(trackName) {
    if (isFading || (currentTrack && currentTrack.trackName === trackName)) {
        return; // Não interrompe o fade nem reinicia a mesma faixa.
    }

    const newAudio = createAudioElement(trackName);
    if (!newAudio) return;

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
