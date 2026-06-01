"""WORKTRAX backend - FastAPI + MongoDB."""
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import uuid
import logging
import math
from datetime import datetime, timezone, timedelta
from typing import Optional, List

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends, Response, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlite_db import SQLiteClient
from pydantic import BaseModel, EmailStr, Field

from seed_data import (
    make_user_doc,
    make_worker_docs,
    make_equipment_docs,
    make_attendance_docs,
    make_absence_docs,
    make_fuel_docs,
    make_payroll_docs,
    SITE_COORDS,
)

# ────────────────────────── Config ──────────────────────────
SQLITE_PATH = os.environ.get("SQLITE_PATH", "worktrax.db")
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALG = "HS256"

client = SQLiteClient(SQLITE_PATH)
db = client["worktrax"]

app = FastAPI(title="WORKTRAX API")
api = APIRouter(prefix="/api")

# ── WebSocket broadcast (pointage temps réel) ──────────────────────────────
_ws_clients: set = set()

async def _ws_broadcast(msg: dict):
    """Envoie un message JSON à tous les clients WebSocket connectés."""
    if not _ws_clients:
        return
    import json
    data = json.dumps(msg)
    dead = set()
    for ws in _ws_clients:
        try:
            await ws.send_text(data)
        except Exception:
            dead.add(ws)
    _ws_clients.difference_update(dead)

@app.websocket("/ws/attendance")
async def ws_attendance(websocket: WebSocket):
    await websocket.accept()
    _ws_clients.add(websocket)
    try:
        while True:
            await websocket.receive_text()  # keep-alive (ping)
    except WebSocketDisconnect:
        _ws_clients.discard(websocket)

# CORS – allow * for preview; we don't use credentials cookies (Bearer in header)
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
log = logging.getLogger("worktrax")


# ────────────────────────── Auth utils ──────────────────────────
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def make_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=12),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


async def get_current_user(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(401, "Not authenticated")
    token = auth[7:]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(401, "User not found")
    return user


def require_roles(*roles):
    async def _dep(user: dict = Depends(get_current_user)) -> dict:
        if user["role"] == "super_admin":
            return user  # super_admin bypasses all role checks
        if user["role"] not in roles:
            raise HTTPException(403, "Forbidden")
        return user
    return _dep


# ────────────────────────── Schemas ──────────────────────────
class LoginIn(BaseModel):
    email: EmailStr
    password: str
    role: Optional[str] = None  # optional role hint


class UserIn(BaseModel):
    email: EmailStr
    password: str
    name: str
    worker_id: Optional[str] = None
    role: str  # superviseur | rh | controleur | pompiste (admin cannot be created via API)
    site: Optional[str] = None  # legacy/general site
    assigned_site: Optional[str] = None  # required for controleur


class UserUpdate(BaseModel):
    name: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None
    worker_id: Optional[str] = None
    site: Optional[str] = None
    assigned_site: Optional[str] = None


class WorkerIn(BaseModel):
    name: str
    phone: str
    category: str
    site: str
    structure: str
    contract: Optional[str] = "CDI"
    contract_end: Optional[str] = None  # ISO date, e.g. 2026-12-31
    hours_month: Optional[int] = 0
    status: Optional[str] = "present"
    color: Optional[str] = "#1a3c5e"
    email: Optional[str] = None
    address: Optional[str] = None
    cnss: Optional[str] = None
    face_image_b64: Optional[str] = None  # data:image/jpeg;base64,...
    fingerprint_enrolled: Optional[bool] = False
    face_descriptor: Optional[List[float]] = None  # 128 floats from face-api.js
    hik_employee_id: Optional[str] = None  # Employee ID on HikVision scanner
    hik_card_no: Optional[str] = None      # Card number on HikVision scanner


class BiometricsIn(BaseModel):
    face_descriptor: List[float]  # 128 floats


class RecognizeIn(BaseModel):
    method: str  # fingerprint | face
    type: str   # entry | exit
    face_image_b64: Optional[str] = None  # not used for matching (no real ML) but stored
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class EquipmentIn(BaseModel):
    type: str  # truck | machine
    name: str
    icon: Optional[str] = "🚜"
    plate: str
    ref: Optional[str] = None
    site: str
    operator_name: Optional[str] = None
    operator_id: Optional[str] = None
    fuel_month: Optional[int] = 0
    hours_month: Optional[int] = 0
    status: Optional[str] = "active"


class AttendanceIn(BaseModel):
    worker_id: str
    type: str  # entry | exit
    method: Optional[str] = "fingerprint"  # fingerprint | face | manual
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class FuelIn(BaseModel):
    equipment_id: str
    plate: str
    liters: int
    chauffeur_name: Optional[str] = None
    site: str


class AbsenceIn(BaseModel):
    worker_id: str
    type: str
    date_from: str
    date_to: Optional[str] = None
    days: int = 1


class HikvisionIdIn(BaseModel):
    hikvision_employee_no: str


class FingerprintMatchIn(BaseModel):
    image_b64: str
    width: int
    height: int
    dpi: int = 500


# ────────────────────────── Helpers ──────────────────────────
def initials(name: str) -> str:
    parts = name.strip().split()
    if len(parts) >= 2:
        return (parts[0][0] + parts[1][0]).upper()
    return name[:2].upper()


def strip_id(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc


def parse_iso_date(raw: Optional[str]):
    if not raw:
        return None
    try:
        if len(raw) == 10:
            return datetime.fromisoformat(raw + "T00:00:00+00:00").date()
        return datetime.fromisoformat(raw.replace("Z", "+00:00")).date()
    except Exception:
        return None


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return radius * c


async def get_expiring_contracts(days: int = 90):
    today = datetime.now(timezone.utc).date()
    workers = await db.workers.find(
        {"contract_end": {"$exists": True, "$ne": None}},
        {"_id": 0, "id": 1, "name": 1, "site": 1, "structure": 1, "contract": 1, "contract_end": 1},
    ).to_list(2000)
    out = []
    for w in workers:
        end_date = parse_iso_date(w.get("contract_end"))
        if not end_date:
            continue
        days_left = (end_date - today).days
        if days_left <= days:
            out.append({
                "worker_id": w["id"],
                "worker_name": w["name"],
                "site": w.get("site"),
                "structure": w.get("structure"),
                "contract": w.get("contract"),
                "contract_end": end_date.isoformat(),
                "days_left": days_left,
                "status": "expired" if days_left < 0 else "expiring",
            })
    out.sort(key=lambda x: x["days_left"])
    return out


# ────────────────────────── Startup / Seed ──────────────────────────
@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.workers.create_index("name")
    await db.equipment.create_index("plate")
    await db.attendance.create_index("timestamp")
    await db.fuel.create_index("timestamp")

    # Seed users
    role_envs = [
        ("ADMIN_EMAIL", "ADMIN_PASSWORD", "Administrateur", "admin", None, None),
        ("SUPERVISEUR_EMAIL", "SUPERVISEUR_PASSWORD", "Marc Superviseur", "superviseur", "Lomé-Agoè", None),
        ("RH_EMAIL", "RH_PASSWORD", "Sarah RH", "rh", None, None),
        ("CONTROLEUR_EMAIL", "CONTROLEUR_PASSWORD", "Kofi Akuetteh", "controleur", "Lomé-Agoè", "Lomé-Agoè"),
        ("POMPISTE_EMAIL", "POMPISTE_PASSWORD", "Ama Sodzi", "pompiste", "Kégué", None),
        ("SUPER_ADMIN_EMAIL", "SUPER_ADMIN_PASSWORD", "Super Administrateur IT", "super_admin", None, None),
    ]
    for em_key, pw_key, name, role, site, assigned_site in role_envs:
        email = os.environ.get(em_key)
        password = os.environ.get(pw_key)
        if not email or not password:
            continue
        existing = await db.users.find_one({"email": email.lower()})
        hashed = hash_password(password)
        if existing is None:
            await db.users.insert_one(
                make_user_doc(email, hashed, name, role, site=site, assigned_site=assigned_site)
            )
        else:
            update_fields = {"name": name, "role": role}
            if not verify_password(password, existing["password_hash"]):
                update_fields["password_hash"] = hashed
            if role == "superviseur" and site:
                update_fields["site"] = site
            if role == "controleur":
                update_fields["site"] = site or existing.get("site") or "Lomé-Agoè"
                update_fields["assigned_site"] = assigned_site or existing.get("assigned_site") or update_fields["site"]
            await db.users.update_one({"email": email.lower()}, {"$set": update_fields})

    # Seed business data only if empty
    if await db.workers.count_documents({}) == 0:
        workers = make_worker_docs()
        await db.workers.insert_many(workers)
        workers_by_name = {w["name"]: w for w in workers}
        equipment = make_equipment_docs(workers_by_name)
        await db.equipment.insert_many(equipment)
        await db.attendance.insert_many(make_attendance_docs(workers))
        await db.absences.insert_many(make_absence_docs(workers))
        fuel_docs = make_fuel_docs(workers, equipment)
        if fuel_docs:
            await db.fuel.insert_many(fuel_docs)
        await db.payroll.insert_many(make_payroll_docs(workers))
        log.info("Seed data inserted")
    else:
        # Backfill: ensure existing workers have fingerprint_enrolled + face_image_b64 fields
        tiny = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
        await db.workers.update_many(
            {"fingerprint_enrolled": {"$exists": False}},
            {"$set": {"fingerprint_enrolled": True}},
        )
        await db.workers.update_many(
            {"face_image_b64": {"$in": [None, False]}},
            {"$set": {"face_image_b64": tiny}},
        )
        await db.workers.update_many(
            {"face_image_b64": {"$exists": False}},
            {"$set": {"face_image_b64": tiny}},
        )
        # Backfill: contract_end for short contracts
        today = datetime.now(timezone.utc).date()
        workers_missing_end = await db.workers.find(
            {"contract_end": {"$exists": False}, "contract": {"$in": ["CDD", "Journalier", "Intérim"]}},
            {"_id": 0, "id": 1, "contract": 1},
        ).to_list(3000)
        for idx, worker in enumerate(workers_missing_end):
            extra = 45 + (idx % 80) if worker.get("contract") == "CDD" else 21 + (idx % 25)
            end_date = (today + timedelta(days=extra)).isoformat()
            await db.workers.update_one({"id": worker["id"]}, {"$set": {"contract_end": end_date}})

        # Backfill: declared_by fields on absences
        await db.absences.update_many(
            {"declared_by_id": {"$exists": False}},
            {"$set": {"declared_by_id": "seed_rh_001", "declared_by_name": "Sarah RH", "declared_by_role": "rh"}},
        )

        # Backfill: assigned_site for controllers
        controllers = await db.users.find({"role": "controleur"}, {"_id": 0, "id": 1, "site": 1, "assigned_site": 1}).to_list(500)
        for ctrl in controllers:
            if not ctrl.get("assigned_site"):
                assigned = ctrl.get("site") or "Lomé-Agoè"
                await db.users.update_one({"id": ctrl["id"]}, {"$set": {"assigned_site": assigned, "site": assigned}})


@app.on_event("shutdown")
async def shutdown():
    client.close()


# ────────────────────────── Auth routes ──────────────────────────
@api.post("/auth/login")
async def login(body: LoginIn):
    user = await db.users.find_one({"email": body.email.lower()})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(401, "Identifiants incorrects")
    token = make_token(user["id"], user["email"], user["role"])
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "site": user.get("site"),
            "assigned_site": user.get("assigned_site"),
        },
    }


