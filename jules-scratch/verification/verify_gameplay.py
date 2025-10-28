from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Navega para a página do jogo
    page.goto("http://localhost:8080/game.html")

    # Espera um elemento do jogo aparecer para garantir que a página carregou
    page.wait_for_selector("#canvas")

    # Espera 5 segundos para o jogo rodar e os elementos aparecerem
    page.wait_for_timeout(5000)

    # Tira um screenshot
    page.screenshot(path="jules-scratch/verification/verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
