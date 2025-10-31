
import asyncio
from playwright.async_api import async_playwright
import subprocess
import os

async def main():
    server_process = subprocess.Popen(['python3', '-m', 'http.server', '8000'])
    print("Servidor iniciado.")

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()

            page.on('console', lambda msg: print(f'CONSOLE: {msg.text}'))

            await page.goto('http://localhost:8000/game.html')
            await page.wait_for_selector('#canvas', state='visible')
            print("Jogo carregado.")

            # Espera até que pelo menos um inimigo apareça
            await page.wait_for_function('window.state.enemies.length > 0')
            print("Inimigo detectado no jogo.")

            # Pega os valores iniciais
            initial_health = await page.evaluate('window.config.players[0].health')
            initial_big_bang_charge = await page.evaluate('window.config.bigBangCharge')
            print(f"Vida Inicial: {initial_health}")
            print(f"Carga Inicial do Big Bang: {initial_big_bang_charge}")

            # Pega as coordenadas do primeiro inimigo
            enemy_coords = await page.evaluate('({ x: window.state.enemies[0].x, y: window.state.enemies[0].y })')
            print(f"Coordenadas do inimigo: {enemy_coords}")

            # FORÇA A COLISÃO: Move o jogador para as coordenadas do inimigo
            await page.evaluate(f'''
                window.config.players[0].x = {enemy_coords['x']};
                window.config.players[0].y = {enemy_coords['y']};
            ''')
            print("Jogador movido para forçar a colisão.")

            # Aguarda 5 segundos para o loop do jogo processar a colisão e a possível morte
            await asyncio.sleep(5)

            # Pega os valores finais
            final_health = await page.evaluate('window.config.players[0].health')
            final_big_bang_charge = await page.evaluate('window.config.bigBangCharge')
            print(f"Vida Final: {final_health}")
            print(f"Carga Final do Big Bang: {final_big_bang_charge}")

            screenshot_dir = 'jules-scratch/verification'
            os.makedirs(screenshot_dir, exist_ok=True)
            screenshot_path = os.path.join(screenshot_dir, 'verification_forced_collision_no_heal.png')
            await page.screenshot(path=screenshot_path)
            print(f"Screenshot salvo em: {screenshot_path}")

            await browser.close()

            errors = []
            if final_health >= initial_health:
                errors.append("ERRO: O jogador não sofreu dano após a colisão forçada.")

            if final_big_bang_charge <= initial_big_bang_charge:
                 errors.append("ERRO: A carga do Big Bang não aumentou após a morte do inimigo.")

            if not errors:
                print("\nVERIFICAÇÃO BEM-SUCEDIDA!")
                print("-> O jogador sofreu dano como esperado.")
                print("-> A carga do Big Bang aumentou como esperado.")
            else:
                for error in errors:
                    print(error)
                exit(1)

    finally:
        server_process.terminate()
        print("Servidor encerrado.")

if __name__ == '__main__':
    asyncio.run(main())