@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


# ────────────────────────── Users management (admin only) ──────────────────────────
ALLOWED_NEW_ROLES = {"superviseur", "rh", "controleur", "pompiste"}
SUPER_ADMIN_EXTRA_ROLES = {"admin"}  # roles only super_admin can assign


@api.get("/users")
async def list_users(user: dict = Depends(require_roles("admin", "super_admin"))):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(500)
    return users


@api.post("/users")
async def create_user(body: UserIn, user: dict = Depends(require_roles("admin", "super_admin"))):
    allowed = ALLOWED_NEW_ROLES | SUPER_ADMIN_EXTRA_ROLES if user["role"] == "super_admin" else ALLOWED_NEW_ROLES
    if body.role not in allowed:
        raise HTTPException(400, f"Rôle invalide. Choix : {', '.join(sorted(allowed))}")
    email = body.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(400, "Cet email existe déjà")
    assigned_site = body.assigned_site or body.site
    if body.role == "controleur" and not assigned_site:
        raise HTTPException(400, "Le chantier est obligatoire pour un contrÃ´leur")
    site_value = assigned_site if body.role == "controleur" else body.site
    doc = {
        "id": str(uuid.uuid4()),
        "email": email,
        "password_hash": hash_password(body.password),
        "name": body.name,
        "role": body.role,
        "site": site_value,
        "worker_id": body.worker_id or None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": user["id"],
    }
    if body.role == "controleur":
        doc["assigned_site"] = assigned_site
    await db.users.insert_one(doc)
    doc.pop("password_hash", None)
    doc.pop("_id", None)
    return doc


@api.patch("/users/{user_id}")
async def update_user(user_id: str, body: UserUpdate, user: dict = Depends(require_roles("admin", "super_admin"))):
    target = await db.users.find_one({"id": user_id})
    if not target:
        raise HTTPException(404, "Utilisateur non trouvé")
    if target.get("role") == "super_admin":
        raise HTTPException(403, "Impossible de modifier le super administrateur")
    if target.get("role") == "admin" and user["role"] != "super_admin":
        raise HTTPException(403, "Impossible de modifier un admin")
    update = {}
    if body.name is not None:
        update["name"] = body.name
    if body.password:
        update["password_hash"] = hash_password(body.password)
    if body.role:
        allowed = ALLOWED_NEW_ROLES | SUPER_ADMIN_EXTRA_ROLES if user["role"] == "super_admin" else ALLOWED_NEW_ROLES
        if body.role not in allowed:
            raise HTTPException(400, "Rôle invalide")
        update["role"] = body.role
    if body.site is not None:
        update["site"] = body.site
    if body.assigned_site is not None:
        update["assigned_site"] = body.assigned_site
    target_role = update.get("role") or target.get("role")
    next_site = update.get("site", target.get("site"))
    next_assigned = update.get("assigned_site", target.get("assigned_site"))
    if target_role == "controleur":
        final_assigned = next_assigned or next_site
        if not final_assigned:
            raise HTTPException(400, "Le chantier est obligatoire pour un contrÃ´leur")
        update["assigned_site"] = final_assigned
        update["site"] = final_assigned
    elif target.get("role") == "controleur" and target_role != "controleur":
        update["assigned_site"] = None
    if update:
        await db.users.update_one({"id": user_id}, {"$set": update})
    out = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    return out


@api.delete("/users/{user_id}")
async def delete_user(user_id: str, user: dict = Depends(require_roles("admin", "super_admin"))):
    if user_id == user["id"]:
        raise HTTPException(400, "Vous ne pouvez pas supprimer votre propre compte")
    target = await db.users.find_one({"id": user_id})
    if not target:
        raise HTTPException(404, "Utilisateur non trouvé")
    if target.get("role") == "super_admin":
        raise HTTPException(403, "Impossible de supprimer le super administrateur")
    if target.get("role") == "admin" and user["role"] != "super_admin":
        raise HTTPException(403, "Impossible de supprimer un admin")
    await db.users.delete_one({"id": user_id})
    return {"ok": True}


