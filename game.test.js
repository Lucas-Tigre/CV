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
        <div id="coop-status">OFF</div>
        <div id="game-over-screen" style="display: none;">
            <div id="go-level"></div>
            <div id="go-wave"></div>
            <div id="go-particles"></div>
            <div id="go-enemies"></div>
        </div>
    `;
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
});

describe('Original Game Logic', () => {
    let config;
    let enemies;
    let particles;

    beforeEach(() => {
        // Deep copy config to isolate tests
        config = JSON.parse(JSON.stringify(game.config));
        // Manually assign to the imported module's config
        Object.assign(game.config, config);

        // Reset global arrays
        game.enemies.length = 0;
        enemies = game.enemies;
        game.particles.length = 0;
        particles = game.particles;

        // Set default player position
        game.config.players[0].x = 500;
        game.config.players[0].y = 500;
    });

    describe('Enemy System', () => {
        it('should spawn an enemy', () => {
            expect(enemies.length).toBe(0);
            game.spawnEnemy();
            expect(enemies.length).toBe(1);
            expect(enemies[0]).toHaveProperty('health');
        });
    });

    describe('Player Progression', () => {
        it('should level up when XP threshold is met', () => {
            game.config.level = 1;
            game.config.xp = 100;
            game.checkLevelUp();
            expect(game.config.level).toBe(2);
            expect(game.config.xp).toBe(0);
            expect(game.config.skillPoints).toBe(1);
        });

        it('should complete a quest and receive XP', () => {
            const checkLevelUpSpy = jest.spyOn(game, 'checkLevelUp').mockImplementation(() => {});
            game.config.quests.active = [{ id: 'test_quest', target: 1, current: 0, reward: 50 }];
            game.updateQuest('test_quest', 1);
            expect(game.config.quests.completed).toContain('test_quest');
            expect(game.config.xp).toBe(50);
            expect(checkLevelUpSpy).toHaveBeenCalled();
            checkLevelUpSpy.mockRestore();
        });
    });

    describe('Player Modes', () => {
        it('should set player mode to attract', () => {
            game.setPlayerMode('attract');
            expect(game.config.players[0].mode).toBe('attract');
        });

        it('should attract particles when in attract mode', () => {
            game.setPlayerMode('attract');
            const player = game.config.players[0];
            const particle = { x: player.x + 10, y: player.y + 10, speedX: 0, speedY: 0 };
            particles.push(particle);

            const initialSpeedX = particle.speedX;
            game.updateParticles(16.67);
            expect(particle.speedX).not.toBe(initialSpeedX);
        });

        it('should repel particles when in repel mode', () => {
            game.setPlayerMode('repel');
            const player = game.config.players[0];
            const particle = { x: player.x + 10, y: player.y + 10, speedX: 0, speedY: 0 };
            particles.push(particle);

            const initialSpeedX = particle.speedX;
            game.updateParticles(16.67);
            expect(particle.speedX).toBeLessThan(initialSpeedX);
        });
    });

    describe('Co-op Mode', () => {
        it('should toggle co-op mode and activate player 2', () => {
            expect(game.config.coopMode).toBe(false);
            expect(game.config.players[1].active).toBe(false);

            game.toggleCoopMode();

            expect(game.config.coopMode).toBe(true);
            expect(game.config.players[1].active).toBe(true);
        });
    });
});
