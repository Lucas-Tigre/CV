import os
import random
import string
from playwright.sync_api import sync_playwright

def random_string(length=10):
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(length))

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()

    # Generate random user credentials
    random_username = random_string()
    email = f"{random_username}@example.com"
    password = "password123"

    # Go to the login page
    page.goto(f"file://{os.getcwd()}/login.html")
    page.screenshot(path="jules-scratch/verification/01_login_page.png")

    # Go to the registration page
    register_tab = page.locator('button[data-tab="register-pane"]')
    register_tab.click()

    # Wait for the registration form to be visible
    register_pane = page.locator("#register-pane")
    register_pane.wait_for(state="visible")
    page.screenshot(path="jules-scratch/verification/02_register_page.png")

    # Fill out the registration form
    page.fill("#regNome", "Test User")
    page.fill("#regEmail", email)
    page.fill("#regUsuario", random_username)
    page.fill("#regSenha", password)
    page.click("#registerForm button[type=submit]")
    page.screenshot(path="jules-scratch/verification/03_after_registration.png")

    # Wait for the login form to be visible after registration
    login_pane = page.locator("#login-pane")
    login_pane.wait_for(state="visible")

    # Fill out the login form
    page.fill("#loginUser", email)
    page.fill("#loginPass", password)
    page.click("#loginForm button[type=submit]")

    # Wait for the game to load
    page.wait_for_url(f"file://{os.getcwd()}/game.html", timeout=60000)

    # Take a screenshot of the game page
    page.screenshot(path="jules-scratch/verification/04_game_page.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