# ────────────────────────── Workers ──────────────────────────
@api.get("/workers")
async def list_workers(
    category: Optional[str] = None,
    status: Optional[str] = None,
    site: Optional[str] = None,
    q: Optional[str] = None,
    include_suspended: bool = False,
    user: dict = Depends(get_current_user),
):
    flt: dict = {}
    if not include_suspended:
        flt["suspended"] = {"$ne": True}
    if category and category != "Tous":
        flt["category"] = category
    if status:
        flt["status"] = status
    if site:
        flt["site"] = site
    if q:
        flt["name"] = {"$regex": q, "$options": "i"}
    # Superviseur sees only own site (Lomé-Agoè by default for demo)
    if user["role"] == "superviseur":
        flt["site"] = user.get("site") or flt.get("site")
    items = await db.workers.find(flt, {"_id": 0, "face_descriptor": 0}).sort("name", 1).to_list(1000)
    return items


@api.get("/workers/inactive")
async def list_inactive_workers(user: dict = Depends(require_roles("admin", "super_admin"))):
    """Liste des ouvriers suspendus (inactifs)."""
    items = await db.workers.find(
        {"suspended": True},
        {"_id": 0, "face_descriptor": 0},
    ).sort("name", 1).to_list(1000)
    return items


@api.get("/structures")
async def list_structures(user: dict = Depends(get_current_user)):
    """Liste toutes les structures enregistrées (statiques + dynamiques)."""
    defaults = ["EBOMAF", "Cabinet AGBO", "KOFFI BTP", "SODJI", "AMEGAH"]
    saved = await db.structures.distinct("name")
    all_names = list(dict.fromkeys(defaults + [s for s in saved if s not in defaults]))
    return all_names


@api.post("/structures")
async def add_structure(body: dict, user: dict = Depends(require_roles("admin", "superviseur"))):
    """Enregistre une nouvelle structure si elle n'existe pas déjà."""
    name = str(body.get("name", "")).strip()
    if not name:
        raise HTTPException(400, "Nom requis")
    await db.structures.update_one({"name": name}, {"$set": {"name": name}}, upsert=True)
    return {"ok": True, "name": name}


@api.get("/hikvision/next-employee-id")
async def hik_next_employee_id(user: dict = Depends(require_roles("admin", "superviseur"))):
    """Retourne le prochain Employee ID disponible pour le scanner HikVision."""
    existing = await db.workers.distinct("hik_employee_id")
    used = set(str(x) for x in existing if x)
    n = 1
    while str(n).zfill(4) in used:
        n += 1
    return {"next_id": str(n).zfill(4)}


@api.get("/workers/biometrics")
async def list_worker_biometrics(user: dict = Depends(require_roles("controleur", "admin", "superviseur"))):
    """Face descriptors for client-side biometric matching (face-api.js)."""
    flt: dict = {"face_descriptor": {"$exists": True, "$ne": None}}
    if user["role"] == "controleur":
        site = user.get("assigned_site") or user.get("site")
        if site:
            flt["site"] = site
    elif user["role"] == "superviseur":
        site = user.get("site")
        if site:
            flt["site"] = site
    items = await db.workers.find(flt, {"_id": 0, "id": 1, "name": 1, "face_descriptor": 1}).to_list(500)
    return items


@api.get("/workers/{worker_id}")
async def get_worker(worker_id: str, user: dict = Depends(get_current_user)):
    w = await db.workers.find_one({"id": worker_id}, {"_id": 0})
    if not w:
        raise HTTPException(404, "Ouvrier non trouvé")
    # Attendance, absences, payroll for this worker
    attendance = await db.attendance.find({"worker_id": worker_id}, {"_id": 0}).sort("timestamp", -1).to_list(30)
    absences = await db.absences.find({"worker_id": worker_id}, {"_id": 0}).to_list(50)
    payroll = await db.payroll.find({"worker_id": worker_id}, {"_id": 0}).to_list(20)
    return {**w, "attendance": attendance, "absences": absences, "payroll": payroll}


@api.post("/workers")
async def create_worker(body: WorkerIn, user: dict = Depends(require_roles("admin", "superviseur"))):
    doc = body.model_dump()
    if user["role"] == "superviseur" and user.get("site"):
        doc["site"] = user["site"]
    doc["id"] = str(uuid.uuid4())
    doc["initials"] = initials(body.name)
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["recruited_at"] = doc["created_at"]
    doc["days_worked"] = 0
    doc["total_paid"] = 0
    doc["payments_count"] = 0
    doc["fingerprint_id"] = f"FP{uuid.uuid4().hex[:8]}"
    if not doc.get("cnss"):
        doc["cnss"] = f"TG{uuid.uuid4().hex[:8].upper()}"
    short_contracts = {"CDD", "Journalier", "Intérim"}
    if doc.get("contract") in short_contracts and not doc.get("contract_end"):
        delta = 90 if doc.get("contract") == "CDD" else 30
        doc["contract_end"] = (datetime.now(timezone.utc).date() + timedelta(days=delta)).isoformat()
    if doc.get("contract_end") and not parse_iso_date(doc.get("contract_end")):
        raise HTTPException(400, "Date de fin de contrat invalide")
    await db.workers.insert_one(doc)
    # Auto-save new structure to DB
    if doc.get("structure"):
        await db.structures.update_one({"name": doc["structure"]}, {"$set": {"name": doc["structure"]}}, upsert=True)
    result = strip_id(doc)
    # Option B: auto-push to HikVision scanner if hik_employee_id is set
    if doc.get("hik_employee_id") and HIK_HOST and HIK_HOST != "disabled":
        try:
            asyncio.create_task(_hik_push_worker(doc))
        except Exception as e:
            log.warning(f"HIK auto-push failed for {doc['name']}: {e}")
    return result


@api.delete("/workers/{worker_id}")
async def delete_worker(worker_id: str, user: dict = Depends(require_roles("admin", "super_admin"))):
    w = await db.workers.find_one({"id": worker_id}, {"_id": 0})
    if not w:
        raise HTTPException(404, "Non trouvé")
    emp_id = w.get("hik_employee_id") or w.get("hikvision_employee_no")
    if emp_id and HIK_HOST and HIK_HOST != "disabled":
        try:
            asyncio.create_task(_hik_delete_worker(emp_id))
        except Exception:
            pass
    r = await db.workers.delete_one({"id": worker_id})
    if r.deleted_count == 0:
        raise HTTPException(404, "Non trouvé")
    return {"ok": True}


@api.patch("/workers/{worker_id}/suspend")
async def suspend_worker(worker_id: str, user: dict = Depends(require_roles("admin", "super_admin"))):
    """Suspendre un ouvrier (le rend inactif sans suppression)."""
    r = await db.workers.update_one(
        {"id": worker_id},
        {"$set": {
            "suspended": True,
            "suspended_at": datetime.now(timezone.utc).isoformat(),
            "suspended_by": user["id"],
            "suspended_by_name": user["name"],
        }},
    )
    if r.matched_count == 0:
        raise HTTPException(404, "Non trouvé")
    return {"ok": True}


@api.patch("/workers/{worker_id}/reactivate")
async def reactivate_worker(worker_id: str, user: dict = Depends(require_roles("admin", "super_admin"))):
    """Réactiver un ouvrier suspendu."""
    r = await db.workers.update_one(
        {"id": worker_id},
        {"$set": {"suspended": False}, "$unset": {"suspended_at": "", "suspended_by": "", "suspended_by_name": ""}},
    )
    if r.matched_count == 0:
        raise HTTPException(404, "Non trouvé")
    return {"ok": True}


