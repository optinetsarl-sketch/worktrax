"""Generate WORKTRAX documentation screenshots."""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

BASE = "http://localhost:3000"
OUT = Path("/app/docs/screenshots")
OUT.mkdir(parents=True, exist_ok=True)


async def login_as(page, role_label):
    await page.goto(f"{BASE}/login", wait_until="networkidle")
    await page.wait_for_selector('[data-testid="login-role"]')
    await page.select_option('[data-testid="login-role"]', label=role_label)
    await asyncio.sleep(0.3)
    await page.click('[data-testid="login-submit"]')


async def shot(page, name, full=False):
    await asyncio.sleep(0.6)
    await page.screenshot(path=str(OUT / f"{name}.png"), full_page=full)
    print(f"  ✓ {name}.png")


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(viewport={"width": 1600, "height": 900})
        page = await ctx.new_page()

        # 01-02 Login
        await page.goto(f"{BASE}/login", wait_until="networkidle")
        await page.wait_for_selector('[data-testid="login-screen"]')
        await shot(page, "01-login")
        await page.click('[data-testid="toggle-pwd"]')
        await shot(page, "02-login-password-visible")

        # 03 Admin Dashboard
        await page.click('[data-testid="login-submit"]')
        await page.wait_for_selector('[data-testid="kpi-grid"]', timeout=15000)
        await shot(page, "03-dashboard-admin", full=True)

        # 04 Ouvriers list
        await page.click('[data-testid="nav-ouvriers"]')
        await page.wait_for_selector('[data-testid="workers-table"]')
        await shot(page, "04-ouvriers-liste", full=True)

        # 05 Filter Maçon
        await page.click('[data-testid="cat-Maçon"]')
        await shot(page, "05-ouvriers-filtre-macon")
        await page.click('[data-testid="cat-Tous"]')

        # 06-08 Add worker steps
        await page.click('[data-testid="add-worker-btn"]')
        await page.wait_for_selector('[data-testid="modal-add-worker"]')
        await page.fill('[data-testid="form-name"]', "Yao Doc")
        await page.fill('[data-testid="form-phone"]', "+228 90 88 77 66")
        await shot(page, "06-ajout-ouvrier-etape1")
        await page.click('[data-testid="next-step1"]')
        await shot(page, "07-ajout-ouvrier-etape2-visage")
        await page.click('[data-testid="next-step2"]')
        await page.click('[data-testid="enroll-fingerprint"]')
        await shot(page, "08-ajout-ouvrier-etape3-empreinte")
        await page.keyboard.press("Escape")

        # 09-11 Engins
        await page.goto(f"{BASE}/engins", wait_until="networkidle")
        await page.wait_for_selector('[data-testid="tab-trucks"]')
        await shot(page, "09-engins-camions", full=True)
        await page.click('[data-testid="tab-machines"]')
        await shot(page, "10-engins-machines", full=True)
        await page.click('[data-testid="tab-fuel"]')
        await shot(page, "11-engins-carburant")

        # 12 Pointage
        await page.goto(f"{BASE}/pointage", wait_until="networkidle")
        await shot(page, "12-pointage-journal")

        # 13 Caméras
        await page.goto(f"{BASE}/cameras", wait_until="networkidle")
        await asyncio.sleep(1.2)
        await shot(page, "13-cameras", full=True)

        # 14-15 Absences / Paie
        await page.goto(f"{BASE}/absences", wait_until="networkidle")
        await shot(page, "14-absences")
        await page.goto(f"{BASE}/paie", wait_until="networkidle")
        await shot(page, "15-paie")

        # 16 Rapports
        await page.goto(f"{BASE}/rapports", wait_until="networkidle")
        await asyncio.sleep(1.2)
        await shot(page, "16-rapports", full=True)

        # 17-18 Utilisateurs
        await page.goto(f"{BASE}/utilisateurs", wait_until="networkidle")
        await page.wait_for_selector('[data-testid="users-table"]')
        await shot(page, "17-utilisateurs")
        await page.click('[data-testid="add-user-btn"]')
        await page.wait_for_selector('[data-testid="user-modal"]')
        await shot(page, "18-utilisateurs-add")

        # 19-20 Contrôleur (initial + non reconnu)
        await login_as(page, "Contrôleur")
        await page.wait_for_selector('[data-testid="finger-scanner"]')
        await shot(page, "19-controleur-terminal")
        await page.click('[data-testid="scan-btn"]')
        await asyncio.sleep(3)  # wait for scan to finish, then capture result
        await shot(page, "20-controleur-resultat-scan")

        # 21-22 Pompiste
        await login_as(page, "Pompiste")
        await page.wait_for_selector('[data-testid="plate-input"]')
        await shot(page, "21-pompiste-initial", full=True)
        await page.fill('[data-testid="plate-input"]', "TG-2024-001")
        await asyncio.sleep(0.5)
        await page.click('[data-testid="preset-80"]')
        await page.click('[data-testid="btn-bio-chauf"]')
        await page.click('[data-testid="btn-bio-pomp"]')
        await shot(page, "22-pompiste-validation", full=True)

        # 23 RH
        await login_as(page, "RH")
        await page.wait_for_selector('.role-banner.rh')
        await shot(page, "23-rh-dashboard", full=True)

        # 24 Superviseur
        await login_as(page, "Superviseur")
        await page.wait_for_selector('.role-banner.superviseur')
        await shot(page, "24-superviseur-dashboard", full=True)

        await browser.close()
        print("\n✅ Toutes les captures sont dans /app/docs/screenshots/")


asyncio.run(main())
