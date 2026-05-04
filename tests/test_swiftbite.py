"""
Single UI test for SwiftBite (Selenium + Chrome).

Run from the Project folder:
  python3 -m venv .venv && source .venv/bin/activate   # Windows: .venv\\Scripts\\activate
  pip install -r requirements.txt
  pytest tests/test_swiftbite.py -v

Requires Google Chrome installed. Selenium 4.6+ downloads a matching ChromeDriver automatically.
Tests run headless by default; use SELENIUM_HEADLESS=0 to see the browser window.
"""

import os
from pathlib import Path

import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

PROJECT_ROOT = Path(__file__).resolve().parent.parent


@pytest.fixture
def driver():
    options = webdriver.ChromeOptions()
    options.add_argument("--window-size=420,900")
    # Headless by default (CI / no display). Set SELENIUM_HEADLESS=0 to watch the browser.
    if os.environ.get("SELENIUM_HEADLESS", "1") != "0":
        options.add_argument("--headless=new")
    browser = webdriver.Chrome(options=options)
    yield browser
    browser.quit()


def test_login_navigates_to_dashboard(driver):
    """Valid credentials submit and app redirects to the dashboard after the demo delay."""
    index_url = PROJECT_ROOT.joinpath("index.html").as_uri()
    driver.get(index_url)

    driver.find_element(By.CSS_SELECTOR, 'input[type="text"]').send_keys("user@test.com")
    driver.find_element(By.CSS_SELECTOR, 'input[type="password"]').send_keys("password123")
    driver.find_element(By.CSS_SELECTOR, "button.btn").click()

    WebDriverWait(driver, 5).until(
        EC.url_contains("dashboard.html")
    )