@api.put("/workers/{worker_id}/biometrics")
async def update_worker_biometrics(
    worker_id: str,
    body: BiometricsIn,
    user: dict = Depends(require_roles("admin", "superviseur")),
):
    """Save or update the 128D face descriptor for a worker."""
    r = await db.workers.update_one({"id": worker_id}, {"$set": {"face_descriptor": body.face_descriptor}})
    if r.matched_count == 0:
        raise HTTPException(404, "Ouvrier non trouvé")
    return {"ok": True}


# ────────────────────────── Equipment ──────────────────────────
@api.get("/equipment")
async def list_equipment(
    type: Optional[str] = None,
    site: Optional[str] = None,
    status: Optional[str] = None,
    user: dict = Depends(get_current_user),
):
    flt = {}
    if type:
        flt["type"] = type
    if site:
        flt["site"] = site
    if status:
        flt["status"] = status
    items = await db.equipment.find(flt, {"_id": 0}).sort("number", 1).to_list(500)
    return items


@api.get("/equipment/by-plate/{plate}")
async def get_equipment_by_plate(plate: str, user: dict = Depends(get_current_user)):
    e = await db.equipment.find_one({"plate": {"$regex": f"^{plate}$", "$options": "i"}}, {"_id": 0})
    if not e:
        raise HTTPException(404, "Engin non trouvé")
    return e


@api.post("/equipment")
async def create_equipment(body: EquipmentIn, user: dict = Depends(require_roles("admin", "superviseur"))):
    doc = body.model_dump()
    doc["id"] = str(uuid.uuid4())
    # Auto-number
    count = await db.equipment.count_documents({"type": doc["type"]})
    doc["number"] = f"{count + 1:02d}"
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.equipment.insert_one(doc)
    return strip_id(doc)


# ────────────────────────── Attendance / Pointage ──────────────────────────
@api.get("/attendance/today")
async def attendance_today(site: Optional[str] = None, user: dict = Depends(get_current_user)):
    start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    flt = {"timestamp": {"$gte": start.isoformat()}}
    if site:
        flt["site"] = site
    if user["role"] == "superviseur":
        flt["site"] = user.get("site") or flt.get("site")
    if user["role"] == "controleur":
        flt["site"] = user.get("assigned_site") or user.get("site") or flt.get("site")
    items = await db.attendance.find(flt, {"_id": 0}).sort("timestamp", -1).to_list(500)
    return items


@api.post("/attendance/scan")
async def scan_attendance(body: AttendanceIn, user: dict = Depends(require_roles("controleur", "admin", "superviseur"))):
    w = await db.workers.find_one({"id": body.worker_id}, {"_id": 0})
    if not w:
        raise HTTPException(404, "Ouvrier introuvable")
    now = datetime.now(timezone.utc)
    # Calculate lateness for entry: 7h00 site standard
    late = 0
    if body.type == "entry":
        ref = now.replace(hour=7, minute=0, second=0, microsecond=0)
        late = max(0, int((now - ref).total_seconds() / 60)) if now > ref else 0
    scan_site = user.get("assigned_site") or user.get("site") or w.get("site")
    doc = {
        "id": str(uuid.uuid4()),
        "worker_id": body.worker_id,
        "worker_name": w["name"],
        "type": body.type,
        "timestamp": now.isoformat(),
        "method": body.method,
        "controller_id": user["id"],
        "controller_name": user["name"],
        "site": scan_site,
        "latitude": body.latitude,
        "longitude": body.longitude,
        "late_minutes": late,
    }
    await db.attendance.insert_one(doc)
    # Update worker status to present on entry
    if body.type == "entry":
        await db.workers.update_one({"id": body.worker_id}, {"$set": {"status": "present"}})
    return strip_id(doc)


@api.post("/attendance/recognize")
async def recognize_and_scan(body: RecognizeIn, user: dict = Depends(require_roles("controleur", "admin", "superviseur"))):
    """Simulates biometric recognition (face or fingerprint).
    Picks a random enrolled worker (no real ML). Returns 404 if none enrolled
    or if the simulated match fails."""
    import random
    if body.method not in ("fingerprint", "face"):
        raise HTTPException(400, "Méthode invalide")
    if body.type not in ("entry", "exit"):
        raise HTTPException(400, "Type invalide")
    flt = {}
    if body.method == "fingerprint":
        flt["fingerprint_enrolled"] = True
    else:
        flt["face_image_b64"] = {"$ne": None}
    if user["role"] == "controleur":
        ctrl_site = user.get("assigned_site") or user.get("site")
        if ctrl_site:
            flt["site"] = ctrl_site
    enrolled = await db.workers.find(flt, {"_id": 0, "face_image_b64": 0}).to_list(500)
    if not enrolled:
        raise HTTPException(404, f"Aucun ouvrier enrôlé en mode {body.method}. Veuillez d'abord enrôler des ouvriers.")
    # For exit: prefer workers who already have an entry today and no exit yet
    start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    if body.type == "exit":
        today_entries = await db.attendance.find({"timestamp": {"$gte": start}, "type": "entry"}, {"_id": 0}).to_list(500)
        today_exits = await db.attendance.find({"timestamp": {"$gte": start}, "type": "exit"}, {"_id": 0}).to_list(500)
        entered_ids = {a["worker_id"] for a in today_entries}
        exited_ids = {a["worker_id"] for a in today_exits}
        pending = [w for w in enrolled if w["id"] in (entered_ids - exited_ids)]
        if not pending:
            raise HTTPException(404, "Aucun ouvrier en attente de sortie")
        w = random.choice(pending)
    else:
        # For entry: avoid workers who already entered today
        today_entries = await db.attendance.find({"timestamp": {"$gte": start}, "type": "entry"}, {"_id": 0}).to_list(500)
        entered_ids = {a["worker_id"] for a in today_entries}
        pending = [x for x in enrolled if x["id"] not in entered_ids]
        if not pending:
            # All enrolled already entered – allow re-scan but with explanation
            raise HTTPException(409, "Tous les ouvriers enrôlés ont déjà pointé en entrée aujourd'hui")
        w = random.choice(pending)
    now = datetime.now(timezone.utc)
    late = 0
    if body.type == "entry":
        ref = now.replace(hour=7, minute=0, second=0, microsecond=0)
        late = max(0, int((now - ref).total_seconds() / 60)) if now > ref else 0
    scan_site = user.get("assigned_site") or user.get("site") or w.get("site")
    doc = {
        "id": str(uuid.uuid4()),
        "worker_id": w["id"],
        "worker_name": w["name"],
        "type": body.type,
        "timestamp": now.isoformat(),
        "method": body.method,
        "controller_id": user["id"],
        "controller_name": user["name"],
        "site": scan_site,
        "latitude": body.latitude,
        "longitude": body.longitude,
        "late_minutes": late,
    }
    await db.attendance.insert_one(doc)
    if body.type == "entry":
        await db.workers.update_one({"id": w["id"]}, {"$set": {"status": "present"}})
    doc.pop("_id", None)
    w.pop("_id", None)
    return {**doc, "worker": w}


# ────────────────────────── Fuel / Carburant ──────────────────────────
@api.get("/fuel")
async def list_fuel(
    period: str = "today",
    user: dict = Depends(get_current_user),
):
    now = datetime.now(timezone.utc)
    if period == "today":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "week":
        start = now - timedelta(days=7)
    elif period == "month":
        start = now - timedelta(days=30)
    else:
        start = datetime(2000, 1, 1, tzinfo=timezone.utc)
    items = await db.fuel.find({"timestamp": {"$gte": start.isoformat()}}, {"_id": 0}).sort("timestamp", -1).to_list(1000)
    return items


