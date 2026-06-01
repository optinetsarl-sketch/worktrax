"""
fingerprint_agent.py — Agent multi-lecteurs biométriques WORKTRAX
=================================================================

Modes disponibles :
  python fingerprint_agent.py                     → stdin (test manuel)
  python fingerprint_agent.py --device aet63      → AET63 BioTRUSTKey (PC/SC)
  python fingerprint_agent.py --device cogent     → 3M Cogent CSD330 (VeriFinger SDK)
  python fingerprint_agent.py --device hikvision  → Hikvision ISAPI polling

Pour Hikvision en mode PUSH (recommandé) :
  Configurer le terminal pour envoyer les événements vers
  http://<ip-du-pc>:8000/api/hikvision/event
  L'agent Python n'est alors pas nécessaire pour Hikvision.

Variables d'environnement pour Hikvision polling :
  HIKV_IP        IP du terminal   (ex: 192.168.1.64)
  HIKV_USER      Utilisateur ISAPI (défaut: admin)
  HIKV_PASSWORD  Mot de passe ISAPI

Variables pour Cogent :
  VERIFINGER_SDK  Chemin du SDK VeriFinger 12.4
                  (défaut: C:\\VeriFinger\\Bin\\Win32_x86)
"""

import asyncio
import json
import sys
import logging
import argparse
import os
import time
import threading

try:
    import websockets
except ImportError:
    print("Dépendance manquante. Installez : pip install websockets")
    sys.exit(1)

logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(levelname)s  %(message)s")
log = logging.getLogger("fp-agent")

PORT = 9999
CLIENTS: set = set()
CURRENT_DEVICE = "stdin"  # mis à jour au démarrage

DEVICE_LABELS = {
    "stdin":      "Test clavier (stdin)",
    "aet63":      "AET63 BioTRUSTKey",
    "cogent":     "3M Cogent CSD330",
    "hikvision":  "Hikvision DS-K1T805MBFWX",
}

DEVICE_INSTRUCTIONS = {
    "stdin":      "Tapez <worker_id>|<Nom> dans le terminal de l'agent",
    "aet63":      "Posez le doigt sur votre token AET63 BioTRUSTKey (USB)",
    "cogent":     "Posez le doigt sur le scanner 3M Cogent CSD330 (USB)",
    "hikvision":  "Posez le doigt sur le terminal Hikvision DS-K1T805MBFWX",
}


# ─────────────────────────── Diffusion WebSocket ─────────────────────────────

async def broadcast(payload: dict):
    if not CLIENTS:
        log.warning("Aucun client WORKTRAX connecté — scan ignoré : %s", payload)
        return
    msg = json.dumps(payload, ensure_ascii=False)
    dead = set()
    for ws in list(CLIENTS):
        try:
            await ws.send(msg)
            log.info("→ Envoyé : %s", payload)
        except Exception:
            dead.add(ws)
    CLIENTS -= dead


async def ws_handler(websocket):
    CLIENTS.add(websocket)
    log.info("[WS] Client connecté (%d total)", len(CLIENTS))
    # Annoncer le lecteur actif au client qui vient de se connecter
    try:
        hello = {
            "type": "hello",
            "device": CURRENT_DEVICE,
            "label": DEVICE_LABELS.get(CURRENT_DEVICE, CURRENT_DEVICE),
            "instruction": DEVICE_INSTRUCTIONS.get(CURRENT_DEVICE, ""),
        }
        await websocket.send(json.dumps(hello))
    except Exception:
        pass
    try:
        async for _ in websocket:
            pass
    except Exception:
        pass
    finally:
        CLIENTS.discard(websocket)
        log.info("[WS] Client déconnecté (%d restants)", len(CLIENTS))


# ─────────────────────────── Mode test stdin ─────────────────────────────────

