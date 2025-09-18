# Universo de Partículas 🌌

Bem-vindo ao Universo de Partículas! Este é um jogo de sobrevivência espacial 2D onde você controla uma entidade cósmica com o poder de manipular partículas e inimigos. Sobreviva a ondas de adversários, suba de nível, desbloqueie habilidades e enfrente chefes poderosos para se tornar o mestre do universo.

## 🎮 Como Jogar

O controle do jogo é simples e intuitivo:

-   **Mover:** O seu personagem segue o cursor do mouse.
-   **Atração (Segure '1' ou clique esquerdo):** Atrai partículas e inimigos para perto de você. Inimigos presos no seu raio de atração sofrem dano contínuo.
-   **Repulsão (Segure '2' ou clique direito):** Empurra partículas e inimigos para longe.
-   **Vórtice (Segure '3'):** Cria um vórtice orbital que puxa inimigos e partículas em uma espiral, causando dano.
-   **Menu (Pressione 'M'):** Abre e fecha o menu do jogo. O jogo pausa enquanto o menu está aberto.

O objetivo é absorver partículas para ganhar XP, subir de nível e fortalecer seu personagem para sobreviver ao maior número de ondas possível.

## ✨ Funcionalidades Principais

-   **Sistema de Níveis e XP:** Absorva partículas para ganhar experiência e subir de nível, até o nível máximo de 50.
-   **Árvore de Habilidades:** Gaste pontos de habilidade ganhos a cada nível para desbloquear e melhorar status como raio de atração, dano do vórtice e vida máxima.
-   **Inimigos Diversificados:** Enfrente uma variedade de inimigos, cada um com comportamentos únicos:
    -   **Rápidos:** Inimigos básicos que se movem rapidamente.
    -   **Caçadores (Hunters):** Mantêm distância e disparam projéteis.
    -   **Cósmicos:** Atravessam o mapa em linha reta como meteoros, imunes à sua atração.
    -   **Atiradores (Shooters):** Unidades estáticas que disparam projéteis explosivos.
-   **Batalhas de Chefe:** A cada 10 níveis, um Chefe poderoso aparece. No nível 50, prepare-se para o Chefe Final!
-   **Power-Ups:** Colete partículas douradas especiais para ganhar um bônus temporário de dano e alcance.
-   **Customização:** Personalize sua experiência de jogo!
    -   **Galáxias:** Desbloqueie e selecione diferentes fundos de tela.
    -   **Skins:** Altere a aparência do seu personagem.
    -   **Áudio e Imagens:** Substitua facilmente os arquivos de áudio e imagem para deixar o jogo com a sua cara.

## 🛠️ Como o Código Funciona (Estrutura)

O código do jogo foi organizado de forma modular para ser fácil de entender e modificar. Todos os arquivos principais estão na pasta `js/`:

-   `game.js`: O coração do jogo. Controla o loop principal, a física, a renderização e a inicialização de tudo.
-   `config.js`: O painel de controle do jogo. Aqui você pode ajustar quase tudo: status do jogador, tipos de inimigos, chances de spawn, habilidades, etc.
-   `state.js`: Gerencia o estado dinâmico do jogo, como as posições atuais de inimigos, partículas e projéteis.
-   `ui.js`: Controla a interface do usuário. Qualquer coisa relacionada a menus, barras de vida/XP e painéis é gerenciada aqui.
-   `enemy.js`: Define a lógica de como os inimigos nascem (spawn) e se comportam (IA).
-   `particle.js`: Gerencia as partículas de XP e as partículas hostis dos ataques de chefe.
-   `projectile.js`: Controla os projéteis disparados pelos inimigos.
-   `explosion.js`: Gerencia a lógica e a renderização das explosões.
-   `audio.js`: Controla a reprodução de músicas de fundo.
-   `utils.js`: Contém funções úteis, como o sistema de efeitos sonoros.

## 🎨 Como Customizar

Deixei o projeto preparado para que você possa customizar facilmente os sons e as imagens.

### Áudio

1.  Navegue até a pasta `assets/audio/`.
2.  Você verá uma lista de arquivos `.mp3` (ex: `main_theme.mp3`, `hit.mp3`).
3.  Para usar seus próprios sons, simplesmente **substitua** esses arquivos pelos seus, **mantendo os nomes dos arquivos exatamente os mesmos**.

### Imagens de Fundo e de Chefes

1.  **Imagens de Fundo:**
    -   Coloque seu arquivo de imagem na pasta `assets/images/`.
    -   Abra o arquivo `js/config.js`.
    -   Encontre a seção `galaxies` e, para a galáxia que deseja alterar, mude a linha `background` para: `background: "url('assets/images/SEU_ARQUIVO.jpg')"`

2.  **Imagens dos Chefes:**
    -   Coloque sua imagem na pasta `assets/images/`.
    -   Abra o arquivo `js/config.js`.
    -   Encontre a seção `enemySystem.types`, e localize `boss` e `finalBoss`.
    -   Mude a propriedade `imageUrl` de `null` para o caminho da sua imagem: `imageUrl: 'assets/images/SEU_CHEFE.png'`