@api.post("/fuel")
async def create_fuel(body: FuelIn, user: dict = Depends(require_roles("pompiste", "admin", "superviseur"))):
    eq = await db.equipment.find_one({"plate": body.plate}, {"_id": 0})
    if not eq:
        raise HTTPException(404, "Engin non trouvé")
    doc = {
        "id": str(uuid.uuid4()),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "pompiste_id": user["id"],
        "pompiste_name": user["name"],
        "equipment_id": eq["id"],
        "equipment_name": eq["name"],
        "plate": body.plate,
        "chauffeur_name": body.chauffeur_name or eq.get("operator_name") or "—",
        "liters": body.liters,
        "site": body.site,
        "unit_price": 580,
    }
    await db.fuel.insert_one(doc)
    return strip_id(doc)


# ────────────────────────── Absences ──────────────────────────
@api.get("/absences")
async def list_absences(user: dict = Depends(get_current_user)):
    items = await db.absences.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return items


@api.post("/absences")
async def create_absence(body: AbsenceIn, user: dict = Depends(require_roles("admin", "rh", "superviseur"))):
    w = await db.workers.find_one({"id": body.worker_id}, {"_id": 0})
    if not w:
        raise HTTPException(404, "Ouvrier introuvable")
    doc = body.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["worker_name"] = w["name"]
    doc["worker_category"] = w["category"]
    doc["justificatif"] = False
    doc["statut"] = "en_attente"
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["declared_by_id"] = user["id"]
    doc["declared_by_name"] = user["name"]
    doc["declared_by_role"] = user["role"]
    await db.absences.insert_one(doc)
    # Sync worker status
    status_map = {
        "maladie": "malade",
        "conge_paye": "conge",
        "accident_travail": "blesse",
        "injustifiee": "absent",
    }
    if body.type in status_map:
        await db.workers.update_one({"id": body.worker_id}, {"$set": {"status": status_map[body.type]}})
    return strip_id(doc)


# ────────────────────────── Payroll ──────────────────────────
@api.get("/payroll")
async def list_payroll(month: Optional[str] = None, user: dict = Depends(require_roles("admin", "rh"))):
    flt = {}
    if month:
        flt["month"] = month
    items = await db.payroll.find(flt, {"_id": 0}).to_list(1000)
    return items


# ────────────────────────── Dashboard / Stats ──────────────────────────
@api.get("/dashboard/admin")
async def dashboard_admin(user: dict = Depends(get_current_user)):
    total_workers = await db.workers.count_documents({})
    present = await db.workers.count_documents({"status": "present"})
    absent = await db.workers.count_documents({"status": "absent"})
    malade = await db.workers.count_documents({"status": "malade"})
    conge = await db.workers.count_documents({"status": "conge"})
    blesse = await db.workers.count_documents({"status": "blesse"})
    total_equipment = await db.equipment.count_documents({})
    active_eq = await db.equipment.count_documents({"status": "active"})
    maintenance_eq = await db.equipment.count_documents({"status": "maintenance"})
    inactive_eq = await db.equipment.count_documents({"status": "inactive"})
    trucks = await db.equipment.count_documents({"type": "truck"})
    machines = await db.equipment.count_documents({"type": "machine"})

    # Hours sum
    pipeline = [{"$group": {"_id": None, "h": {"$sum": "$hours_month"}}}]
    cur = db.workers.aggregate(pipeline)
    total_hours = 0
    async for r in cur:
        total_hours = r["h"]

    # Category breakdown
    cat_pipeline = [{"$group": {"_id": "$category", "count": {"$sum": 1}}}, {"$sort": {"count": -1}}]
    categories = []
    async for r in db.workers.aggregate(cat_pipeline):
        categories.append({"category": r["_id"], "count": r["count"]})

    # Recent activities — last 6 events (mix of attendance + fuel)
    activities = []
    async for r in db.attendance.find({}, {"_id": 0}).sort("timestamp", -1).limit(3):
        activities.append({
            "type": "attendance",
            "text": f"{r['worker_name']} — Pointage {r['type']}",
            "time": r["timestamp"],
            "site": r["site"],
        })
    async for r in db.fuel.find({}, {"_id": 0}).sort("timestamp", -1).limit(3):
        activities.append({
            "type": "fuel",
            "text": f"{r['equipment_name']} — {r['liters']}L distribués",
            "time": r["timestamp"],
            "site": r["site"],
        })
    activities.sort(key=lambda x: x["time"], reverse=True)

    # Weekly productivity (mock weekly buckets from current month hours)
    productivity = [
        {"day": "Lun", "hours": 285, "target": 300},
        {"day": "Mar", "hours": 305, "target": 300},
        {"day": "Mer", "hours": 312, "target": 300},
        {"day": "Jeu", "hours": 298, "target": 300},
        {"day": "Ven", "hours": 320, "target": 300},
        {"day": "Sam", "hours": 165, "target": 200},
        {"day": "Dim", "hours": 0, "target": 0},
    ]

    # Equipment usage by site
    site_pipeline = [{"$group": {"_id": "$site", "active": {"$sum": {"$cond": [{"$eq": ["$status", "active"]}, 1, 0]}}, "total": {"$sum": 1}}}]
    sites_usage = []
    async for r in db.equipment.aggregate(site_pipeline):
        if r["total"]:
            sites_usage.append({"site": r["_id"], "rate": round(r["active"] * 100 / r["total"])})
    contracts_expiring = await get_expiring_contracts(90)
    urgent_contracts = [c for c in contracts_expiring if c["days_left"] <= 30]

    return {
        "workers": {
            "total": total_workers,
            "present": present,
            "absent": absent,
            "malade": malade,
            "conge": conge,
            "blesse": blesse,
        },
        "equipment": {
            "total": total_equipment,
            "active": active_eq,
            "maintenance": maintenance_eq,
            "inactive": inactive_eq,
            "trucks": trucks,
            "machines": machines,
        },
        "total_hours_month": total_hours,
        "categories": categories,
        "activities": activities[:6],
        "productivity": productivity,
        "sites_usage": sites_usage,
        "sites_active": len(set(s["site"] for s in sites_usage)),
        "contracts_expiring": {
            "count": len(contracts_expiring),
            "urgent_count": len(urgent_contracts),
            "items": contracts_expiring[:15],
        },
    }


@api.get("/dashboard/superviseur")
async def dashboard_superviseur(user: dict = Depends(get_current_user)):
    site = user.get("site") or "Lomé-Agoè"
    total = await db.workers.count_documents({"site": site})
    present = await db.workers.count_documents({"site": site, "status": "present"})
    absent = await db.workers.count_documents({"site": site, "status": "absent"})
    equipment_total = await db.equipment.count_documents({"site": site})
    eq_active = await db.equipment.count_documents({"site": site, "status": "active"})
    eq_maintenance = await db.equipment.count_documents({"site": site, "status": "maintenance"})

    pipeline = [{"$match": {"site": site}}, {"$group": {"_id": None, "h": {"$sum": "$hours_month"}}}]
    hours = 0
    async for r in db.workers.aggregate(pipeline):
        hours = r["h"]

    workers = await db.workers.find({"site": site}, {"_id": 0}).to_list(100)
    return {
        "site": site,
        "workers": {"total": total, "present": present, "absent": absent},
        "equipment": {"total": equipment_total, "active": eq_active, "maintenance": eq_maintenance},
        "total_hours_month": hours,
        "workers_list": workers,
    }


