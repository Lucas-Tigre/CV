import { jest } from '@jest/globals';
import { renderParticles } from './js/particle.js';

describe('Particle System Rendering', () => {
  test('renderParticles deve usar a cor "lightgreen" para o fundo de partículas de cura', () => {
    // Mock do contexto do Canvas 2D
    const mockCtx = {
      fillRect: jest.fn(),
      beginPath: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      // Armazena todos os valores atribuídos a fillStyle
      fillStyleHistory: [],
      set fillStyle(value) {
        this.fillStyleHistory.push(value);
      },
    };

    const healParticle = {
      x: 10,
      y: 10,
      size: 8,
      color: 'lightgreen',
      special: 'heal',
      trail: []
    };

    const particles = [healParticle];

    renderParticles(mockCtx, particles);

    // Verifica se a primeira cor usada para o fillStyle foi a cor da partícula
    expect(mockCtx.fillStyleHistory[0]).toBe('lightgreen');
    // Opcional: Verifica se a segunda cor foi 'white' para a cruz
    expect(mockCtx.fillStyleHistory[1]).toBe('white');
  });
});
