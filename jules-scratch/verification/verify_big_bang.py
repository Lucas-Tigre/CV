import asyncio
from playwright.sync_api import sync_playwright, expect
import os

def run_verification(page):
    # Constrói o caminho absoluto para o game.html
    file_path = "file://" + os.path.abspath("game.html")
    page.goto(file_path)

    # Espera até que window.config esteja definido, o que sinaliza que o jogo foi inicializado.
    page.wait_for_function("() => window.config !== undefined")

    # Usa page.evaluate para manipular o estado do jogo diretamente
    page.evaluate("""() => {
        // Define a carga do Big Bang como 100%
        window.config.bigBangCharge = 100;

        // Adiciona alguns inimigos para o teste
        const newEnemies = [
            { id: 1, type: 'normal', x: 100, y: 100, health: 50, maxHealth: 50, size: 15 },
            { id: 2, type: 'normal', x: 200, y: 200, health: 50, maxHealth: 50, size: 15 },
            { id: 3, type: 'boss', x: 300, y: 300, health: 200, maxHealth: 200, size: 40 }
        ];
        window.state.setEnemies(newEnemies);
    }""")

    # Pressiona a tecla '4' para ativar o Big Bang
    page.press("body", "4")

    # Espera um pouco para a habilidade ter efeito visual
    page.wait_for_timeout(500)

    # Tira a screenshot
    screenshot_path = "jules-scratch/verification/big_bang_verification.png"
    page.screenshot(path=screenshot_path)

    # Verifica se os inimigos normais foram removidos
    remaining_enemies = page.evaluate("() => window.state.enemies")
    assert len(remaining_enemies) == 1
    assert remaining_enemies[0]['type'] == 'boss'

    return screenshot_path

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            screenshot_path = run_verification(page)
            print(f"Screenshot salvo em: {screenshot_path}")
        finally:
            browser.close()

if __name__ == "__main__":
    main()
