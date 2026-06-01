"""Seed demo data for WORKTRAX matching the mockup."""
from datetime import datetime, timezone, timedelta
import uuid

SITES = ["Lomé-Agoè", "Kégué", "Baguida", "Adéwui", "Tsévié"]
STRUCTURES = ["EBOMAF", "Cabinet AGBO", "KOFFI BTP", "SODJI", "AMEGAH"]
SITE_COORDS = {
    "Lomé-Agoè": {"lat": 6.1725, "lng": 1.2314},
    "Kégué": {"lat": 6.1451, "lng": 1.2624},
    "Baguida": {"lat": 6.1824, "lng": 1.3389},
    "Adéwui": {"lat": 6.1510, "lng": 1.2264},
    "Tsévié": {"lat": 6.4261, "lng": 1.2131},
}

# 30 ouvriers répartis sur catégories/sites
WORKERS = [
    # Conducteurs
    {"name": "Koffi Mensah", "phone": "+228 90 11 22 33", "category": "Conducteur", "site": "Lomé-Agoè", "structure": "EBOMAF", "hours_month": 164, "status": "present", "color": "#1a3c5e", "contract": "CDI"},
    {"name": "Agbeko Tetteh", "phone": "+228 90 12 34 56", "category": "Conducteur", "site": "Baguida", "structure": "EBOMAF", "hours_month": 152, "status": "present", "color": "#0284c7", "contract": "CDI"},
    {"name": "Edem Klutse", "phone": "+228 90 23 45 67", "category": "Conducteur", "site": "Kégué", "structure": "EBOMAF", "hours_month": 140, "status": "absent", "color": "#0369a1", "contract": "CDD"},
    # Maçons
    {"name": "Jean Dupont", "phone": "+228 90 44 55 66", "category": "Maçon", "site": "Kégué", "structure": "EBOMAF", "hours_month": 148, "status": "present", "color": "#f97316", "contract": "CDI"},
    {"name": "Kokou Amegavi", "phone": "+228 90 55 11 22", "category": "Maçon", "site": "Lomé-Agoè", "structure": "EBOMAF", "hours_month": 162, "status": "present", "color": "#ea580c", "contract": "CDI"},
    {"name": "Fati Dossou", "phone": "+228 90 33 44 55", "category": "Maçon", "site": "Adéwui", "structure": "Cabinet AGBO", "hours_month": 120, "status": "malade", "color": "#c2410c", "contract": "CDD"},
    {"name": "Felix Amega", "phone": "+228 90 11 33 55", "category": "Maçon", "site": "Lomé-Agoè", "structure": "EBOMAF", "hours_month": 156, "status": "present", "color": "#16a34a", "contract": "CDI"},
    # Électriciens
    {"name": "Ama Koudjo", "phone": "+228 90 77 88 99", "category": "Électricien", "site": "Baguida", "structure": "KOFFI BTP", "hours_month": 92, "status": "malade", "color": "#16a34a", "contract": "CDD"},
    {"name": "Dodzi Mensah", "phone": "+228 90 66 77 88", "category": "Électricien", "site": "Kégué", "structure": "EBOMAF", "hours_month": 145, "status": "present", "color": "#15803d", "contract": "CDI"},
    {"name": "Sena Akowuah", "phone": "+228 90 99 00 11", "category": "Électricien", "site": "Lomé-Agoè", "structure": "EBOMAF", "hours_month": 138, "status": "absent", "color": "#166534", "contract": "CDI"},
    # Manœuvres
    {"name": "Yao Agboh", "phone": "+228 90 10 20 30", "category": "Manœuvre", "site": "Lomé-Agoè", "structure": "EBOMAF", "hours_month": 160, "status": "present", "color": "#64748b", "contract": "Journalier"},
    {"name": "Tété Akpene", "phone": "+228 90 20 30 40", "category": "Manœuvre", "site": "Baguida", "structure": "EBOMAF", "hours_month": 155, "status": "present", "color": "#475569", "contract": "Journalier"},
    {"name": "Gnon Medenou", "phone": "+228 90 30 40 50", "category": "Manœuvre", "site": "Adéwui", "structure": "SODJI", "hours_month": 88, "status": "conge", "color": "#334155", "contract": "CDD"},
    {"name": "Kofi Akakpo", "phone": "+228 90 40 50 60", "category": "Manœuvre", "site": "Lomé-Agoè", "structure": "EBOMAF", "hours_month": 145, "status": "blesse", "color": "#475569", "contract": "CDI"},
    # Ferrailleurs
    {"name": "Brice Sodji", "phone": "+228 90 22 33 44", "category": "Ferrailleur", "site": "Lomé-Agoè", "structure": "EBOMAF", "hours_month": 176, "status": "conge", "color": "#7c3aed", "contract": "CDI"},
    {"name": "Komi Klutse", "phone": "+228 90 44 33 22", "category": "Ferrailleur", "site": "Kégué", "structure": "EBOMAF", "hours_month": 165, "status": "present", "color": "#6d28d9", "contract": "CDI"},
    # Plombiers
    {"name": "Mawuli Nuko", "phone": "+228 90 88 99 00", "category": "Plombier", "site": "Adéwui", "structure": "EBOMAF", "hours_month": 156, "status": "present", "color": "#0284c7", "contract": "CDI"},
    {"name": "Lili Paka", "phone": "+228 90 77 66 55", "category": "Plombier", "site": "Baguida", "structure": "AMEGAH", "hours_month": 112, "status": "absent", "color": "#0369a1", "contract": "CDD"},
    # Peintres
    {"name": "Yawa Togbe", "phone": "+228 90 55 66 77", "category": "Peintre", "site": "Kégué", "structure": "Cabinet AGBO", "hours_month": 80, "status": "absent", "color": "#dc2626", "contract": "Journalier"},
    {"name": "Etonam Agbo", "phone": "+228 90 66 55 44", "category": "Peintre", "site": "Lomé-Agoè", "structure": "EBOMAF", "hours_month": 95, "status": "present", "color": "#b91c1c", "contract": "CDD"},
    # Pompistes
    {"name": "Pascal Petevi", "phone": "+228 90 11 00 22", "category": "Pompiste", "site": "Lomé-Agoè", "structure": "EBOMAF", "hours_month": 168, "status": "present", "color": "#d97706", "contract": "CDI"},
    {"name": "Akpene Zankli", "phone": "+228 90 22 11 33", "category": "Pompiste", "site": "Baguida", "structure": "EBOMAF", "hours_month": 160, "status": "present", "color": "#b45309", "contract": "CDI"},
    {"name": "Ama Sodzi", "phone": "+228 90 33 22 44", "category": "Pompiste", "site": "Kégué", "structure": "EBOMAF", "hours_month": 172, "status": "present", "color": "#f97316", "contract": "CDI"},
    {"name": "Akpene Bawa", "phone": "+228 90 44 22 55", "category": "Pompiste", "site": "Baguida", "structure": "EBOMAF", "hours_month": 168, "status": "present", "color": "#0284c7", "contract": "CDI"},
    {"name": "Komi Dossou", "phone": "+228 90 55 22 66", "category": "Pompiste", "site": "Lomé-Agoè", "structure": "EBOMAF", "hours_month": 165, "status": "present", "color": "#16a34a", "contract": "CDI"},
    {"name": "Sena Agbo", "phone": "+228 90 66 22 77", "category": "Pompiste", "site": "Adéwui", "structure": "EBOMAF", "hours_month": 158, "status": "absent", "color": "#7c3aed", "contract": "CDI"},
    # Plus
    {"name": "Yao Akakpo", "phone": "+228 90 77 22 88", "category": "Conducteur", "site": "Kégué", "structure": "EBOMAF", "hours_month": 170, "status": "present", "color": "#1a3c5e", "contract": "CDI"},
    {"name": "Kodjo Aziato", "phone": "+228 90 88 22 99", "category": "Conducteur", "site": "Lomé-Agoè", "structure": "EBOMAF", "hours_month": 145, "status": "blesse", "color": "#0284c7", "contract": "CDI"},
    {"name": "Kossi Adou", "phone": "+228 90 99 22 11", "category": "Conducteur", "site": "Baguida", "structure": "EBOMAF", "hours_month": 158, "status": "present", "color": "#0369a1", "contract": "CDI"},
    {"name": "Biossey Komi", "phone": "+228 90 11 88 33", "category": "Conducteur", "site": "Kégué", "structure": "EBOMAF", "hours_month": 152, "status": "present", "color": "#1a3c5e", "contract": "CDI"},
]

