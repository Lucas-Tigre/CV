import { jest } from '@jest/globals';

// jest-setup.js

// Adiciona os elementos HTML necessários para os testes ao JSDOM.
document.body.innerHTML = `
  <canvas id="canvas"></canvas>
  <div id="game-over-screen"></div>
  <div id="supernova"></div>
  <div id="shockwave"></div>
`;

// Mock da API de Áudio, pois o JSDOM não a implementa.
global.Audio = jest.fn().mockImplementation(() => ({
  play: jest.fn(() => Promise.resolve()),
  pause: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  volume: 1,
  currentTime: 0,
  duration: 100, // Duração de exemplo
  // Adicione outras propriedades e métodos conforme necessário.
}));


// Faz o mock da função getContext para o canvas, pois o JSDOM não a implementa.
HTMLCanvasElement.prototype.getContext = () => {
  return {
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    getImageData: jest.fn(),
    putImageData: jest.fn(),
    createImageData: jest.fn(),
    setTransform: jest.fn(),
    drawImage: jest.fn(),
    save: jest.fn(),
    fillText: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    closePath: jest.fn(),
    stroke: jest.fn(),
    strokeRect: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    measureText: jest.fn(() => ({ width: 0 })),
    transform: jest.fn(),
    rect: jest.fn(),
    clip: jest.fn(),
  };
};