async def stdin_mode(queue: asyncio.Queue):
    log.info("Mode test stdin — Format : <worker_id>|<Nom Complet>  puis Entrée")
    loop = asyncio.get_event_loop()
    while True:
        try:
            line = await loop.run_in_executor(None, sys.stdin.readline)
        except (EOFError, KeyboardInterrupt):
            break
        line = line.strip()
        if not line:
            continue
        parts = line.split("|", 1)
        await queue.put({
            "worker_id": parts[0].strip(),
            "name": parts[1].strip() if len(parts) > 1 else parts[0].strip(),
        })


# ─────────────────────────── AET63 BioTRUSTKey (PC/SC) ──────────────────────
#
# Prérequis :
#   pip install pyscard
#   Installer pilote PC/SC ACS (MSI Windows 10) depuis https://www.acs.com.hk/
#   Enrôler les ouvriers via le logiciel ACS BioAdmin
#
# Chaque AET63 est un token personnel — l'ouvrier pose son doigt sur SON token.
# L'UID du token doit correspondre au worker_id enregistré dans WORKTRAX.

async def aet63_mode(queue: asyncio.Queue):
    try:
        from smartcard.System import readers as get_readers
        from smartcard.util import toHexString
    except ImportError:
        log.error("pyscard non installé. Exécutez : pip install pyscard")
        log.error("Puis installer le pilote PC/SC ACS depuis https://www.acs.com.hk/")
        return

    log.info("Mode AET63 BioTRUSTKey — En attente de contact du doigt sur un token…")
    loop = asyncio.get_event_loop()

    def scan_loop():
        last_uid = None
        last_time = 0
        last_readers_log = 0
        while True:
            try:
                rlist = get_readers()
                # Loguer les lecteurs détectés (max 1x toutes les 10s pour ne pas spammer)
                now_t = time.time()
                if now_t - last_readers_log > 10:
                    last_readers_log = now_t
                    if rlist:
                        log.info("Lecteurs PC/SC détectés : %s", [r.name for r in rlist])
                    else:
                        log.warning("Aucun lecteur PC/SC détecté — vérifier le branchement USB et le pilote ACS")
                for reader in rlist:
                    name_up = reader.name.upper()
                    # Accepter AET63, BioTRUSTKey, tout lecteur ACS, ou n'importe quel lecteur d'empreinte
                    if any(k in name_up for k in ["AET63", "BIOTRUST", "ACS", "FINGERPRINT", "BIOMETRIC", "SMARTCARD", "CCID"]) or True:
                        try:
                            conn = reader.createConnection()
                            conn.connect()

                            # Lire UID via APDU GET DATA (ISO 7816)
                            apdu_get_uid = [0xFF, 0xCA, 0x00, 0x00, 0x00]
                            resp, sw1, sw2 = conn.transmit(apdu_get_uid)

                            if sw1 == 0x90 and resp:
                                uid = toHexString(resp).replace(" ", "").upper()
                                now = time.time()
                                # Anti-rebond : ignorer même UID pendant 3 secondes
                                if uid != last_uid or (now - last_time) > 3:
                                    last_uid = uid
                                    last_time = now
                                    payload = {"worker_id": uid, "name": uid, "source": "aet63"}
                                    asyncio.run_coroutine_threadsafe(queue.put(payload), loop)
                                    log.info("AET63 → UID : %s", uid)
                            conn.disconnect()
                        except Exception:
                            pass
            except Exception as e:
                log.debug("AET63 scan : %s", e)
            time.sleep(0.5)

    threading.Thread(target=scan_loop, daemon=True).start()
    await asyncio.Event().wait()


# ─────────────────────────── 3M Cogent CSD330 (VeriFinger SDK) ──────────────
#
# Prérequis :
#   1. Télécharger VeriFinger SDK 12.4 (Neurotechnology) — évaluation gratuite :
#      https://www.neurotechnology.com/verifinger.html
#   2. Installer le SDK — cocher le module CSD330
#   3. IMPORTANT : Utiliser Python 32 bits (le SDK CSD330 est 32 bits uniquement)
#      Télécharger Python 32 bits : https://www.python.org/downloads/windows/
#      Choisir "Windows installer (32-bit)"
#   4. Définir variable d'environnement VERIFINGER_SDK
#
# Enrôlement :
#   L'ouvrier pose le doigt à l'étape 3 de l'ajout — le template est stocké en DB.
#   Pendant le pointage, le CSD330 capture → compare contre tous les templates DB.