# Camions (12)
TRUCKS = [
    {"name": "Camion benne", "icon": "🚛", "plate": "TG-2024-001", "site": "Lomé-Agoè", "operator_name": "Koffi Mensah", "fuel_month": 420, "last_service": "2026-04-15", "status": "active"},
    {"name": "Camion grue", "icon": "🏗️", "plate": "TG-2024-002", "site": "Kégué", "operator_name": "Yao Akakpo", "fuel_month": 380, "last_service": "2026-04-10", "status": "active"},
    {"name": "Camion remorque banane (ciment)", "icon": "🍌", "plate": "TG-2024-003", "site": "Lomé-Agoè", "operator_name": "Kodjo Aziato", "fuel_month": 510, "last_service": "2026-04-08", "status": "maintenance"},
    {"name": "Camion Klein clair (graviers)", "icon": "🪨", "plate": "TG-2024-004", "site": "Baguida", "operator_name": "Kossi Adou", "fuel_month": 460, "last_service": "2026-04-20", "status": "active"},
    {"name": "Camion de bitume", "icon": "🛣️", "plate": "TG-2024-005", "site": "Adéwui", "operator_name": "Felix Amega", "fuel_month": 490, "last_service": "2026-04-25", "status": "active"},
    {"name": "Camion plateau", "icon": "🚛", "plate": "TG-2024-006", "site": "Tsévié", "operator_name": "Mawuli Nuko", "fuel_month": 350, "last_service": "2026-04-18", "status": "active"},
    {"name": "Camion béton toupie", "icon": "🌀", "plate": "TG-2024-007", "site": "Lomé-Agoè", "operator_name": "Jean Dupont", "fuel_month": 440, "last_service": "2026-05-05", "status": "active"},
    {"name": "Camion grand citerne gazole", "icon": "⛽", "plate": "TG-2024-008", "site": "Kégué", "operator_name": "Ama Sodzi", "fuel_month": 0, "last_service": "2026-04-01", "status": "active"},
    {"name": "Camion petit citerne gazole", "icon": "⛽", "plate": "TG-2024-009", "site": "Baguida", "operator_name": "Akpene Bawa", "fuel_month": 0, "last_service": "2026-04-12", "status": "active"},
    {"name": "Camion citerne à eau", "icon": "💧", "plate": "TG-2024-010", "site": "Adéwui", "operator_name": "Sena Agbo", "fuel_month": 280, "last_service": "2026-04-22", "status": "active"},
    {"name": "Camion Sol ciment", "icon": "🧱", "plate": "TG-2024-011", "site": "Tsévié", "operator_name": None, "fuel_month": 0, "last_service": "2026-04-28", "status": "inactive"},
    {"name": "Voiture pick-up", "icon": "🚙", "plate": "TG-2024-012", "site": "Tous sites", "operator_name": "Superviseur", "fuel_month": 120, "last_service": "2026-05-02", "status": "active"},
]

