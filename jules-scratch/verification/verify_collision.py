import asyncio
from playwright.async_api import async_playwright
import http.server
import socketserver
import threading
import os
import sys

PORT = 8000
# Obtém o diretório do script e, a partir dele, o diretório raiz do projeto.
# Isso garante que o servidor sirva a partir da raiz, independentemente de onde o script é chamado.
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, '..', '..'))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # O diretório é definido como a raiz do projeto.
        super().__init__(*args, directory=PROJECT_ROOT, **kwargs)

def run_server(server_started_event):
    # Usamos TCPServer para permitir a reutilização do endereço, o que evita o erro 'Address already in use'
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving at http://localhost:{PORT}")
        server_started_event.set() # Sinaliza que o servidor está pronto
        httpd.serve_forever()

async def main():
    server_started_event = threading.Event()
    server_thread = threading.Thread(target=run_server, args=(server_started_event,))
    server_thread.daemon = True
    server_thread.start()

    # Espera o servidor sinalizar que está pronto
    server_started_event.wait(5)
    if not server_started_event.is_set():
        print("Erro: Servidor demorou muito para iniciar.")
        sys.exit(1)


    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Ouve os logs do console para ajudar na depuração
        page.on("console", lambda msg: print(f"LOG DO CONSOLE: {msg.text}"))

        try:
            await page.goto(f"http://localhost:{PORT}/game.html", timeout=10000)
            await page.wait_for_selector('#canvas', state='visible', timeout=5000)
            print("Canvas visível. Aguardando inimigos...")

            # Espera um tempo para os inimigos aparecerem e se moverem
            await page.wait_for_timeout(3000)

            initial_health = await page.evaluate("() => window.config.players[0].health")
            print(f"Vida inicial: {initial_health}")

            # Move o mouse para o centro para atrair inimigos
            viewport = page.viewport_size
            await page.mouse.move(viewport['width'] / 2, viewport['height'] / 2)
            print("Mouse movido para o centro.")

            health_after_collision = initial_health
            collision_detected = False

            # Verifica a vida do jogador por 5 segundos para detectar uma colisão
            print("Verificando colisão...")
            for _ in range(25): # Tenta por 5 segundos (25 * 200ms)
                health_after_collision = await page.evaluate("() => window.config.players[0].health")
                if health_after_collision < initial_health:
                    collision_detected = True
                    break
                await page.wait_for_timeout(200)

            if not collision_detected:
                raise Exception("FALHA NA VERIFICAÇÃO: A colisão não ocorreu no tempo esperado.")

            print(f"Vida após colisão: {health_after_collision}")

            if health_after_collision > 0:
                print("SUCESSO: O jogador sobreviveu à colisão.")
            else:
                raise Exception("FALHA NA VERIFICAÇÃO: O jogador morreu instantaneamente.")

            await page.screenshot(path="jules-scratch/verification/verification.png")
            print("Screenshot de sucesso gerada.")

        except Exception as e:
            print(f"Ocorreu um erro no script de verificação: {e}")
            await page.screenshot(path="jules-scratch/verification/verification_failure.png")
            # Re-lança a exceção para que o processo principal saiba que falhou
            raise
        finally:
            await browser.close()
            # O servidor é um daemon e será encerrado

if __name__ == "__main__":
    asyncio.run(main())
