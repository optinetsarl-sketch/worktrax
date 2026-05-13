# 🎯 WORKTRAX - Frontend

**Système de Gestion Multisites pour OPTINET SARLU**

---

## 📋 Table des matières

1. [Introduction](#introduction)
2. [Technologies utilisées](#technologies-utilisées)
3. [Structure du projet](#structure-du-projet)
4. [Conventions de développement](#conventions-de-développement)
5. [Gestion des rôles (RBAC)](#gestion-des-rôles-rbac)
6. [Modules principaux](#modules-principaux)
7. [Comment lancer le frontend](#comment-lancer-le-frontend)
8. [Développement & Bonnes pratiques](#développement--bonnes-pratiques)
9. [Roadmap & Évolutions futures](#roadmap--évolutions-futures)

---

## Introduction

**WORKTRAX** est une application web moderne de gestion de chantiers BTP multisites.  
Le frontend est une **Single Page Application (SPA)** développée en HTML5, CSS3 et JavaScript Vanilla, conçue pour être :

- Performante
- Responsive (PC, Tablette, Mobile)
- Sécurisée (RBAC par rôle)
- Facilement maintenable et évolutive (préparation à Vue.js / React)

---

## Technologies utilisées

| Technologie       | Usage                          | Version / Remarque          |
|-------------------|--------------------------------|-----------------------------|
| HTML5             | Structure                      | Sémantique                  |
| CSS3              | Design & Animations            | Variables CSS + Flex/Grid   |
| JavaScript (ES6+) | Logique métier                 | Vanilla JS                  |
| Chart.js          | Graphiques                     | v4.4.1                      |
| Font Awesome / Emoji | Icônes                      | -                           |

**Pas de framework lourd** pour l’instant → performance et simplicité maximale.

---

## Structure du projet

```bash
frontend/
├── index.html                    # Point d'entrée unique
├── assets/
│   ├── css/
│   │   ├── style.css             # Styles principaux
│   │   ├── components.css        # Composants réutilisables
│   │   └── responsive.css
│   ├── js/
│   │   ├── app.js                # Router + configuration globale
│   │   ├── auth.js               # Login + gestion rôle
│   │   ├── core/                 # Modules partagés
│   │   │   ├── utils.js
│   │   │   ├── rbac.js
│   │   │   └── clock.js
│   │   ├── modules/
│   │   │   ├── dashboard.js
│   │   │   ├── ouvriers.js
│   │   │   ├── engins.js
│   │   │   ├── pointage.js
│   │   │   ├── pompiste.js
│   │   │   ├── rh.js
│   │   │   └── cameras.js
│   └── img/
├── components/                   # Blocs réutilisables (modals, tables...)
├── docs/
│   └── README-FRONTEND.md        # Ce fichier
└── config/
    └── roles-config.js           # Permissions par rôle
```

---

## Gestion des rôles (RBAC)

L’application gère **5 rôles** conformément au guide utilisateur :

- **Administrateur** → Accès total
- **Superviseur** → Son chantier uniquement
- **RH** → Personnel, absences, paie
- **Contrôleur** → Pointage biométrique + journal
- **Pompiste** → Distribution carburant

**Fichier clé** : `config/roles-config.js`

---

## Modules principaux

| Module              | Fichier principal       | Fonctionnalités clés                     |
|---------------------|-------------------------|------------------------------------------|
| Dashboard           | `dashboard.js`          | KPIs, graphiques, activités récentes     |
| Ouvriers            | `ouvriers.js`           | Liste, filtres, fiches détaillées        |
| Engins              | `engins.js`             | Camions, Machines, Carburant             |
| Pointage            | `pointage.js`           | Terminal contrôleur + journal            |
| Pompiste            | `pompiste.js`           | Double biométrie + distribution          |
| RH                  | `rh.js`                 | Absences, congés, paie                   |
| Caméras             | `cameras.js`            | Surveillance IP                          |

---

## Comment lancer le frontend

1. Ouvrir `index.html` directement dans le navigateur
2. Ou utiliser un serveur local :

```bash
# Avec Python
python -m http.server 5500

# Ou avec Live Server (VS Code)
```

**Comptes de démo** (voir Guide Utilisateur) :
- `admin@optinet.tg` / `admin123`
- `superviseur@optinet.tg` / `super123`
- etc.

---

## Développement & Bonnes pratiques

- Utiliser les **variables CSS** (`:root`)
- Séparer clairement **HTML / CSS / JS**
- Commenter les fonctions importantes
- Respecter le **Guide Utilisateur** à la lettre
- Préparer l’architecture pour une migration progressive vers un framework (Vue 3 ou React)

---

**Auteur** : Optinet SARLU - Équipe Développement  
**Date de création** : Mai 2026  
**Statut** : En cours de structuration professionnelle