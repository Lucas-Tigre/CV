
import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Lista para armazenar as mensagens de erro do console
        error_messages = []
        page.on("console", lambda msg: error_messages.append(msg.text) if msg.type == "error" else None)

        await page.goto("http://localhost:8000/game.html")

        # Aguarda 10 segundos para o jogo rodar
        await asyncio.sleep(10)

        await browser.close()

        # Verifica se alguma mensagem de erro foi capturada
        if error_messages:
            print("Erros encontrados no console:")
            for error in error_messages:
                print(error)
            # Retorna um código de saída diferente de zero para indicar falha
            exit(1)
        else:
            print("Nenhum erro encontrado no console. A verificação foi um sucesso!")

if __name__ == "__main__":
    asyncio.run(main())
