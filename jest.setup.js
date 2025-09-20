// Simula um canvas e outros elementos do DOM para o ambiente JSDOM.
document.body.innerHTML = `
    <canvas id="canvas"></canvas>
    <div id="stats-panel">
        <div id="stat-level"></div>
        <div id="stat-xp"></div>
        <div id="stat-particles"></div>
        <div id="stat-enemies"></div>
        <div id="stat-wave"></div>
    </div>
    <div id="health-bar"></div>
    <div id="xp-bar"></div>
    <div id="xp-text"></div>
    <div id="game-over-screen" style="display: none;">
        <div id="go-level"></div>
        <div id="go-wave"></div>
        <div id="go-particles"></div>
        <div id="go-enemies"></div>
        <button id="restart-btn"></button>
    </div>
    <div id="sound-status"></div>
    <div id="quests-container"></div>
    <div id="menu"></div>
    <div id="menu-toggle"></div>
    <div id="galaxy-map">
        <button id="close-galaxy-map"></button>
    </div>
    <div id="skill-tree">
        <button id="close-skill-tree"></button>
    </div>
    <div id="skins-modal">
        <button id="close-skins"></button>
    </div>
`;

// Mock a getContext para o canvas para que o código do jogo não falhe.
const canvas = document.getElementById('canvas');
if (canvas) {
    canvas.getContext = () => ({
        clearRect: () => {},
        beginPath: () => {},
        arc: () => {},
        fill: () => {},
        stroke: () => {},
        translate: () => {},
        save: () => {},
        restore: () => {},
        fillText: () => {}
    });
}

// Mock da funcionalidade de áudio que não é implementada no JSDOM
window.HTMLMediaElement.prototype.play = () => Promise.resolve();
window.HTMLMediaElement.prototype.pause = () => {};