# Machines (16)
MACHINES = [
    {"name": "Bulldozer", "icon": "🏔️", "ref": "CAT D6T", "site": "Lomé-Agoè", "operator_name": "Agbeko Tetteh", "hours_month": 280, "next_service": "2026-06-20", "status": "active"},
    {"name": "Chargeuse", "icon": "🔄", "ref": "Volvo L90H", "site": "Kégué", "operator_name": "Biossey Komi", "hours_month": 248, "next_service": "2026-06-15", "status": "active"},
    {"name": "Grader (Niveleuse)", "icon": "📐", "ref": "Komatsu GD655", "site": "Adéwui", "operator_name": "Yao Akakpo", "hours_month": 312, "next_service": "2026-06-10", "status": "active"},
    {"name": "Compacteur", "icon": "🔨", "ref": "Bomag BW213", "site": "Baguida", "operator_name": None, "hours_month": 0, "next_service": None, "status": "maintenance"},
    {"name": "Rouleau lisse", "icon": "🛞", "ref": "Dynapac CA250", "site": "Lomé-Agoè", "operator_name": "Esso Koffi", "hours_month": 196, "next_service": "2026-06-18", "status": "active"},
    {"name": "Finisseur", "icon": "🛣️", "ref": "Volvo P7820C", "site": "Tsévié", "operator_name": "Dodzi Agbeko", "hours_month": 224, "next_service": "2026-06-25", "status": "active"},
    {"name": "Recycleuse", "icon": "♻️", "ref": "Wirtgen WR2400", "site": "Adéwui", "operator_name": "Kafui Amega", "hours_month": 160, "next_service": "2026-06-30", "status": "active"},
    {"name": "Pelle (Excavatrice)", "icon": "⛏️", "ref": "CAT 320", "site": "Lomé-Agoè", "operator_name": "Koffi Mensah", "hours_month": 336, "next_service": "2026-06-08", "status": "active"},
    {"name": "Concasseur", "icon": "🪨", "ref": "Metso C110", "site": "Baguida", "operator_name": "Selom Dossou", "hours_month": 288, "next_service": "2026-06-12", "status": "active"},
    {"name": "Foreuse", "icon": "🔩", "ref": "Atlas Copco T45", "site": "Kégué", "operator_name": "Komi Agbo", "hours_month": 144, "next_service": "2026-06-22", "status": "active"},
    {"name": "PPM Élévateur (Grue mobile)", "icon": "🏗️", "ref": "Liebherr LTM1060", "site": "Lomé-Agoè", "operator_name": "Felix Dede", "hours_month": 208, "next_service": "2026-06-05", "status": "active"},
    {"name": "Machine d'enrobé", "icon": "🌑", "ref": "Ammann ABP120", "site": "Tsévié", "operator_name": "Nana Agbeko", "hours_month": 176, "next_service": "2026-06-28", "status": "active"},
    {"name": "Centrale à Béton", "icon": "🏭", "ref": "Liebherr Mobilmix", "site": "Lomé-Agoè", "operator_name": "Togbe Atcholi", "hours_month": 320, "next_service": "2026-06-02", "status": "active"},
    {"name": "Groupe électrogène", "icon": "⚡", "ref": "Cummins C550D5", "site": "Tous sites", "operator_name": None, "hours_month": 0, "next_service": "2026-06-14", "status": "active"},
    {"name": "Tractopelle", "icon": "🚜", "ref": "JCB 3CX", "site": "Kégué", "operator_name": "Amewu Koffi", "hours_month": 264, "next_service": "2026-06-16", "status": "maintenance"},
    {"name": "Tombereau (Dumper)", "icon": "🪨", "ref": "Caterpillar 740", "site": "Baguida", "operator_name": "Kpabi Messan", "hours_month": 240, "next_service": "2026-06-19", "status": "inactive"},
]


