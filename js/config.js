export const config = {
    // =============================================
    // CONFIGURAÇÕES GERAIS DE JOGABILIDADE
    // =============================================
    particleCount: 300, // Número total de partículas no mapa.
    mouseRadius: 150,   // Raio de interação do mouse (não utilizado atualmente).
    particleRespawn: {
        minParticles: 150,     // Se o número de partículas cair abaixo disso, novas partículas são geradas.
        respawnAmount: 50,     // Quantidade de partículas a serem geradas.
        checkInterval: 30      // Intervalo (em frames) para verificar a necessidade de gerar novas partículas.
    },

    // =============================================
    // GALÁXIAS (APARÊNCIA E FUNDOS DE TELA)
    // =============================================
    galaxies: {
        unlocked: ['classic'],
        current: 'classic',
        list: {
            classic: {
                name: "Clássico",
                description: "O universo original de partículas.",
                unlockCondition: "Inicial",
                particleColorRange: { h: [0, 360], s: [80, 90], l: [50, 70] },
                // FUNDO 1: Imagem de fundo para a galáxia Clássico.
                background: "url('assets/images/MapaME.png')"
            },
            neon: {
                name: "Neon",
                description: "Cores vibrantes e partículas brilhantes.",
                unlockCondition: "Alcançar nível 5",
                particleColorRange: { h: [280, 320], s: [100, 100], l: [60, 80] },
                // FUNDO 2: Imagem de fundo para a galáxia Neon.
                background: 'radial-gradient(ellipse at bottom, #0f0c29 0%, #302b63 50%, #24243e 100%)'
            },
            fire: {
                name: "Inferno",
                description: "Partículas flamejantes e inimigos furiosos.",
                unlockCondition: "Derrotar 50 inimigos",
                particleColorRange: { h: [10, 40], s: [80, 100], l: [50, 70] },
                // FUNDO 3: Imagem de fundo para a galáxia Inferno.
                background: 'radial-gradient(ellipse at bottom, #200122 0%, #6f0000 100%)'
            }
        }
    },

    // =============================================
    // CONFIGURAÇÕES DO JOGADOR
    // =============================================
    players: [
        {
            id: 1,
            x: null,
            y: null,
            mode: 'attract',
            color: '#4A00E0',
            radius: 150,
            size: 30,
            face: "🐶",
            faceSize: 28,
            health: 100,
            maxHealth: 100,
            damage: 0.5,             // Dano de colisão com inimigos (não implementado).
            attractionDamage: 0.05,  // Dano por segundo do vórtice de atração.
            isPoweredUp: false,
            powerUpTimer: 0,
        }
    ],

    // =============================================
    // SISTEMA DE INIMIGOS
    // =============================================
    enemySystem: {
        baseHealth: 5,
        baseSize: 20,
        eliteSizeMultiplier: 1.3,
        healthIncreasePerLevel: 0.3,
        types: {
            fast: {
                name: "Rápido",
                chance: 0.55,
                speed: 3.5,
                behavior: 'hunt', // Alterado de 'wander' para 'hunt'
                huntRadius: 500,   // Adicionado raio de perseguição
                face: ["😠", "😡", "😤"],
                color: '#FFDD00',
                healthMultiplier: 0.8
            },
            hunter: {
                name: "Caçador",
                chance: 0.25,
                speed: 2.0,
                behavior: 'huntAndShoot',
                face: ["🎯", "🔫", "💥"],
                color: '#FF9900',
                huntRadius: 500,
                preferredDistance: 250,
                shootCooldown: 120,
                projectileType: 'normal'
            },
            cosmic: {
                name: "Cósmico",
                chance: 0.10,
                speed: 4.5,
                behavior: 'crossScreen',
                face: ["☄️", "🌠"],
                color: '#00AAFF',
                damage: 25,
                ignoresAttraction: true
            },
            shooter: {
                name: "Atirador",
                chance: 0.10,
                speed: 0,
                behavior: 'static',
                face: ["🛰️", "📡"],
                color: '#00FFFF',
                healthMultiplier: 1.2,
                shootCooldown: 180,
                projectileType: 'explosive'
            },
            boss: {
                name: "Chefe",
                chance: 0, // Apenas gerado manualmente.
                speed: 2.5,
                behavior: 'hunt',
                // IMAGEM_CHEFE_1: Substitua null pela URL da imagem do chefe.
                imageUrl: null,
                face: ["😈", "💀", "👹"],
                color: '#FF8C00',
                size: 40,
                health: 200,
                huntRadius: 1000,
            },
            finalBoss: {
                name: "Chefe Final",
                chance: 0, // Apenas gerado manualmente.
                speed: 3.0,
                behavior: 'hunt',
                // IMAGEM_CHEFE_2: Substitua null pela URL da imagem do chefe final.
                imageUrl: null,
                face: ["🔥", "💥", "☄️"],
                color: '#DC143C',
                size: 60,
                health: 600,
                huntRadius: 2000,
            }
        }
    },

    // =============================================
    // ÁRVORE DE HABILIDADES
    // =============================================
    skills: {
        tree: {
            attractRadius: {
                name: "Raio de Atração",
                cost: 2,
                maxLevel: 5,
                effect: "Aumenta o raio de atração em 20% por nível.",
                currentLevel: 0
            },
            vortexPower: {
                name: "Poder do Vórtice",
                cost: 3,
                maxLevel: 3,
                effect: "Aumenta o dano do vórtice em 30% por nível.",
                currentLevel: 0
            },
            healthBoost: {
                name: "Vitalidade",
                cost: 1,
                maxLevel: 10,
                effect: "Aumenta a saúde máxima em 10% por nível.",
                currentLevel: 0
            },
            particleMastery: {
                name: "Domínio de Partículas",
                cost: 4,
                maxLevel: 3,
                effect: "Partículas dão 20% mais XP por nível.",
                currentLevel: 0,
                requires: ["attractRadius:3"]
            }
        }
    },

    // =============================================
    // ESTADO INICIAL DO JOGO
    // =============================================
    xp: 0,
    level: 1,
    skillPoints: 0,
    soundEnabled: false,
    gamePaused: false,
    particlesAbsorbed: 0,
    enemiesDestroyed: 0,
    gameTime: 0,
    wave: { number: 1, enemiesToSpawn: 5, spawned: 0, timer: 0 },
    bigBangCharge: 0,
    bigBangChargeRate: 2, // Pontos de carga por inimigo derrotado.

    // =============================================
    // OUTRAS CONFIGURAÇÕES
    // =============================================
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),

    quests: {
        active: [
            { id: 'absorb100', target: 100, current: 0, reward: 50, title: "Absorver 100 partículas" },
            { id: 'defeat20', target: 20, current: 0, reward: 100, title: "Derrotar 20 inimigos" },
            { id: 'wave5', target: 5, current: 1, reward: 200, title: "Alcançar onda 5" }
        ],
        completed: []
    },

    soundEffects: {}, // Cache para efeitos sonoros.

    story: {
        enabled: true,
        currentScene: 0,
        scenes: [
            {
                npc: "👁️",
                text: "MORTAL... VOCÊ OUSA INVADIR MEU UNIVERSO?",
                background: "radial-gradient(ellipse at center, #200122 0%, #6f0000 100%)",
                effect: "terror"
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
                shake: true
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
            "Os inimigos estão rindo de você... literalmente.",
            "Você é lento... mas pelo menos é consistente.",
            "Sabia que cada galáxia tem suas próprias leis da física? Divertido, né?",
            "Eu já vi jogadores melhores... mas também vi piores.",
            "Quer um conselho? Não confie nas partículas roxas.",
            "Já perdi a conta de quantos universos eu vi serem destruídos...",
            "Você está evoluindo... mas ainda tem muito o que aprender.",
            "As habilidades que você desbloqueia são só a ponta do iceberg!",
            "Os inimigos estão ficando mais fortes... ou você que está ficando mais fraco?",
            "Você nota como o universo reage às suas ações? Interessante..."
        ],
        bossDialog: "🏆 PARABÉNS! Agora o verdadeiro desafio começa... 🐉"
    },

    skins: {
        available: [
            { id: 'default', name: 'Viajante', emoji: '🐶', type: 'normal', unlocked: true },
            { id: 'cosmic', name: 'Ser Cósmico', emoji: '👽', type: 'premium', unlocked: false, unlockCondition: 'Alcançar nível 10' },
            { id: 'nebula', name: 'Nebulosa', emoji: '🌌', type: 'normal', unlocked: true },
            { id: 'blackhole', name: 'Buraco Negro', emoji: '⚫', type: 'premium', unlocked: false, unlockCondition: 'Derrotar 100 inimigos' },
            { id: 'ancient', name: 'Antigo', emoji: '👁️', type: 'premium', unlocked: false, unlockCondition: 'Completar todas as missões' }
        ],
        current: 'default'
    }
};