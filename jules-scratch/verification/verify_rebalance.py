
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        try:
            # Navigate to the index page
            await page.goto("http://localhost:8000/index.html", timeout=60000)

            # Click the button to go to the login page
            await page.locator("#start-adventure-btn").click()
            await page.wait_for_url("**/login.html")

            # Click the guest mode button to open the confirmation modal
            await page.locator("#guestModeBtn").click()

            # Wait for the modal to be visible and click the confirmation button
            await page.locator("#guestConfirmBtn").wait_for(state="visible")
            async with page.expect_navigation():
                 await page.locator("#guestConfirmBtn").click()

            # Wait for the game to load by checking for the correct wave indicator ID
            await page.wait_for_selector("#stat-wave", timeout=10000)

            # Wait for 5 seconds to show the initial gameplay with rebalanced difficulty
            await page.wait_for_timeout(5000)

            # Take screenshot
            await page.screenshot(path="jules-scratch/verification/verification.png")
            print("Screenshot taken successfully.")

        except Exception as e:
            print(f"An error occurred: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
