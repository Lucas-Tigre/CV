
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        try:
            # Go to the game page
            await page.goto("http://localhost:8000/game.html")

            # Wait for the game canvas to be visible to ensure the game has loaded
            await page.wait_for_selector("#canvas", state="visible")

            # Let the game run for a few seconds to ensure enemies have spawned
            await asyncio.sleep(5)

            # Take a screenshot
            screenshot_path = "jules-scratch/verification/final_verification.png"
            await page.screenshot(path=screenshot_path)
            print(f"Screenshot saved to {screenshot_path}")

        except Exception as e:
            print(f"An error occurred: {e}")
        finally:
            await browser.close()

asyncio.run(main())
