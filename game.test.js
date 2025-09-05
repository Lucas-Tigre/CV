// Import the entire module as a single object to allow for easy mocking
const game = require('./game.js');

// Mocking a canvas and other DOM elements for JSDOM
beforeAll(() => {
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
        </div>
    `;
    // Mock for canvas context
    const canvas = document.getElementById('canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            // Mock getContext if it doesn't exist in JSDOM
            canvas.getContext = () => ({
                clearRect: () => {},
                beginPath: () => {},
                arc: () => {},
                fill: () => {},
                stroke: () => {},
                translate: () => {},
                save: () => {},
                restore: () => {},
            });
        }
    }
});


describe('Enemy System', () => {

    beforeEach(() => {
        // Reset config and enemies array before each test
        Object.assign(game.config, JSON.parse(JSON.stringify(require('./game.js').config)));
        game.enemies.length = 0; // Clear the enemies array
        game.config.players[0].x = 500;
        game.config.players[0].y = 500;
        game.config.wave.number = 1;
    });

    describe('spawnEnemy', () => {
        it('should create and add a new enemy to the enemies array', () => {
            expect(game.enemies.length).toBe(0);
            game.spawnEnemy();
            expect(game.enemies.length).toBe(1);
        });

        it('should create an enemy with correct properties', () => {
            game.spawnEnemy();
            const enemy = game.enemies[0];
            expect(enemy).toHaveProperty('x');
            expect(enemy).toHaveProperty('y');
            expect(enemy).toHaveProperty('type');
            expect(enemy).toHaveProperty('health');
            expect(enemy).toHaveProperty('speed');
            expect(enemy).toHaveProperty('face');
            expect(enemy).toHaveProperty('isElite');
            expect(enemy).toHaveProperty('behavior');
            expect(enemy).toHaveProperty('color');
            expect(enemy).toHaveProperty('size');
        });

        it('should create an elite enemy with higher stats', () => {
            // Force an elite spawn by mocking Math.random
            const originalRandom = Math.random;
            Math.random = () => 0.05; // Less than 0.1 for elite chance

            game.spawnEnemy();
            const eliteEnemy = game.enemies[0];

            expect(eliteEnemy.isElite).toBe(true);
            expect(eliteEnemy.size).toBe(game.config.enemySystem.baseSize * game.config.enemySystem.eliteSizeMultiplier);
            expect(eliteEnemy.speed).toBeGreaterThan(game.config.enemySystem.types[eliteEnemy.type].speed);

            Math.random = originalRandom; // Restore original Math.random
        });
    });

    describe('updateEnemies', () => {
        it('should update enemy positions based on their behavior', () => {
            // Create a 'wander' enemy
            const wanderEnemy = { x: 100, y: 100, speed: 2, behavior: 'wander' };
            game.enemies.push(wanderEnemy);
            game.updateEnemies(16.67);
            expect(wanderEnemy.x).not.toBe(100);
            expect(wanderEnemy.y).not.toBe(100);

            // Create a 'hunt' enemy
            const huntEnemy = { x: 400, y: 400, speed: 3, behavior: 'hunt', huntRadius: 200 };
            game.enemies.push(huntEnemy);
            game.updateEnemies(16.67);
            // Player is at 500, 500, so enemy should move towards it
            expect(huntEnemy.x).toBeGreaterThan(400);
            expect(huntEnemy.y).toBeGreaterThan(400);
        });

        it('should damage the player on collision', () => {
            const originalHealth = game.config.players[0].health;
            // Place an enemy directly on the player
            game.enemies.push({ x: 500, y: 500, size: 20, behavior: 'wander' });
            game.config.players[0].size = 30;

            game.updateEnemies(16.67);

            expect(game.config.players[0].health).toBeLessThan(originalHealth);
        });
    });
});

describe('Player Progression System', () => {
    let checkLevelUpSpy;
    let applySkillEffectsSpy;

    beforeEach(() => {
        // Reset config to a deep copy of the original state
        Object.assign(game.config, JSON.parse(JSON.stringify(require('./game.js').config)));
        game.config.level = 1;
        game.config.xp = 0;
        game.config.skillPoints = 0;
        game.config.quests.active = [
            { id: 'absorb100', target: 100, current: 0, reward: 50, title: "Absorver 100 partículas" },
            { id: 'defeat20', target: 20, current: 0, reward: 100, title: "Derrotar 20 inimigos" }
        ];
        game.config.quests.completed = [];
        // Reset skills
        for (const key in game.config.skills.tree) {
            game.config.skills.tree[key].currentLevel = 0;
        }

        // Mock functions to isolate tests
        checkLevelUpSpy = jest.spyOn(game, 'checkLevelUp').mockImplementation(() => {});
        applySkillEffectsSpy = jest.spyOn(game, 'applySkillEffects').mockImplementation(() => {});
    });

    afterEach(() => {
        // Restore original implementations
        checkLevelUpSpy.mockRestore();
        applySkillEffectsSpy.mockRestore();
    });

    describe('checkLevelUp', () => {
        beforeEach(() => {
            // For this specific suite, we want the real implementation
            checkLevelUpSpy.mockRestore();
        });

        it('should increase player level when XP threshold is met', () => {
            game.config.level = 1;
            game.config.xp = 100; // XP needed for level 2 is 1*100
            game.checkLevelUp();
            expect(game.config.level).toBe(2);
            expect(game.config.xp).toBe(0);
            expect(game.config.skillPoints).toBe(1);
        });

        it('should not level up if XP is insufficient', () => {
            game.config.level = 1;
            game.config.xp = 99;
            game.checkLevelUp();
            expect(game.config.level).toBe(1);
            expect(game.config.skillPoints).toBe(0);
        });

        it('should handle sequential level ups', () => {
            game.config.level = 1;
            game.config.xp = 350; // Enough for level 2 (100xp) and level 3 (200xp)
            game.checkLevelUp();
            expect(game.config.level).toBe(2);
            expect(game.config.xp).toBe(250); // 350 - 100
            game.checkLevelUp();
            expect(game.config.level).toBe(3);
            expect(game.config.xp).toBe(50); // 250 - 200
            expect(game.config.skillPoints).toBe(2);
        });
    });

    describe('updateQuest', () => {
        it('should update quest progress', () => {
            game.updateQuest('absorb100', 10);
            const quest = game.config.quests.active.find(q => q.id === 'absorb100');
            expect(quest.current).toBe(10);
        });

        it('should complete a quest when the target is reached', () => {
            const quest = game.config.quests.active.find(q => q.id === 'absorb100');
            quest.current = 99;
            game.updateQuest('absorb100', 1);
            expect(game.config.quests.completed).toContain('absorb100');
            expect(game.config.quests.active.find(q => q.id === 'absorb100')).toBeUndefined();
            expect(game.config.xp).toBe(quest.reward);
            // checkLevelUp is mocked, so it should have been called
            expect(checkLevelUpSpy).toHaveBeenCalled();
        });
    });

    describe('upgradeSkill', () => {
        it('should upgrade a skill if player has enough skill points', () => {
            game.config.skillPoints = 3;
            game.upgradeSkill('attractRadius'); // Cost is 2
            const skill = game.config.skills.tree.attractRadius;
            expect(skill.currentLevel).toBe(1);
            expect(game.config.skillPoints).toBe(1);
            // applySkillEffects is mocked, so it should have been called
            expect(applySkillEffectsSpy).toHaveBeenCalled();
        });

        it('should not upgrade a skill if player has insufficient skill points', () => {
            game.config.skillPoints = 1;
            game.upgradeSkill('attractRadius'); // Cost is 2
            const skill = game.config.skills.tree.attractRadius;
            expect(skill.currentLevel).toBe(0);
            expect(game.config.skillPoints).toBe(1);
        });

        it('should not upgrade a skill beyond its max level', () => {
            game.config.skillPoints = 20;
            const skill = game.config.skills.tree.attractRadius;
            for (let i = 0; i < skill.maxLevel; i++) {
                game.upgradeSkill('attractRadius');
            }
            expect(skill.currentLevel).toBe(skill.maxLevel);
            game.upgradeSkill('attractRadius'); // Try to upgrade again
            expect(skill.currentLevel).toBe(skill.maxLevel);
        });
    });
});
