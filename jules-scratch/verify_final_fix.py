import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    # Garante que o diretório de verificação exista
    output_dir = "jules-scratch/verification"
    os.makedirs(output_dir, exist_ok=True)

    # Lista para armazenar mensagens de erro do console
    console_errors = []

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Função para capturar erros do console
        page.on("console", lambda msg:
            console_errors.append(f"[{msg.type}] {msg.text}") if msg.type in ['error', 'warning'] else None
        )

        try:
            # Navega para a página do jogo servida localmente
            await page.goto("http://localhost:8000/game.html", timeout=60000)

            # Espera um tempo para o jogo carregar e a primeira onda de inimigos aparecer
            await page.wait_for_timeout(5000)

            # Tira a captura de tela
            screenshot_path = os.path.join(output_dir, "verification_final.png")
            await page.screenshot(path=screenshot_path)

            print(f"Captura de tela salva em: {screenshot_path}")

        except Exception as e:
            print(f"Ocorreu um erro durante a execução do Playwright: {e}")

        finally:
            await browser.close()

            # Imprime os erros capturados
            if console_errors:
                print("\n--- Erros/Avisos no Console Encontrados ---")
                for error in console_errors:
                    print(error)
                print("------------------------------------------")
                # Lança um erro para indicar falha na verificação se houver erros críticos
                raise Exception("Erros encontrados no console do navegador.")
            else:
                print("\n--- Verificação Concluída: Nenhum erro encontrado no console. ---")


if __name__ == "__main__":
    asyncio.run(main())
