"""WORKTRAX backend integration tests."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8000").rstrip("/")
API = f"{BASE_URL}/api"

CREDS = {
    "admin": ("admin@optinet.tg", "admin123"),
    "superviseur": ("superviseur@optinet.tg", "super123"),
    "rh": ("rh@optinet.tg", "rh123"),
    "controleur": ("controleur@optinet.tg", "ctrl123"),
    "pompiste": ("pompiste@optinet.tg", "pomp123"),
}


def _login(email, password):
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=15)
    return r


@pytest.fixture(scope="session")
def tokens():
    out = {}
    for role, (email, pw) in CREDS.items():
        r = _login(email, pw)
        assert r.status_code == 200, f"login {role} failed: {r.status_code} {r.text}"
        out[role] = r.json()["token"]
    return out


def _h(token):
    return {"Authorization": f"Bearer {token}"}


# ── Auth ──
class TestAuth:
    def test_login_each_role(self):
        for role, (email, pw) in CREDS.items():
            r = _login(email, pw)
            assert r.status_code == 200, f"{role}: {r.text}"
            d = r.json()
            assert d["user"]["role"] == role
            assert d["user"]["email"] == email
            assert isinstance(d["token"], str) and len(d["token"]) > 20

    def test_login_invalid(self):
        r = _login("admin@optinet.tg", "wrong")
        assert r.status_code == 401

    def test_me(self, tokens):
        r = requests.get(f"{API}/auth/me", headers=_h(tokens["admin"]), timeout=10)
        assert r.status_code == 200
        assert r.json()["role"] == "admin"

    def test_me_no_token(self):
        r = requests.get(f"{API}/auth/me", timeout=10)
        assert r.status_code == 401


# ── Workers ──
class TestWorkers:
    def test_list_workers_admin(self, tokens):
        r = requests.get(f"{API}/workers", headers=_h(tokens["admin"]), timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 30, f"expected 30+ workers, got {len(data)}"
        # No _id leakage
        assert all("_id" not in w for w in data)

    def test_filter_workers(self, tokens):
        r = requests.get(f"{API}/workers", headers=_h(tokens["admin"]),
                         params={"category": "Maçon", "status": "present"}, timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert all(w["category"] == "Maçon" and w["status"] == "present" for w in data)
        assert len(data) >= 1

    def test_get_worker_detail(self, tokens):
        r = requests.get(f"{API}/workers", headers=_h(tokens["admin"]), timeout=10)
        wid = r.json()[0]["id"]
        r2 = requests.get(f"{API}/workers/{wid}", headers=_h(tokens["admin"]), timeout=10)
        assert r2.status_code == 200
        d = r2.json()
        for key in ("attendance", "absences", "payroll", "id", "name"):
            assert key in d

    def test_create_worker_admin(self, tokens):
        payload = {"name": "TEST Ouvrier", "phone": "+228 90 00 00 00",
                   "category": "Maçon", "site": "Lomé-Agoè", "structure": "EBOMAF"}
        r = requests.post(f"{API}/workers", headers=_h(tokens["admin"]), json=payload, timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert d["name"] == "TEST Ouvrier"
        assert "id" in d
        # Verify persisted
        g = requests.get(f"{API}/workers/{d['id']}", headers=_h(tokens["admin"]), timeout=10)
        assert g.status_code == 200
        # Cleanup
        requests.delete(f"{API}/workers/{d['id']}", headers=_h(tokens["admin"]), timeout=10)

    def test_create_worker_forbidden_rh(self, tokens):
        payload = {"name": "X", "phone": "x", "category": "Maçon", "site": "Lomé-Agoè", "structure": "EBOMAF"}
        r = requests.post(f"{API}/workers", headers=_h(tokens["rh"]), json=payload, timeout=10)
        assert r.status_code == 403

    def test_create_worker_forbidden_controleur(self, tokens):
        payload = {"name": "X", "phone": "x", "category": "Maçon", "site": "Lomé-Agoè", "structure": "EBOMAF"}
        r = requests.post(f"{API}/workers", headers=_h(tokens["controleur"]), json=payload, timeout=10)
        assert r.status_code == 403


# ── Equipment ──
class TestEquipment:
    def test_list_equipment(self, tokens):
        r = requests.get(f"{API}/equipment", headers=_h(tokens["admin"]), timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert len(data) >= 28

    def test_filter_truck(self, tokens):
        r = requests.get(f"{API}/equipment", headers=_h(tokens["admin"]),
                         params={"type": "truck"}, timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert all(e["type"] == "truck" for e in data)
        assert len(data) >= 12

    def test_filter_machine(self, tokens):
        r = requests.get(f"{API}/equipment", headers=_h(tokens["admin"]),
                         params={"type": "machine"}, timeout=10)
        assert r.status_code == 200
        assert len(r.json()) >= 16


# ── Attendance ──
class TestAttendance:
    def test_attendance_today(self, tokens):
        r = requests.get(f"{API}/attendance/today", headers=_h(tokens["admin"]), timeout=10)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_scan_creates_attendance_and_updates_status(self, tokens):
        # Pick an absent worker so we can detect status change
        r = requests.get(f"{API}/workers", headers=_h(tokens["admin"]),
                         params={"status": "absent"}, timeout=10)
        workers = r.json()
        if not workers:
            pytest.skip("No absent worker to test")
        wid = workers[0]["id"]
        r2 = requests.post(f"{API}/attendance/scan", headers=_h(tokens["controleur"]),
                           json={"worker_id": wid, "type": "entry", "method": "fingerprint"}, timeout=10)
        assert r2.status_code == 200, r2.text
        d = r2.json()
        assert d["worker_id"] == wid
        assert d["type"] == "entry"
        # Verify worker status now present
        g = requests.get(f"{API}/workers/{wid}", headers=_h(tokens["admin"]), timeout=10)
        assert g.json()["status"] == "present"

    def test_scan_forbidden_for_pompiste(self, tokens):
        r = requests.post(f"{API}/attendance/scan", headers=_h(tokens["pompiste"]),
                          json={"worker_id": "x", "type": "entry"}, timeout=10)
        assert r.status_code == 403


# ── Fuel ──
class TestFuel:
    def test_list_fuel_today(self, tokens):
        r = requests.get(f"{API}/fuel", headers=_h(tokens["pompiste"]),
                         params={"period": "today"}, timeout=10)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_create_fuel_pompiste(self, tokens):
        # Use a known seed plate
        payload = {"equipment_id": "ignored", "plate": "TG-2024-001",
                   "liters": 50, "site": "Lomé-Agoè", "chauffeur_name": "TEST"}
        r = requests.post(f"{API}/fuel", headers=_h(tokens["pompiste"]), json=payload, timeout=10)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["liters"] == 50
        assert d["plate"] == "TG-2024-001"
        assert "id" in d

    def test_create_fuel_forbidden_rh(self, tokens):
        r = requests.post(f"{API}/fuel", headers=_h(tokens["rh"]),
                          json={"equipment_id": "x", "plate": "TG-2024-001", "liters": 10, "site": "X"}, timeout=10)
        assert r.status_code == 403


# ── Absences ──
class TestAbsences:
    def test_list_absences(self, tokens):
        r = requests.get(f"{API}/absences", headers=_h(tokens["rh"]), timeout=10)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_create_absence_rh(self, tokens):
        r = requests.get(f"{API}/workers", headers=_h(tokens["admin"]),
                         params={"status": "present"}, timeout=10)
        wid = r.json()[0]["id"]
        payload = {"worker_id": wid, "type": "maladie",
                   "date_from": "2026-01-15", "date_to": "2026-01-20", "days": 5}
        r2 = requests.post(f"{API}/absences", headers=_h(tokens["rh"]), json=payload, timeout=10)
        assert r2.status_code == 200, r2.text
        assert r2.json()["worker_id"] == wid
        # Verify worker status mapped to 'malade'
        g = requests.get(f"{API}/workers/{wid}", headers=_h(tokens["admin"]), timeout=10)
        assert g.json()["status"] == "malade"


# ── Payroll ──
class TestPayroll:
    def test_payroll_admin(self, tokens):
        r = requests.get(f"{API}/payroll", headers=_h(tokens["admin"]), timeout=10)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_payroll_rh(self, tokens):
        r = requests.get(f"{API}/payroll", headers=_h(tokens["rh"]), timeout=10)
        assert r.status_code == 200

    def test_payroll_forbidden_pompiste(self, tokens):
        r = requests.get(f"{API}/payroll", headers=_h(tokens["pompiste"]), timeout=10)
        assert r.status_code == 403


# ── Dashboards ──
class TestDashboards:
    def test_admin_dashboard(self, tokens):
        r = requests.get(f"{API}/dashboard/admin", headers=_h(tokens["admin"]), timeout=10)
        assert r.status_code == 200
        d = r.json()
        for k in ("workers", "equipment", "total_hours_month", "categories",
                  "activities", "productivity", "sites_usage"):
            assert k in d, f"missing {k}"
        assert d["workers"]["total"] >= 30
        assert d["equipment"]["total"] >= 28

    def test_superviseur_dashboard(self, tokens):
        r = requests.get(f"{API}/dashboard/superviseur", headers=_h(tokens["superviseur"]), timeout=10)
        assert r.status_code == 200
        assert r.json()["site"] == "Lomé-Agoè"

    def test_rh_dashboard(self, tokens):
        r = requests.get(f"{API}/dashboard/rh", headers=_h(tokens["rh"]), timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert "absences" in d and "payroll" in d

    def test_pompiste_dashboard(self, tokens):
        r = requests.get(f"{API}/dashboard/pompiste", headers=_h(tokens["pompiste"]), timeout=10)
        assert r.status_code == 200
        assert "today_count" in r.json()

    def test_controleur_dashboard(self, tokens):
        r = requests.get(f"{API}/dashboard/controleur", headers=_h(tokens["controleur"]), timeout=10)
        assert r.status_code == 200
        assert r.json()["site"] == "Lomé-Agoè"
