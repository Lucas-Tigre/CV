import { describe, it, expect, beforeEach } from '@jest/globals';
import { config } from './js/config.js';
import * as state from './js/state.js';
import { updateWave } from './js/game.js';

describe('Sistema de Ondas - Teste de Integração Final', () => {

  beforeEach(() => {
    // Reseta o estado do jogo para uma condição inicial consistente
    config.wave = {
      number: 1,
      enemiesToSpawn: 5,
      spawned: 5,
      timer: 0,
    };
    config.bossFightActive = false;
    config.quests = {
      active: [{ id: 'wave5', current: 0, target: 5 }],
      completed: []
    };

    // Simula o DOM mínimo para que as funções UI não quebrem o teste
    document.body.innerHTML = `
      <div id="unlock-message" style="display: none;"></div>
      <div id="quests-container"></div>
    `;
  });

  it('deve avançar para a próxima onda quando todos os inimigos forem derrotados', () => {
    // 1. Arrange
    state.setEnemies([]);

    // 2. Act
    updateWave();

    // 3. Assert
    expect(config.wave.number).toBe(2);
    expect(config.wave.enemiesToSpawn).toBeGreaterThan(5);
    expect(config.wave.spawned).toBe(0);
  });

  it('NÃO deve avançar de onda se ainda houver inimigos', () => {
    // 1. Arrange
    state.setEnemies([{ id: 1, health: 100 }]);

    // 2. Act
    updateWave();

    // 3. Assert
    expect(config.wave.number).toBe(1);
  });

  it('NÃO deve avançar de onda durante uma luta de chefe', () => {
    // 1. Arrange
    config.bossFightActive = true;
    state.setEnemies([]);

    // 2. Act
    updateWave();

    // 3. Assert
    expect(config.wave.number).toBe(1);
  });
});
