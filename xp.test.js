
import { config } from './js/config.js';

// Mock a simplified game state for testing purposes
let mockGame = {
    xp: 0,
    updateParticles: (particleXp) => {
        const finalXp = Math.round(particleXp * (config.xpMultiplier || 1) * config.globalXpMultiplier);
        mockGame.xp += finalXp;
    },
    updateEnemies: (enemyXp) => {
        mockGame.xp += Math.round(enemyXp * config.globalXpMultiplier);
    }
};

describe('XP System', () => {

    beforeEach(() => {
        // Reset config and mockGame before each test
        config.globalXpMultiplier = 2.5;
        config.xpMultiplier = 1; // Base multiplier for particles
        mockGame.xp = 0;
    });

    it('should apply the global XP multiplier to XP from particles', () => {
        const particleXp = 10;
        mockGame.updateParticles(particleXp);
        // Expected: 10 * 2.5 = 25
        expect(mockGame.xp).toBe(25);
    });

    it('should apply the global XP multiplier to XP from enemies', () => {
        const enemyXp = 20;
        mockGame.updateEnemies(enemyXp);
        // Expected: 20 * 2.5 = 50
        expect(mockGame.xp).toBe(50);
    });

    it('should correctly calculate combined XP from particles and enemies', () => {
        const particleXp = 10;
        const enemyXp = 20;

        mockGame.updateParticles(particleXp);
        mockGame.updateEnemies(enemyXp);

        // Expected: (10 * 2.5) + (20 * 2.5) = 25 + 50 = 75
        expect(mockGame.xp).toBe(75);
    });

    it('should handle a global multiplier of 1 correctly', () => {
        config.globalXpMultiplier = 1;
        const particleXp = 10;
        const enemyXp = 20;

        mockGame.updateParticles(particleXp);
        mockGame.updateEnemies(enemyXp);

        // Expected: 10 + 20 = 30
        expect(mockGame.xp).toBe(30);
    });
});