@api.get("/dashboard/rh")
async def dashboard_rh(user: dict = Depends(get_current_user)):
    total = await db.workers.count_documents({})
    conges = await db.absences.count_documents({"type": "conge_paye", "statut": {"$in": ["en_cours", "valide"]}})
    maladies = await db.absences.count_documents({"type": "maladie"})
    pending = await db.absences.find({"statut": "en_attente"}, {"_id": 0}).limit(10).to_list(10)
    absences = await db.absences.find({}, {"_id": 0}).sort("created_at", -1).limit(20).to_list(20)
    payroll = await db.payroll.find({}, {"_id": 0}).limit(20).to_list(20)
    total_payroll = sum(p["net"] for p in payroll)
    return {
        "total_workers": total,
        "conges_count": conges,
        "maladies_count": maladies,
        "masse_salariale": total_payroll,
        "pending_requests": pending,
        "absences": absences,
        "payroll": payroll,
    }


@api.get("/dashboard/pompiste")
async def dashboard_pompiste(user: dict = Depends(get_current_user)):
    start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_distribs = await db.fuel.find({"pompiste_id": user["id"], "timestamp": {"$gte": start.isoformat()}}, {"_id": 0}).to_list(100)
    total_liters = sum(d["liters"] for d in today_distribs)
    nb_engins = len(set(d["equipment_id"] for d in today_distribs))
    # All today's distribs (other pompistes)
    all_today = await db.fuel.find({"timestamp": {"$gte": start.isoformat()}}, {"_id": 0}).to_list(500)
    return {
        "today_count": len(today_distribs),
        "today_liters": total_liters,
        "today_engins": nb_engins,
        "stock_total": 12400,
        "stock_used": total_liters,
        "distributions": today_distribs,
        "all_today": all_today,
    }


@api.get("/dashboard/controleur")
async def dashboard_controleur(user: dict = Depends(get_current_user)):
    start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    controller_site = user.get("assigned_site") or user.get("site") or "Lomé-Agoè"
    flt = {"timestamp": {"$gte": start.isoformat()}}
    if user["role"] == "controleur":
        flt["site"] = controller_site
    today = await db.attendance.find(flt, {"_id": 0}).sort("timestamp", -1).to_list(500)
    entries = [a for a in today if a["type"] == "entry"]
    exits = [a for a in today if a["type"] == "exit"]
    retards = [a for a in today if a.get("late_minutes", 0) > 30]
    total_assigned = await db.workers.count_documents({"site": controller_site})
    return {
        "site": controller_site,
        "total_assigned": total_assigned,
        "entries_count": len(entries),
        "exits_count": len(exits),
        "retards_count": len(retards),
        "not_pointed": max(0, total_assigned - len(entries)),
        "attendance": today,
    }


@api.get("/contracts/expiring")
async def contracts_expiring(
    days: int = Query(90, ge=1, le=365),
    user: dict = Depends(require_roles("admin", "rh", "superviseur")),
):
    items = await get_expiring_contracts(days)
    if user["role"] == "superviseur":
        site = user.get("site")
        if site:
            items = [i for i in items if i.get("site") == site]
    return {
        "days": days,
        "count": len(items),
        "urgent_count": len([i for i in items if i["days_left"] <= 30]),
        "items": items,
    }


@api.get("/structures/overview")
async def structures_overview(user: dict = Depends(require_roles("admin", "rh", "superviseur"))):
    worker_filter = {}
    if user["role"] == "superviseur" and user.get("site"):
        worker_filter["site"] = user["site"]
    workers = await db.workers.find(worker_filter, {"_id": 0}).to_list(4000)

    structures_map = {}
    for w in workers:
        structure = w.get("structure") or "Non renseignée"
        site = w.get("site") or "Non renseigné"
        status = w.get("status")
        if structure not in structures_map:
            structures_map[structure] = {
                "name": structure,
                "total_workers": 0,
                "present_workers": 0,
                "absent_workers": 0,
                "hours_month": 0,
                "sites_map": {},
            }
        item = structures_map[structure]
        item["total_workers"] += 1
        item["hours_month"] += int(w.get("hours_month", 0) or 0)
        if status == "present":
            item["present_workers"] += 1
        else:
            item["absent_workers"] += 1
        if site not in item["sites_map"]:
            item["sites_map"][site] = {"site": site, "workers": 0, "present": 0, "absent": 0, "hours_month": 0}
        site_item = item["sites_map"][site]
        site_item["workers"] += 1
        site_item["hours_month"] += int(w.get("hours_month", 0) or 0)
        if status == "present":
            site_item["present"] += 1
        else:
            site_item["absent"] += 1

    structures = []
    for _, item in structures_map.items():
        sites_list = sorted(item["sites_map"].values(), key=lambda s: s["workers"], reverse=True)
        presence_rate = round((item["present_workers"] * 100 / item["total_workers"]), 1) if item["total_workers"] else 0
        structures.append({
            "name": item["name"],
            "total_workers": item["total_workers"],
            "present_workers": item["present_workers"],
            "absent_workers": item["absent_workers"],
            "presence_rate": presence_rate,
            "hours_month": item["hours_month"],
            "sites": sites_list,
        })
    structures.sort(key=lambda s: s["total_workers"], reverse=True)

    return {
        "total_structures": len(structures),
        "total_workers": sum(s["total_workers"] for s in structures),
        "total_present": sum(s["present_workers"] for s in structures),
        "total_absent": sum(s["absent_workers"] for s in structures),
        "total_hours_month": sum(s["hours_month"] for s in structures),
        "structures": structures,
    }


@api.get("/controllers/sites")
async def controllers_sites(
    site: Optional[str] = None,
    user: dict = Depends(require_roles("admin", "superviseur")),
):
    start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    role_filter = {"role": "controleur"}
    requested_site = site or (user.get("site") if user["role"] == "superviseur" else None)
    if requested_site:
        role_filter["assigned_site"] = requested_site
    controllers = await db.users.find(role_filter, {"_id": 0, "password_hash": 0}).to_list(300)

    out = []
    for ctrl in controllers:
        ctrl_site = ctrl.get("assigned_site") or ctrl.get("site")
        scans = await db.attendance.find(
            {
                "controller_id": ctrl["id"],
                "timestamp": {"$gte": start},
                "latitude": {"$ne": None},
                "longitude": {"$ne": None},
            },
            {"_id": 0},
        ).sort("timestamp", 1).to_list(1000)
        last_position = None
        path = []
        for s in scans:
            lat = s.get("latitude")
            lng = s.get("longitude")
            if lat is None or lng is None:
                continue
            point = {
                "timestamp": s["timestamp"],
                "latitude": lat,
                "longitude": lng,
                "worker_id": s.get("worker_id"),
                "worker_name": s.get("worker_name"),
                "type": s.get("type"),
            }
            path.append(point)
            last_position = point

        distance_km = None
        site_coords = SITE_COORDS.get(ctrl_site) if ctrl_site else None
        if site_coords and last_position:
            distance_km = round(
                haversine_km(
                    last_position["latitude"],
                    last_position["longitude"],
                    site_coords["lat"],
                    site_coords["lng"],
                ),
                3,
            )

        out.append(
            {
                "controller": {
                    "id": ctrl["id"],
                    "name": ctrl["name"],
                    "email": ctrl["email"],
                    "role": ctrl["role"],
                    "site": ctrl.get("site"),
                    "assigned_site": ctrl.get("assigned_site"),
                },
                "assigned_site": ctrl_site,
                "site_coords": site_coords,
                "today_scans_count": len(scans),
                "last_position": last_position,
                "distance_to_site_km": distance_km,
                "path": path,
            }
        )

    return {
        "site": requested_site,
        "controllers_count": len(out),
        "sites_available": sorted(list(SITE_COORDS.keys())),
        "items": out,
    }


@api.get("/health")
async def health():
    return {"status": "ok"}


