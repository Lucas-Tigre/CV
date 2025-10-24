// Este arquivo centraliza e exporta o estado dinâmico do jogo,
// como as posições de entidades, timers e flags de controle.

export let particles = [];
export let enemies = [];
export let projectiles = [];
export let explosions = [];

export let lastUpdateIndex = 0; // Índice para otimização do loop de partículas.
export let lastTime = 0;        // Timestamp do último frame para cálculo do deltaTime.
export let fps = 60;
export let fpsLastChecked = 0;
export let frameCount = 0;
export let gameLoopRunning = false;
export let auraPulseRadius = 0; // Raio atual da animação da aura do jogador.
export let accumulator = 0;     // Acumulador de tempo para a física do jogo.

// =============================================
// FUNÇÕES SETTER
// Permitem que outros módulos modifiquem o estado de forma controlada.
// =============================================

export function setParticles(newParticles) {
    particles.length = 0;
    particles.push(...newParticles);
}

export function setEnemies(newEnemies) {
    enemies.length = 0;
    enemies.push(...newEnemies);
}

export function setProjectiles(newProjectiles) {
    projectiles.length = 0;
    projectiles.push(...newProjectiles);
}

export function setExplosions(newExplosions) {
    explosions.length = 0;
    explosions.push(...newExplosions);
}

export function setGameLoopRunning(value) {
    gameLoopRunning = value;
}

export function setLastTime(time) {
    lastTime = time;
}

export function setFps(newFps, lastChecked, newFrameCount) {
    fps = newFps;
    fpsLastChecked = lastChecked;
    frameCount = newFrameCount;
}

export function incrementFrameCount() {
    frameCount++;
}

export function setLastUpdateIndex(index) {
    lastUpdateIndex = index;
}

export function setAuraPulseRadius(radius) {
    auraPulseRadius = radius;
}

export function setAccumulator(value) {
    accumulator = value;
}