async def cogent_mode(queue: asyncio.Queue):
    sdk_path = os.environ.get("VERIFINGER_SDK", r"C:\VeriFinger\Bin\Win32_x86")
    worktrax_url = os.environ.get("WORKTRAX_URL", "http://localhost:8000")

    try:
        import ctypes
        dll_path = os.path.join(sdk_path, "NFScanner.dll")
        sdk = ctypes.CDLL(dll_path)
        log.info("VeriFinger SDK chargé : %s", dll_path)
    except (OSError, FileNotFoundError) as e:
        log.error("SDK VeriFinger introuvable : %s", e)
        log.error("Chemin attendu : %s", sdk_path)
        log.error("Définir VERIFINGER_SDK ou installer VeriFinger 12.4")
        return

    log.info("Mode 3M Cogent CSD330 — En attente de pose du doigt…")
    loop = asyncio.get_event_loop()

    def scan_loop():
        import ctypes
        while True:
            try:
                # Ouvrir scanner (index 0 = premier scanner USB détecté)
                if sdk.NFScannerOpen(0) == 0:
                    img_buf = ctypes.create_string_buffer(500 * 500)
                    w, h = ctypes.c_int(500), ctypes.c_int(500)

                    # Attendre pose du doigt et capturer
                    ret = sdk.NFScannerCapture(0, img_buf, ctypes.byref(w), ctypes.byref(h))
                    if ret == 0:
                        log.info("CSD330 — Empreinte capturée (%dx%d px)", w.value, h.value)

                        # Envoyer l'image brute au backend pour matching 1:N
                        import urllib.request
                        import base64
                        img_b64 = base64.b64encode(img_buf.raw[:w.value * h.value]).decode()
                        body = json.dumps({
                            "image_b64": img_b64,
                            "width": w.value,
                            "height": h.value,
                            "dpi": 500,
                        }).encode()
                        req = urllib.request.Request(
                            f"{worktrax_url}/api/fingerprint/match",
                            data=body,
                            headers={"Content-Type": "application/json"},
                            method="POST",
                        )
                        try:
                            with urllib.request.urlopen(req, timeout=3) as resp:
                                result = json.loads(resp.read())
                                if result.get("worker_id"):
                                    payload = {
                                        "worker_id": result["worker_id"],
                                        "name": result.get("name", ""),
                                        "source": "cogent_csd330",
                                    }
                                    asyncio.run_coroutine_threadsafe(queue.put(payload), loop)
                        except Exception as e:
                            log.error("Matching backend : %s", e)

                    sdk.NFScannerClose(0)
            except Exception as e:
                log.error("CSD330 erreur : %s", e)
            time.sleep(1)

    threading.Thread(target=scan_loop, daemon=True).start()
    await asyncio.Event().wait()


# ─────────────────────────── Hikvision ISAPI polling ─────────────────────────
#
# Alternative au mode PUSH (webhook backend).
# Utiliser ce mode si le terminal ne peut pas joindre le PC directement.
#
# Configurer :
#   set HIKV_IP=192.168.1.64
#   set HIKV_USER=admin
#   set HIKV_PASSWORD=motdepasse
#   python fingerprint_agent.py --device hikvision

