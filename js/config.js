export const config = {
    particleCount: 300, // Aumentado de 150
    mouseRadius: 150,
    particleRespawn: {
        minParticles: 150,  // Aumentado de 50
        respawnAmount: 50, // Aumentado de 20
        checkInterval: 30  // Reduzido de 60 para checagens mais frequentes
    },
    galaxies: {
        unlocked: ['classic'],
        current: 'classic',
        list: {
            classic: {
                name: "Clássico",
                description: "O universo original de partículas",
                unlockCondition: "Inicial",
                particleColorRange: { h: [0, 360], s: [80, 90], l: [50, 70] },
                background: 'radial-gradient(ellipse at bottom, #1B2735 0%, #090A0F 100%)'
            },
            neon: {
                name: "Neon",
                description: "Cores vibrantes e partículas brilhantes",
                unlockCondition: "Alcançar nível 5",
                particleColorRange: { h: [280, 320], s: [100, 100], l: [60, 80] },
                background: 'radial-gradient(ellipse at bottom, #0f0c29 0%, #302b63 50%, #24243e 100%)'
            },
            fire: {
                name: "Inferno",
                description: "Partículas flamejantes e inimigos furiosos",
                unlockCondition: "Derrotar 50 inimigos",
                particleColorRange: { h: [10, 40], s: [80, 100], l: [50, 70] },
                background: 'radial-gradient(ellipse at bottom, #200122 0%, #6f0000 100%)'
            }
        }
    },
    xp: 0,
    level: 1,
    power: 1,
    health: 100,
    maxHealth: 100,
    bigBang: {
        unlocked: false,
        availableEvery: 15,
        nextUnlockLevel: 15,
        cooldown: 0,
        maxCooldown: 300,
        active: false
    },
    isBigBangActive: false,
    players: [
        {
            id: 1,
            x: null,
            y: null,
            mode: 'attract', // Começar com o modo de atração ativo
            color: '#4A00E0',
            radius: 150,
            size: 30,
            face: "🐶",
            faceSize: 28,
            power: 1,
            health: 100,
            maxHealth: 100,
            active: true,
            lastModeChange: 0,
            damage: 0.5, // Dano de colisão normal
            attractionDamage: 0.5, // Aumentado de 0.2 para acelerar o jogo
            isPoweredUp: false,
            powerUpTimer: 0,
            skills: {
                attractRadius: 1,
                vortexPower: 1,
                doubleVortex: false,
                healthBoost: 1,
                bigBangPower: 1
            }
        }
    ],
    soundEnabled: true,
    gamePaused: false,
    wave: {
        number: 1,
        enemiesToSpawn: 5,
        spawned: 0,
        timer: 0,
        update: function() {
            // This will be handled in the main game loop now
        }
    },
    particlesAbsorbed: 0,
    enemiesDestroyed: 0,
    gameTime: 0,
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    comboCount: 0,
    lastAbsorptionTime: 0,
    screenShakeIntensity: 0,
    enemySystem: {
        spawnRate: 180,
        baseHealth: 5, // Aumentado de 3
        baseSize: 20,
        eliteSizeMultiplier: 1.3,
        healthIncreasePerLevel: 0.3,
        types: {
            normal: {
                chance: 0.6,
                speed: 2.0,
                behavior: 'wander',
                face: [">:(", "X_X", ">_<", ":O"],
                color: '#FF5555'
            },
            hunter: {
                chance: 0.3,
                speed: 3.0,
                behavior: 'hunt',
                face: ["◉_◉", "⊙_⊙", "⚆_⚆"],
                color: '#FF0000',
                huntRadius: 300
            },
            cosmic: {
                chance: 0.1,
                speed: 1.8,
                behavior: 'teleport',
                face: ["☄️", "🌌", "🌠", "✨"],
                special: 'shield',
                color: '#00AAFF',
                teleportChance: 0.008
            },
            boss: {
                chance: 0, // Bosses são spawnados manualmente
                speed: 2.5,
                behavior: 'hunt',
                // TODO: USER - Adicione a URL da sua imagem para o chefe aqui
                imageUrl: null, // Ex: 'https://seusite.com/imagem_chefe.png'
                face: ["😈", "💀", "👹"], // Fallback caso a imagem não carregue
                color: '#FF8C00',
                size: 40,
                health: 200, // Aumentado de 50
                huntRadius: 1000,
            },
            finalBoss: {
                chance: 0, // Spawnado manualmente no nível 50
                speed: 3.0,
                behavior: 'hunt',
                // TODO: USER - Adicione a URL da sua imagem para o chefe final aqui
                imageUrl: null,
                face: ["🔥", "💥", "☄️"], // Fallback
                color: '#DC143C',
                size: 60,
                health: 600, // Aumentado de 150
                huntRadius: 2000,
                special: 'teleport',
                teleportChance: 0.01
            }
        },
        eliteMultiplier: 1.5,
        blackHoleChance: 0.02
    },
    quests: {
        active: [
            { id: 'absorb100', target: 100, current: 0, reward: 50, title: "Absorver 100 partículas" },
            { id: 'defeat20', target: 20, current: 0, reward: 100, title: "Derrotar 20 inimigos" },
            { id: 'wave5', target: 5, current: 1, reward: 200, title: "Alcançar onda 5" }
        ],
        completed: []
    },
    soundEffects: {},
    skills: {
        unlocked: [],
        tree: {
            attractRadius: {
                name: "Raio de Atração",
                cost: 2,
                maxLevel: 5,
                effect: "Aumenta o raio de atração em 20% por nível",
                currentLevel: 0
            },
            vortexPower: {
                name: "Poder do Vórtice",
                cost: 3,
                maxLevel: 3,
                effect: "Aumenta a força do vórtice em 30% por nível",
                currentLevel: 0
            },
            healthBoost: {
                name: "Vitalidade",
                cost: 1,
                maxLevel: 10,
                effect: "Aumenta saúde máxima em 10% por nível",
                currentLevel: 0
            },
            bigBangPower: {
                name: "Big Bang Plus",
                cost: 5,
                maxLevel: 2,
                effect: "Aumenta o XP ganho com Big Bang em 50% por nível",
                currentLevel: 0
            },
            particleMastery: {
                name: "Domínio de Partículas",
                cost: 4,
                maxLevel: 3,
                effect: "Partículas dão 20% mais XP",
                currentLevel: 0,
                requires: ["attractRadius:3"]
            }
        }
    },
    skillPoints: 0,
    story: {
        enabled: true,
        currentScene: 0,
        scenes: [
            {
                npc: "👁️",
                text: "MORTAL... VOCÊ OUSA INVADIR MEU UNIVERSO?",
                background: "radial-gradient(ellipse at center, #200122 0%, #6f0000 100%)",
                effect: "terror" // Ativa modo terror
            },
            {
                npc: "👁️",
                text: "EU SOU AZATHOTH, O DEVORADOR DE GALÁXIAS...",
                background: "radial-gradient(ellipse at center, #000000 0%, #4a0000 100%)",
                effect: "terror"
            },
            {
                npc: "👽",
                text: "*sussurro* Psst... Não olhe diretamente para ele! Use as partículas para se fortalecer...",
                background: "radial-gradient(ellipse at center, #1B2735 0%, #090A0F 100%)",
                effect: "normal"
            },
            {
                npc: "👁️",
                text: "SEU DESTINO É SER DESTRUÍDO COMO TODOS OS OUTROS!",
                background: "radial-gradient(ellipse at center, #300000 0%, #000000 100%)",
                effect: "terror",
                shake: true // Ativa tremor de tela
            }
        ]
    },
    npc: {
        active: true,
        currentDialog: 0,
        dialogs: [
            "Ah, finalmente acordou... Tava demorando, hein?",
            "Olha só, um novato no universo. Vamos ver quanto tempo você dura...",
            "Cuidado com essas partículas, elas são mais espertas do que parecem!",
            "Tá com medo? Eu também estaria...",
            "Se você chegar no nível 50, algo MUITO grande te espera...",
            "Você realmente acha que está no controle? Kkk...",
            "Pressione 1, 2 ou 3... se conseguir lembrar qual é qual.",
            "Já tentou o Big Bang? Ou ainda não é digno?",
            "Os inimigos estão rindo de você... literalmente.",
            "Você é lento... mas pelo menos é consistente.",
            // NOVOS DIÁLOGOS ADICIONADOS:
            "Sabia que cada galáxia tem suas próprias leis da física? Divertido, né?",
            "Eu já vi jogadores melhores... mas também vi piores.",
            "Quer um conselho? Não confie nas partículas roxas.",
            "Já perdi a conta de quantos universos eu vi serem destruídos...",
            "Você está evoluindo... mas ainda tem muito o que aprender.",
            "As habilidades que você desbloqueia são só a ponta do iceberg!",
            "Nível 100? Isso é só o tutorial, meu caro...",
            "Os inimigos estão ficando mais fortes... ou você que está ficando mais fraco?",
            "Você nota como o universo reage às suas ações? Interessante..."
        ],
        bossDialog: "🏆 PARABÉNS! Agora o verdadeiro desafio começa... 🐉"
    },
    skins: {
        available: [
            {
                id: 'default',
                name: 'Viajante',
                emoji: '🐶',
                type: 'normal',
                unlocked: true
            },
            {
                id: 'cosmic',
                name: 'Ser Cósmico',
                emoji: '👽',
                type: 'premium',
                unlocked: false,
                unlockCondition: 'Alcançar nível 10'
            },
            {
                id: 'nebula',
                name: 'Nebulosa',
                emoji: '🌌',
                type: 'normal',
                unlocked: true
            },
            {
                id: 'blackhole',
                name: 'Buraco Negro',
                emoji: '⚫',
                type: 'premium',
                unlocked: false,
                unlockCondition: 'Derrotar 100 inimigos'
            },
            {
                id: 'ancient',
                name: 'Antigo',
                emoji: '👁️',
                type: 'premium',
                unlocked: false,
                unlockCondition: 'Completar todas as missões'
            }
        ],
        current: 'default'
    }
};