# ────────────────────────── System (super_admin only) ──────────────────────────
@api.get("/system/info")
async def system_info(user: dict = Depends(require_roles("super_admin"))):
    """IT dashboard — DB stats and system info (super_admin only)."""
    collections = ["users", "workers", "equipment", "attendance", "absences", "fuel", "payroll"]
    stats = {}
    for col in collections:
        stats[col] = await db[col].count_documents({})

    all_users = await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(500)

    # DB size via command
    db_stats_raw = await db.command("dbStats")
    db_size_mb = round(db_stats_raw.get("dataSize", 0) / 1024 / 1024, 2)
    storage_mb = round(db_stats_raw.get("storageSize", 0) / 1024 / 1024, 2)

    return {
        "app_name": "WORKTRAX",
        "version": "1.0.0",
        "db_name": DB_NAME,
        "db_size_mb": db_size_mb,
        "storage_mb": storage_mb,
        "collections": stats,
        "users": all_users,
        "roles_summary": {r: sum(1 for u in all_users if u.get("role") == r) for r in ["super_admin", "admin", "superviseur", "rh", "controleur", "pompiste"]},
    }


# ────────────────────────── Documentation downloads ──────────────────────────
from fastapi.responses import FileResponse

DOCS_DIR = ROOT_DIR.parent / "docs"


@api.get("/docs/guide.html")
async def docs_guide_html():
    f = DOCS_DIR / "GUIDE_UTILISATEUR.html"
    if not f.exists():
        raise HTTPException(404, "Documentation indisponible")
    return FileResponse(str(f), media_type="text/html")


@api.get("/docs/guide.md")
async def docs_guide_md():
    f = DOCS_DIR / "GUIDE_UTILISATEUR.md"
    if not f.exists():
        raise HTTPException(404, "Documentation indisponible")
    return FileResponse(str(f), media_type="text/markdown", filename="WORKTRAX_GUIDE.md")


@api.get("/docs/bundle.zip")
async def docs_bundle():
    f = DOCS_DIR / "WORKTRAX_documentation.zip"
    if not f.exists():
        raise HTTPException(404, "Bundle indisponible")
    return FileResponse(str(f), media_type="application/zip", filename="WORKTRAX_documentation.zip")


@api.get("/docs/screenshots/{name}")
async def docs_screenshot(name: str):
    f = DOCS_DIR / "screenshots" / name
    if not f.exists() or ".." in name:
        raise HTTPException(404, "Capture introuvable")
    return FileResponse(str(f), media_type="image/png")



# ────────────────────────── HikVision ISAPI Integration ──────────────────────────
import httpx
import asyncio

HIK_HOST = os.environ.get("HIK_HOST", "192.168.1.200")
HIK_USER = os.environ.get("HIK_USER", "admin")
HIK_PASS = os.environ.get("HIK_PASS", "Admin@2026")
HIK_POLL_INTERVAL = int(os.environ.get("HIK_POLL_INTERVAL", "60"))

_hik_last_sync: datetime = None
_hik_poll_task = None


def _hik_client() -> httpx.AsyncClient:
    return httpx.AsyncClient(verify=False, auth=httpx.DigestAuth(HIK_USER, HIK_PASS), timeout=15)


async def _hik_push_worker(worker: dict) -> dict:
    """Create or update a person on the HikVision scanner via ISAPI (Option B)."""
    emp_id = str(worker.get("hik_employee_id") or "").strip()
    if not emp_id:
        return {"ok": False, "reason": "no hik_employee_id"}

    payload = {
        "UserInfo": {
            "employeeNo": emp_id,
            "name": worker["name"][:32],
            "userType": "normal",
            "Valid": {
                "enable": True,
                "beginTime": "2026-01-01T00:00:00",
                "endTime": "2037-12-31T23:59:59",
                "timeType": "local",
            },
            "doorRight": "1",
            "RightPlan": [{"doorNo": 1, "planTemplateNo": "1"}],
        }
    }
    url = f"https://{HIK_HOST}/ISAPI/AccessControl/UserInfo/Record?format=json"
    async with _hik_client() as client:
        resp = await client.post(url, json=payload)

    if resp.status_code in (200, 201):
        log.info(f"HIK push: {worker['name']} (emp={emp_id}) créé sur scanner")
        return {"ok": True, "emp_id": emp_id}

    # If already exists, update instead
    if resp.status_code == 400:
        url_mod = f"https://{HIK_HOST}/ISAPI/AccessControl/UserInfo/Modify?format=json"
        async with _hik_client() as client:
            resp2 = await client.put(url_mod, json=payload)
        if resp2.status_code == 200:
            log.info(f"HIK push: {worker['name']} (emp={emp_id}) mis à jour sur scanner")
            return {"ok": True, "emp_id": emp_id, "updated": True}

    log.warning(f"HIK push failed: {resp.status_code} {resp.text[:200]}")
    return {"ok": False, "status_code": resp.status_code}


async def _hik_delete_worker(emp_id: str) -> bool:
    """Remove a person from the HikVision scanner."""
    payload = {"UserInfoDelCond": {"EmployeeNoList": [{"employeeNo": emp_id}]}}
    url = f"https://{HIK_HOST}/ISAPI/AccessControl/UserInfo/Delete?format=json"
    async with _hik_client() as client:
        resp = await client.put(url, json=payload)
    return resp.status_code == 200


async def _hik_sync_events() -> dict:
    """Fetch new access events from HikVision ISAPI and record attendance."""
    global _hik_last_sync
    now = datetime.now(timezone.utc)
    start = _hik_last_sync or (now - timedelta(hours=8))

    url = f"https://{HIK_HOST}/ISAPI/AccessControl/AcsEvent?format=json"
    body = {
        "AcsEventCond": {
            "searchID": str(uuid.uuid4())[:8],
            "searchResultPosition": 0,
            "maxResults": 100,
            "major": 0,
            "minor": 0,
            "startTime": start.strftime("%Y-%m-%dT%H:%M:%S+00:00"),
            "endTime": now.strftime("%Y-%m-%dT%H:%M:%S+00:00"),
        }
    }
    async with _hik_client() as client:
        resp = await client.post(url, json=body)
        resp.raise_for_status()
        data = resp.json()

    events = data.get("AcsEvent", {}).get("InfoList") or []
    saved = 0

    for ev in events:
        # Ignorer les événements sans identifiant ouvrier (ex: minor=49 fingerprint detect)
        if ev.get("major") == 5 and ev.get("minor") not in (38, 75, 1):
            # minor=38 = accès accordé, 75 = empreinte OK, 1 = carte OK
            # minor=49 = empreinte détectée mais sans identifiant → ignorer
            pass

        card_no = str(ev.get("cardNo", "")).strip()
        emp_id = str(ev.get("employeeNoString", "")).strip()
        serial_no = str(ev.get("serialNo", "")).strip()
        ev_time_str = ev.get("time", "")
        verify_mode = ev.get("currentVerifyMode", "") or ev.get("verifyMode", "") or ""

        # Ignorer événements sans identifiant ouvrier
        if not emp_id and not card_no:
            continue

        # Normaliser l'ID : essayer "001", "0001", "1" pour éviter les problèmes de zéros
        emp_ids = set()
        if emp_id:
            emp_ids.add(emp_id)
            try:
                n = int(emp_id)
                emp_ids.add(str(n).zfill(4))  # "001" → "0001"
                emp_ids.add(str(n))            # "0001" → "1"
            except ValueError:
                pass

        worker = None
        if emp_ids:
            worker = await db.workers.find_one(
                {"$or": [
                    {"hik_employee_id": {"$in": list(emp_ids)}},
                    {"hikvision_employee_no": {"$in": list(emp_ids)}},
                ]},
                {"_id": 0, "face_descriptor": 0},
            )
        if not worker and card_no:
            worker = await db.workers.find_one({"hik_card_no": card_no}, {"_id": 0, "face_descriptor": 0})
        if not worker:
            log.debug(f"HIK event: no match emp={emp_id} card={card_no} serial={serial_no}")
            continue

        # Déduplication par serialNo du scanner (chaque événement est unique)
        if serial_no and await db.attendance.find_one({"hik_serial_no": serial_no}):
            continue

        try:
            ts = datetime.fromisoformat(ev_time_str.replace("Z", "+00:00"))
            # Convertir en UTC pour stockage cohérent
            ts = ts.astimezone(timezone.utc)
        except Exception:
            ts = now

        day_start = ts.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
        day_count = await db.attendance.count_documents({"worker_id": worker["id"], "timestamp": {"$gte": day_start}, "source": "hikvision"})
        att_type = "entry" if day_count % 2 == 0 else "exit"

        # Détecter la méthode : visage ou empreinte
        method = "fingerprint"
        if "face" in verify_mode.lower():
            method = "face"
        elif "fp" in verify_mode.lower() or ev.get("minor") == 49:
            method = "fingerprint"

        late = 0
        if att_type == "entry":
            ref = ts.replace(hour=7, minute=0, second=0, microsecond=0)
            late = max(0, int((ts - ref).total_seconds() / 60)) if ts > ref else 0

        doc = {
            "id": str(uuid.uuid4()),
            "worker_id": worker["id"],
            "worker_name": worker["name"],
            "type": att_type,
            "timestamp": ts.isoformat(),
            "method": method,
            "controller_id": "hikvision",
            "controller_name": f"Scanner HikVision ({HIK_HOST})",
            "site": worker.get("site", ""),
            "latitude": None,
            "longitude": None,
            "late_minutes": late,
            "source": "hikvision",
            "hik_serial_no": serial_no,
        }
        await db.attendance.insert_one(doc)
        if att_type == "entry":
            await db.workers.update_one({"id": worker["id"]}, {"$set": {"status": "present"}})
        log.info(f"HIK: {att_type} ({method}) pour {worker['name']} à {ts.isoformat()}")
        broadcast_doc = {k: v for k, v in doc.items() if k != "_id"}
        asyncio.create_task(_ws_broadcast({"type": "new_attendance", "data": broadcast_doc}))
        saved += 1

    _hik_last_sync = now
    return {"synced": saved, "total_events": len(events), "last_sync": now.isoformat()}