async def hikvision_mode(queue: asyncio.Queue):
    hikv_ip = os.environ.get("HIKV_IP", "")
    hikv_user = os.environ.get("HIKV_USER", "admin")
    hikv_pass = os.environ.get("HIKV_PASSWORD", "")

    if not hikv_ip:
        log.error("Définir HIKV_IP (IP du terminal Hikvision)")
        log.error("Exemple : set HIKV_IP=192.168.1.64")
        return
    if not hikv_pass:
        log.error("Définir HIKV_PASSWORD (mot de passe admin du terminal)")
        return

    log.info("Mode Hikvision polling — Terminal : http://%s", hikv_ip)
    loop = asyncio.get_event_loop()
    seen_events: set = set()

    def digest_get(url: str) -> dict:
        import urllib.request
        pm = urllib.request.HTTPPasswordMgrWithDefaultRealm()
        pm.add_password(None, url, hikv_user, hikv_pass)
        handler = urllib.request.HTTPDigestAuthHandler(pm)
        opener = urllib.request.build_opener(handler)
        req = urllib.request.Request(url, headers={"Accept": "application/json"})
        with opener.open(req, timeout=5) as resp:
            return json.loads(resp.read().decode("utf-8", errors="replace"))

    def poll_loop():
        from datetime import datetime, timezone
        while True:
            try:
                url = f"http://{hikv_ip}/ISAPI/AccessControl/AcsEvent?format=json"
                data = digest_get(url)
                events = data.get("AcsEvent", {}).get("InfoList", [])
                for ev in reversed(events):  # plus ancien en premier
                    ev_id = f"{ev.get('major')}-{ev.get('minor')}-{ev.get('time', '')}"
                    if ev_id in seen_events:
                        continue
                    seen_events.add(ev_id)
                    emp_no = str(ev.get("employeeNoString", "")).strip()
                    name = ev.get("name", "Inconnu").strip()
                    if emp_no and emp_no != "0":
                        payload = {
                            "worker_id": emp_no,
                            "name": name,
                            "source": "hikvision_poll",
                        }
                        asyncio.run_coroutine_threadsafe(queue.put(payload), loop)
                        log.info("Hikvision → %s (%s)", name, emp_no)
            except Exception as e:
                log.warning("Hikvision polling : %s", e)
            time.sleep(2)

    threading.Thread(target=poll_loop, daemon=True).start()
    await asyncio.Event().wait()


# ─────────────────────────── Dispatch & Main ─────────────────────────────────

async def dispatch(queue: asyncio.Queue):
    while True:
        payload = await queue.get()
        await broadcast(payload)


DEVICE_MODES = {
    "stdin": stdin_mode,
    "aet63": aet63_mode,
    "cogent": cogent_mode,
    "hikvision": hikvision_mode,
}


async def main(port: int, device: str):
    global CURRENT_DEVICE
    CURRENT_DEVICE = device
    scan_queue: asyncio.Queue = asyncio.Queue()
    mode_fn = DEVICE_MODES[device]

    log.info("═══════════════════════════════════════════")
    log.info("  Agent biométrique WORKTRAX")
    log.info("  WebSocket : ws://localhost:%d", port)
    log.info("  Lecteur   : %s", device.upper())
    log.info("═══════════════════════════════════════════")
    log.info("En attente de connexion depuis le terminal contrôleur…")

    async with websockets.serve(ws_handler, "localhost", port):
        await asyncio.gather(dispatch(scan_queue), mode_fn(scan_queue))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Agent lecteur biométrique WORKTRAX",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemples :
  python fingerprint_agent.py                     # test stdin
  python fingerprint_agent.py --device aet63      # AET63 BioTRUSTKey
  python fingerprint_agent.py --device cogent     # 3M Cogent CSD330
  python fingerprint_agent.py --device hikvision  # Hikvision ISAPI polling
        """,
    )
    parser.add_argument("--port", type=int, default=PORT, help=f"Port WebSocket (défaut : {PORT})")
    parser.add_argument(
        "--device",
        choices=list(DEVICE_MODES.keys()),
        default="stdin",
        help="Lecteur à utiliser (défaut : stdin)",
    )
    args = parser.parse_args()
    try:
        asyncio.run(main(args.port, args.device))
    except KeyboardInterrupt:
        log.info("Agent arrêté.")
