# WORKTRAX — Frontend React

Interface React/Vite pour la maquette WORKTRAX d'OPTINET SARLU.

## Modules couverts

- Connexion JWT via l'API Django (`/api/users/login/`) avec sélection du rôle d'interface : Administrateur, RH, Superviseur, Contrôleur, Pompiste.
- Layout principal avec sidebar dynamique, topbar et horloge temps réel.
- Tableau de bord administrateur avec KPI, graphiques CSS et activités récentes.
- Ouvriers : chargement API avec repli mock, catégories, recherche, filtres, tableau, modal d'ajout en 3 étapes et fiche ouvrier.
- Engins : chargement API avec repli mock, onglets Camions, Machines, Carburant & Pompistes.
- Pointage, Caméras, Absences & Congés, Paie, Rapports et Utilisateurs.
- Espaces spécialisés RH, Superviseur, Terminal Contrôleur et Terminal Pompiste.

## Mise à jour locale depuis `/workspace/worktrax`

Le code mis à jour est dans le dossier `frontend/` du dépôt actuel. Pour le lancer :

```bash
cd /workspace/worktrax/frontend
npm install
VITE_API_BASE_URL=http://localhost:8000 npm run dev
```

Puis ouvrez l'URL Vite affichée dans le terminal. Le backend Django doit tourner séparément sur `http://localhost:8000` ou sur l'URL indiquée dans `VITE_API_BASE_URL`.

## Commandes prévues

```bash
npm install
npm run dev
npm run build
```

> Note : dans l'environnement de génération actuel, l'accès au registre npm renvoie `403 Forbidden`; les dépendances n'ont donc pas pu être installées ici.
