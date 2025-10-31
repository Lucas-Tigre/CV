
import asyncio
import http.server
import socketserver
import threading
import time
from playwright.async_api import async_playwright, expect

PORT = 8000
# Usamos um sinalizador para saber quando o servidor está pronto
server_started = threading.Event()

def run_server():
    """Função para rodar um servidor HTTP simples em um diretório."""
    Handler = http.server.SimpleHTTPRequestHandler
    # Tenta criar o servidor na porta especificada
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Servidor HTTP rodando na porta {PORT}")
        server_started.set()  # Sinaliza que o servidor está pronto
        httpd.serve_forever()

async def main():
    """Função principal que executa o teste de verificação com Playwright."""
    # Inicia o servidor em uma thread separada para não bloquear o script
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()

    # Espera o servidor iniciar antes de continuar
    server_started.wait(timeout=5)
    if not server_started.is_set():
        print("Erro: O servidor demorou muito para iniciar.")
        return

    async with async_playwright() as p:
        # Inicia o navegador (headless=False para visualização)
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Adiciona um listener para capturar erros do console
        page.on("console", lambda msg: print(f"CONSOLE BROWSER: {msg.text}"))

        try:
            # Navega para a página do jogo
            await page.goto(f"http://localhost:{PORT}/game.html", timeout=10000)

            # Espera um elemento do jogo carregar para garantir que a UI está pronta
            await expect(page.locator("#health-bar")).to_be_visible(timeout=5000)
            print("INFO: Jogo carregado, UI visível.")

            # --- Início da Lógica de Teste ---

            # 1. Avalia o estado inicial do jogo
            initial_state = await page.evaluate('''() => {
                // Expor temporariamente o estado para o teste
                window.state = import('./js/state.js');
                window.config = import('./js/config.js');

                return Promise.all([window.state, window.config]).then(([stateModule, configModule]) => {
                    return {
                        health: configModule.config.players[0].health,
                        particles: configModule.config.particlesAbsorbed
                    };
                });
            }''')
            print(f"INFO: Estado inicial - Vida: {initial_state['health']}, Partículas: {initial_state['particles']}")

            # Garante que o jogador começa com a vida cheia
            assert initial_state['health'] > 0, "Erro: Vida inicial do jogador é zero."

            # 2. Simula uma colisão forçando a criação de um inimigo na posição do jogador
            await page.evaluate('''() => {
                Promise.all([window.state, window.config, import('./js/enemy.js')]).then(([stateModule, configModule, enemyModule]) => {
                    const player = configModule.config.players[0];
                    // Move o jogador para uma posição previsível
                    player.x = 300;
                    player.y = 300;

                    // Cria um inimigo "Hunter" exatamente na mesma posição
                    const hunter = enemyModule.spawnEnemy('hunter', configModule.config, player);
                    hunter.x = player.x;
                    hunter.y = player.y;

                    // Adiciona o inimigo ao estado do jogo
                    stateModule.setEnemies([hunter]);
                });
            }''')

            # 3. Espera um tempo para que a colisão seja processada
            print("INFO: Aguardando processamento da colisão...")
            await asyncio.sleep(1.0) # Aumenta o tempo para garantir que múltiplos frames passem

            # 4. Avalia o estado final do jogo
            final_state = await page.evaluate('''() => {
                 return Promise.all([window.state, window.config]).then(([stateModule, configModule]) => {
                    return {
                        health: configModule.config.players[0].health,
                        particles: configModule.config.particlesAbsorbed,
                        bigBang: configModule.config.bigBangCharge,
                        enemies: stateModule.enemies.length
                    };
                });
            }''')
            print(f"INFO: Estado final - Vida: {final_state['health']}, Partículas: {final_state['particles']}, BigBang: {final_state['bigBang']}")

            # --- Verificações Finais ---

            # Verifica se o jogador sofreu dano
            assert final_state['health'] < initial_state['health'], f"FALHA: O jogador não sofreu dano! Vida inicial: {initial_state['health']}, Vida final: {final_state['health']}"
            print("SUCESSO: O jogador sofreu dano como esperado.")

            # Verifica se as partículas foram contadas e o Big Bang carregou
            # O inimigo foi derrotado pela colisão, então deve dropar XP/partículas e carga
            assert final_state['bigBang'] > 0, f"FALHA: O Big Bang não carregou! Carga: {final_state['bigBang']}"
            print("SUCESSO: O Big Bang carregou após derrotar o inimigo.")

            # A contagem de partículas absorvidas é mais complexa, pois elas precisam ser coletadas
            # A verificação mais importante é o dano e a carga do Big Bang

            print("\nVERIFICAÇÃO CONCLUÍDA COM SUCESSO!")

        except Exception as e:
            print(f"\nERRO DURANTE A VERIFICAÇÃO: {e}")
            raise  # Re-lança a exceção para que o script falhe
        finally:
            # Garante que o navegador seja fechado
            await browser.close()
            # O servidor daemon será encerrado quando o script principal terminar

if __name__ == "__main__":
    asyncio.run(main())
