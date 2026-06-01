# WORKTRAX — Gestion de chantiers multisites
**OPTINET SARLU** — Application de gestion des ouvriers, engins et chantiers.

---

## Prérequis

- Python 3.13+
- Node.js 18+
- npm

---

## Démarrage du Backend (Django)

### 1. Installer les dépendances
```powershell
cd C:\Users\pc\Desktop\worktrax\backend
py -m pip install -r backend\requirements.txt
```

### 2. Appliquer les migrations
```powershell
py manage.py migrate
```

### 3. Créer les utilisateurs par défaut (première fois uniquement)
```powershell
py create_users.py
```

### 4. Lancer le serveur
```powershell
py manage.py runserver
```

> Backend disponible sur **http://127.0.0.1:8000**

---

## Démarrage du Frontend (React / Vite)

### 1. Installer les dépendances (première fois uniquement)
```powershell
cd C:\Users\pc\Desktop\worktrax\frontend
npm install
```

### 2. Lancer le serveur de développement
```powershell
npm run dev
```

> Frontend disponible sur **http://localhost:5173**

---

## Commandes de démarrage rapide (deux terminaux)

> **Avant de lancer** : vérifier que les ports 8000 et 5173 sont libres.
> Si occupés, tuer les processus bloquants :
> ```powershell
> # Trouver le PID qui bloque le port
> netstat -ano | findstr ":8000"
> netstat -ano | findstr ":5173"
> # Tuer le processus (remplacer 1234 par le vrai PID)
> taskkill /PID 1234 /F
> ```

**Terminal 1 — Backend**
```powershell
cd C:\Users\pc\Desktop\worktrax\backend
py manage.py runserver
```

**Terminal 2 — Frontend**
```powershell
cd C:\Users\pc\Desktop\worktrax\frontend
npm run dev
```

cd C:\Users\pc\Desktop\worktrax\backend
py manage.py migrate
py create_users.py


> **Important** : le fichier `apps/fingerprint/utils.py` doit rester avec le `try/except` autour de `import face_recognition`.
> Ne pas le remettre à l'original sans `try/except` — cela fait planter le backend au démarrage car `dlib` n'est pas installé.

---

## Comptes par défaut

| Rôle | Username | Password |
|---|---|---|
| Administrateur | `admin` | `admin123` |
| RH | `rh` | `rh123` |
| Superviseur | `superviseur` | `sup123` |
| Contrôleur | `controleur` | `ctrl123` |
| Pompiste | `pompiste` | `pump123` |

---

## Routes API principales

| Méthode | Endpoint | Description |
|---|---|---|
| POST | `/api/users/login/` | Connexion |
| POST | `/api/token/refresh/` | Rafraîchir le token JWT |
| GET | `/api/worktrax/workers/` | Liste des ouvriers |
| POST | `/api/worktrax/workers-create/` | Créer un ouvrier |
| GET | `/api/worktrax/machines/` | Liste des engins |
| GET | `/api/worktrax/sites/` | Liste des chantiers |
| GET | `/api/worktrax/societes/` | Liste des sociétés |
| GET | `/api/users/usersliste/` | Liste des utilisateurs |
| GET | `/admin/` | Interface admin Django |

---

## Notes

- **Reconnaissance faciale** désactivée par défaut — `dlib` nécessite Visual C++ Build Tools.
  Pour l'activer : installer [VS Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) avec le composant **"Développement Desktop en C++"**, puis :
  ```powershell
  pip install dlib==20.0.1 face-recognition==1.3.0
  ```
- La base de données utilisée est **SQLite** (`db.sqlite3`) — fichier local, pas de serveur à configurer.