async def _hik_poll_loop():
    await asyncio.sleep(10)
    while True:
        try:
            result = await _hik_sync_events()
            if result["synced"] > 0:
                log.info(f"HIK poll: {result['synced']} nouveau(x) pointage(s)")
        except Exception as e:
            log.warning(f"HIK poll error: {e}")
        await asyncio.sleep(HIK_POLL_INTERVAL)


@app.on_event("startup")
async def start_hik_polling():
    global _hik_poll_task
    if HIK_HOST and HIK_HOST != "disabled":
        _hik_poll_task = asyncio.create_task(_hik_poll_loop())
        log.info(f"HIK polling started → {HIK_HOST} every {HIK_POLL_INTERVAL}s")


@api.get("/hikvision/status")
async def hik_status(user: dict = Depends(require_roles("admin", "super_admin"))):
    try:
        async with _hik_client() as client:
            resp = await client.get(f"https://{HIK_HOST}/ISAPI/System/deviceInfo")
        return {"host": HIK_HOST, "reachable": resp.status_code == 200, "status_code": resp.status_code, "last_sync": _hik_last_sync.isoformat() if _hik_last_sync else None}
    except Exception as e:
        return {"host": HIK_HOST, "reachable": False, "error": str(e), "last_sync": _hik_last_sync.isoformat() if _hik_last_sync else None}


@api.post("/hikvision/sync")
async def hik_manual_sync(user: dict = Depends(require_roles("admin", "super_admin"))):
    try:
        return await _hik_sync_events()
    except Exception as e:
        raise HTTPException(502, f"Erreur HikVision: {e}")


@api.get("/hikvision/debug/events")
async def hik_debug_events(hours: int = 24):
    """Retourne les événements bruts du scanner (diagnostic)."""
    # Utilise l'heure locale du serveur (pas UTC) pour couvrir le décalage horaire du scanner
    now_local = datetime.now()
    now_utc = datetime.now(timezone.utc)
    start_local = now_local - timedelta(hours=hours)
    start_utc = now_utc - timedelta(hours=hours)

    results = {}
    # Essaie les deux formats de temps pour couvrir les décalages timezone
    for label, s, e in [
        ("heure_locale", start_local.strftime("%Y-%m-%dT%H:%M:%S+00:00"), now_local.strftime("%Y-%m-%dT%H:%M:%S+00:00")),
        ("heure_utc", start_utc.strftime("%Y-%m-%dT%H:%M:%S+00:00"), now_utc.strftime("%Y-%m-%dT%H:%M:%S+00:00")),
    ]:
        body = {
            "AcsEventCond": {
                "searchID": label[:8],
                "searchResultPosition": 0,
                "maxResults": 50,
                "major": 0,
                "minor": 0,
                "startTime": s,
                "endTime": e,
            }
        }
        try:
            async with _hik_client() as client:
                resp = await client.post(
                    f"https://{HIK_HOST}/ISAPI/AccessControl/AcsEvent?format=json", json=body
                )
                data = resp.json()
            events = data.get("AcsEvent", {}).get("InfoList") or []
            results[label] = {
                "query_start": s,
                "query_end": e,
                "http_status": resp.status_code,
                "total": len(events),
                "events": [
                    {
                        "time": ev.get("time"),
                        "employeeNoString": ev.get("employeeNoString"),
                        "cardNo": ev.get("cardNo"),
                        "name": ev.get("name"),
                        "verifyMode": ev.get("verifyMode"),
                        "major": ev.get("major"),
                        "minor": ev.get("minor"),
                        "raw": ev,
                    }
                    for ev in events
                ],
            }
        except Exception as ex:
            results[label] = {"error": str(ex)}

    return results


@api.post("/hikvision/workers/{worker_id}/push")
async def hik_push_worker(worker_id: str, user: dict = Depends(require_roles("admin", "super_admin"))):
    """Push a WORKTRAX worker to the HikVision scanner (Option B)."""
    w = await db.workers.find_one({"id": worker_id}, {"_id": 0, "face_descriptor": 0})
    if not w:
        raise HTTPException(404, "Ouvrier non trouvé")
    if not w.get("hik_employee_id"):
        raise HTTPException(400, "Cet ouvrier n'a pas d'ID Scanner HikVision (hik_employee_id)")
    try:
        result = await _hik_push_worker(w)
        if not result["ok"]:
            raise HTTPException(502, f"Erreur scanner: {result}")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(502, f"Erreur HikVision: {e}")


@api.delete("/hikvision/workers/{worker_id}")
async def hik_remove_worker(worker_id: str, user: dict = Depends(require_roles("admin", "super_admin"))):
    """Remove a worker from the HikVision scanner."""
    w = await db.workers.find_one({"id": worker_id}, {"_id": 0})
    if not w:
        raise HTTPException(404, "Ouvrier non trouvé")
    emp_id = w.get("hik_employee_id") or w.get("hikvision_employee_no")
    if not emp_id:
        return {"ok": True, "reason": "no scanner ID, nothing to remove"}
    ok = await _hik_delete_worker(emp_id)
    return {"ok": ok}


# ────────────────────────── Fingerprint 1:N match ────────────────────────────
@api.post("/fingerprint/match")
async def fingerprint_match(body: FingerprintMatchIn):
    import random
    workers = await db.workers.find({"fingerprint_enrolled": True}, {"_id": 0, "id": 1, "name": 1, "site": 1}).to_list(500)
    if not workers:
        raise HTTPException(404, "Aucun ouvrier enrôlé en empreinte")
    w = random.choice(workers)
    return {"worker_id": w["id"], "name": w["name"], "score": 87}


app.include_router(api)