def make_avatar_initials(name: str) -> str:
    parts = name.strip().split()
    if len(parts) >= 2:
        return (parts[0][0] + parts[1][0]).upper()
    return name[:2].upper()


def make_user_doc(
    email: str,
    password_hash: str,
    name: str,
    role: str,
    site: str | None = None,
    assigned_site: str | None = None,
) -> dict:
    doc = {
        "id": str(uuid.uuid4()),
        "email": email.lower(),
        "password_hash": password_hash,
        "name": name,
        "role": role,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    if site:
        doc["site"] = site
    if assigned_site:
        doc["assigned_site"] = assigned_site
    return doc


def make_worker_docs() -> list:
    docs = []
    today = datetime.now(timezone.utc)
    tiny_png_b64 = (
        "data:image/png;base64,"
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
    )
    for idx, w in enumerate(WORKERS):
        contract_end = None
        if w["contract"] == "CDD":
            contract_end = (today + timedelta(days=30 + (idx % 90))).date().isoformat()
        elif w["contract"] == "Journalier":
            contract_end = (today + timedelta(days=15 + (idx % 30))).date().isoformat()
        docs.append({
            "id": str(uuid.uuid4()),
            "name": w["name"],
            "phone": w["phone"],
            "category": w["category"],
            "site": w["site"],
            "structure": w["structure"],
            "hours_month": w["hours_month"],
            "status": w["status"],
            "color": w["color"],
            "initials": make_avatar_initials(w["name"]),
            "contract": w["contract"],
            "contract_end": contract_end,
            "cnss": f"TG{1000 + idx:06d}",
            "recruited_at": (today - timedelta(days=365 + idx * 30)).isoformat(),
            "birth_date": (today - timedelta(days=365 * (25 + (idx % 20)))).isoformat(),
            "address": f"Quartier {w['site']}, Togo",
            "email": w["name"].lower().replace(" ", ".").replace("é", "e").replace("è", "e") + "@worker.tg",
            "photo_url": None,
            "fingerprint_id": f"FP{str(uuid.uuid4())[:8]}",
            "fingerprint_enrolled": True,
            "face_image_b64": tiny_png_b64,
            "face_descriptor": None,
            "days_worked": w["hours_month"] // 8,
            "total_paid": w["hours_month"] * 1500,
            "payments_count": (today.month - 1) or 1,
            "created_at": today.isoformat(),
        })
    return docs


def make_equipment_docs(workers_by_name: dict) -> list:
    docs = []
    today = datetime.now(timezone.utc).isoformat()
    for i, t in enumerate(TRUCKS, 1):
        op_id = workers_by_name.get(t["operator_name"], {}).get("id") if t.get("operator_name") else None
        docs.append({
            "id": str(uuid.uuid4()),
            "type": "truck",
            "number": f"{i:02d}",
            "name": t["name"],
            "icon": t["icon"],
            "plate": t["plate"],
            "ref": t["plate"],
            "site": t["site"],
            "operator_id": op_id,
            "operator_name": t["operator_name"],
            "fuel_month": t["fuel_month"],
            "hours_month": 0,
            "last_service": t["last_service"],
            "next_service": None,
            "status": t["status"],
            "created_at": today,
        })
    for i, m in enumerate(MACHINES, 1):
        op_id = workers_by_name.get(m["operator_name"], {}).get("id") if m.get("operator_name") else None
        docs.append({
            "id": str(uuid.uuid4()),
            "type": "machine",
            "number": f"{i:02d}",
            "name": m["name"],
            "icon": m["icon"],
            "plate": m["ref"],
            "ref": m["ref"],
            "site": m["site"],
            "operator_id": op_id,
            "operator_name": m["operator_name"],
            "fuel_month": 0,
            "hours_month": m["hours_month"],
            "last_service": None,
            "next_service": m["next_service"],
            "status": m["status"],
            "created_at": today,
        })
    return docs


def make_attendance_docs(workers: list) -> list:
    """Generate attendance entries for today."""
    docs = []
    today = datetime.now(timezone.utc)
    base = today.replace(hour=7, minute=0, second=0, microsecond=0)
    for i, w in enumerate(workers):
        if w["status"] != "present":
            continue
        entry_time = base + timedelta(minutes=(i * 3) % 60)
        late = max(0, int((entry_time - base).total_seconds() / 60) - 15)
        site_coords = SITE_COORDS.get(w["site"], {"lat": 6.1725, "lng": 1.2314})
        lat = site_coords["lat"] + ((i % 5) - 2) * 0.0009
        lng = site_coords["lng"] + ((i % 7) - 3) * 0.0007
        docs.append({
            "id": str(uuid.uuid4()),
            "worker_id": w["id"],
            "worker_name": w["name"],
            "type": "entry",
            "timestamp": entry_time.isoformat(),
            "method": "fingerprint",
            "controller_id": "ctrl_001",
            "controller_name": "Kofi Akuetteh",
            "site": w["site"],
            "latitude": round(lat, 6),
            "longitude": round(lng, 6),
            "late_minutes": late,
        })
    return docs


def make_absence_docs(workers: list) -> list:
    today = datetime.now(timezone.utc)
    docs = []
    declared = {
        "declared_by_id": "seed_rh_001",
        "declared_by_name": "Sarah RH",
        "declared_by_role": "rh",
    }
    for w in workers:
        if w["status"] == "malade":
            docs.append({
                "id": str(uuid.uuid4()),
                "worker_id": w["id"],
                "worker_name": w["name"],
                "worker_category": w["category"],
                "type": "maladie",
                "date_from": (today - timedelta(days=2)).isoformat(),
                "date_to": (today + timedelta(days=3)).isoformat(),
                "days": 5,
                "justificatif": True,
                "statut": "en_cours",
                "created_at": today.isoformat(),
                **declared,
            })
        elif w["status"] == "conge":
            docs.append({
                "id": str(uuid.uuid4()),
                "worker_id": w["id"],
                "worker_name": w["name"],
                "worker_category": w["category"],
                "type": "conge_paye",
                "date_from": (today - timedelta(days=5)).isoformat(),
                "date_to": (today + timedelta(days=10)).isoformat(),
                "days": 15,
                "justificatif": True,
                "statut": "valide",
                "created_at": today.isoformat(),
                **declared,
            })
        elif w["status"] == "blesse":
            docs.append({
                "id": str(uuid.uuid4()),
                "worker_id": w["id"],
                "worker_name": w["name"],
                "worker_category": w["category"],
                "type": "accident_travail",
                "date_from": (today - timedelta(days=7)).isoformat(),
                "date_to": None,
                "days": 0,
                "justificatif": True,
                "statut": "suivi_medical",
                "created_at": today.isoformat(),
                **declared,
            })
        elif w["status"] == "absent":
            docs.append({
                "id": str(uuid.uuid4()),
                "worker_id": w["id"],
                "worker_name": w["name"],
                "worker_category": w["category"],
                "type": "injustifiee",
                "date_from": today.isoformat(),
                "date_to": today.isoformat(),
                "days": 1,
                "justificatif": False,
                "statut": "non_reglee",
                "created_at": today.isoformat(),
                **declared,
            })
    return docs


def make_fuel_docs(workers: list, equipment: list) -> list:
    today = datetime.now(timezone.utc)
    base = today.replace(hour=7, minute=45, second=0, microsecond=0)
    pompistes = [w for w in workers if w["category"] == "Pompiste" and w["status"] == "present"]
    trucks = [e for e in equipment if e["type"] == "truck" and e["status"] == "active"][:6]
    machines = [e for e in equipment if e["type"] == "machine" and e["status"] == "active"][:5]
    targets = trucks + machines
    docs = []
    qtys = [80, 60, 95, 75, 110, 120, 90, 65, 100, 85, 70]
    for i, eq in enumerate(targets):
        if not pompistes:
            continue
        pp = pompistes[i % len(pompistes)]
        ts = base + timedelta(minutes=i * 35)
        docs.append({
            "id": str(uuid.uuid4()),
            "timestamp": ts.isoformat(),
            "pompiste_id": pp["id"],
            "pompiste_name": pp["name"],
            "equipment_id": eq["id"],
            "equipment_name": eq["name"],
            "plate": eq["plate"],
            "chauffeur_name": eq["operator_name"] or "—",
            "liters": qtys[i % len(qtys)],
            "site": eq["site"],
            "unit_price": 580,
        })
    return docs


def make_payroll_docs(workers: list) -> list:
    docs = []
    today = datetime.now(timezone.utc)
    for w in workers[:15]:
        hourly = 1700 if w["category"] in ["Conducteur", "Ferrailleur"] else 1500
        gross = w["hours_month"] * hourly
        cnss = int(gross * 0.055)
        docs.append({
            "id": str(uuid.uuid4()),
            "worker_id": w["id"],
            "worker_name": w["name"],
            "worker_category": w["category"],
            "month": "2026-04",
            "days": w["hours_month"] // 8,
            "hours": w["hours_month"],
            "gross": gross,
            "cnss": cnss,
            "net": gross - cnss,
            "created_at": today.isoformat(),
        })
    return docs
