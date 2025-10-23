import { updateEnemies } from './js/enemy.js';
import { config } from './js/config.js';
import * as state from './js/state.js';

// Mock do DOM e objetos globais necessários
global.window = {
    innerWidth: 1920,
    innerHeight: 1080
};

describe('Lógica de Remoção de Inimigos', () => {

    // Configuração inicial para cada teste
    beforeEach(() => {
        // Reseta o estado do jogo e a configuração antes de cada teste
        config.players = [{
            x: 500,
            y: 500,
            size: 20,
            mode: 'attract',
            attractionDamage: 10,
            isPoweredUp: false,
            radius: 200
        }];
        config.enemySystem = {
            types: {
                'testDummy': {
                    health: 5,
                    speed: 1,
                    face: [''],
                    behavior: 'hunt',
                    color: 'red',
                    size: 15,
                    ignoresAttraction: false
                }
            }
        };
        state.setEnemies([]);
    });

    test('deve remover um inimigo quando sua vida chegar a zero', () => {
        // ARRANGE: Cria um inimigo com vida baixa
        const initialEnemy = {
            x: 510,
            y: 510,
            type: 'testDummy',
            health: 5,
            maxHealth: 5,
            speedX: 0,
            speedY: 0,
            baseSpeed: 1,
            isElite: false,
            behavior: 'hunt',
            size: 15
        };
        state.setEnemies([initialEnemy]);

        // ACT: Simula o dano do jogador que irá derrotar o inimigo
        const player = config.players[0];
        // O dano de atração é 10, então uma única atualização deve ser suficiente
        const deltaTime = 16.67; // Simula um frame

        const result = updateEnemies(state.enemies, player, deltaTime, [], []);

        // ASSERT: Verifica se o array de inimigos está vazio
        expect(result.newEnemies).toBeDefined();
        expect(result.newEnemies.length).toBe(0);
        expect(result.xpFromDefeatedEnemies).toBeGreaterThan(0);
    });

    test('deve manter um inimigo se ele ainda tiver vida', () => {
        // ARRANGE: Cria um inimigo com vida alta
        const initialEnemy = {
            x: 510,
            y: 510,
            type: 'testDummy',
            health: 100,
            maxHealth: 100,
            speedX: 0,
            speedY: 0,
            baseSpeed: 1,
            isElite: false,
            behavior: 'hunt',
            size: 15
        };
        state.setEnemies([initialEnemy]);

        // ACT: Simula o dano do jogador
        const player = config.players[0];
        const deltaTime = 16.67;

        const result = updateEnemies(state.enemies, player, deltaTime, [], []);

        // ASSERT: Verifica se o inimigo ainda está no array
        expect(result.newEnemies.length).toBe(1);
        expect(result.newEnemies[0].health).toBeLessThan(100);
    });
});
