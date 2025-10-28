
import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

        await page.goto("http://localhost:8000/game.html")

        # Wait for a few seconds to let the game loop run
        await page.wait_for_timeout(5000)

        await page.screenshot(path="jules-scratch/verification/verification.png")

        await browser.close()

        if console_errors:
            print("Console errors found:")
            for error in console_errors:
                print(error)
            raise Exception("Console errors detected during verification.")

if __name__ == "__main__":
    asyncio.run(main())
