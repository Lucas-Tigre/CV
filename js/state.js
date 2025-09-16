// This file holds the dynamic state of the game.

export let particles = [];
export let enemies = [];
export let projectiles = [];
export let lastUpdateIndex = 0;
export let lastTime = 0;
export let fps = 60;
export let fpsLastChecked = 0;
export let frameCount = 0;
export let gameLoopRunning = false;

// We need functions to modify the state from other modules.
export function setParticles(newParticles) {
    particles = newParticles;
}

export function setEnemies(newEnemies) {
    enemies = newEnemies;
}

export function setProjectiles(newProjectiles) {
    projectiles = newProjectiles;
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

export let auraPulseRadius = 0;

export function setLastUpdateIndex(index) {
    lastUpdateIndex = index;
}

export function setAuraPulseRadius(radius) {
    auraPulseRadius = radius;
}
