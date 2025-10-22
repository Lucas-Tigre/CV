// Simula um canvas e outros elementos do DOM para o ambiente JSDOM,
// que é usado pelo Jest para rodar os testes.
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
    <div id="fps-counter"></div>
    <div id="game-over-screen" style="display: none;">
        <div id="game-over-stars"></div>
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
        <div id="galaxies-list"></div>
        <button id="close-galaxy-map"></button>
    </div>
    <div id="skill-tree">
        <div id="skills-list"></div>
        <button id="close-skill-tree"></button>
    </div>
    <div id="skins-modal">
        <div id="skins-grid"></div>
        <button id="close-skins"></button>
    </div>
    <div id="supernova" style="animation: none;"></div>
    <div id="shockwave" style="animation: none;"></div>
`;

// Simula a função `getContext` do canvas, pois ela não existe no JSDOM.
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

// Simula as funções de áudio, que não são implementadas no JSDOM.
// Isso evita que os testes queiram ao tentar interagir com elementos de áudio.
window.HTMLMediaElement.prototype.play = () => Promise.resolve();
window.HTMLMediaElement.prototype.pause = () => {};
