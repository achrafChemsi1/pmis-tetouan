# PMIS Tétouan - Project Management Information System

> **Système de Gestion de l'Information des Projets (PMIS)** pour la Division d'Équipement de la Préfecture de Tétouan, Ministère de l'Intérieur, Maroc

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-blue.svg)](https://www.mysql.com/)
[![Node.js](https://img.shields.io/badge/Node.js-20_LTS-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-61dafb.svg)](https://reactjs.org/)

## 📋 Table des Matières

- [Vue d'ensemble](#vue-densemble)
- [Fonctionnalités principales](#fonctionnalités-principales)
- [Architecture technique](#architecture-technique)
- [Structure du projet](#structure-du-projet)
- [Installation](#installation)
- [Documentation](#documentation)
- [Contribuer](#contribuer)
- [Licence](#licence)

## 🎯 Vue d'ensemble

PMIS Tétouan est un système de gestion de projets d'entreprise conçu spécifiquement pour la Division d'Équipement de la Préfecture de Tétouan. Le système permet de gérer efficacement les projets d'infrastructure, l'inventaire d'équipement, les budgets, les achats et la conformité réglementaire.

### Contexte organisationnel

- **Organisation**: Préfecture de Tétouan, Ministère de l'Intérieur
- **Département**: Division d'Équipement
- **Responsabilités**: Gestion des projets d'infrastructure, acquisition d'équipements, dépenses d'investissement, maintenance des bâtiments publics
- **Utilisateurs cibles**: 100+ utilisateurs simultanés, évolutif jusqu'à 1000+

## ✨ Fonctionnalités principales

### 📊 Gestion de projets
- Création et suivi des projets d'infrastructure
- Gestion des jalons et livrables
- Suivi du calendrier et des retards
- Tableaux de bord de progression en temps réel
- Dépendances et chemin critique

### 💰 Gestion budgétaire
- Allocation budgétaire par catégorie
- Suivi des dépenses réelles vs prévues
- Alertes de dépassement budgétaire (50%, 75%, 90%)
- Amendements budgétaires avec workflow d'approbation
- Prévisions de coûts finaux

### 🔧 Gestion d'équipement
- Inventaire complet des équipements (véhicules, machines, outils)
- Suivi de l'état et de l'emplacement
- Planification et historique de maintenance
- Allocation d'équipements aux projets
- Calcul de dépréciation

### 🛒 Gestion des achats
- Demandes d'achat avec workflow d'approbation multi-niveaux
- Gestion des fournisseurs et vendeurs
- Bons de commande et suivi
- Réception de marchandises
- Suivi des factures et paiements

### 👥 Gestion des ressources
- Allocation du personnel aux projets
- Suivi de la charge de travail
- Détection des sur-allocations
- Gestion des compétences

### 📈 Rapports et analyses
- Tableaux de bord exécutifs
- Rapports de statut de projet
- Analyses budgétaires
- Rapports de conformité pour le Ministère
- Export PDF et Excel

### 🔐 Sécurité et audit
- Contrôle d'accès basé sur les rôles (RBAC)
- 6 rôles utilisateurs prédéfinis
- Journal d'audit complet
- Conformité avec les réglementations marocaines
- Chiffrement des données sensibles (AES-256)

## 🏗️ Architecture technique

### Stack technologique

**Frontend**
- React 18+ avec TypeScript
- Ant Design / Material-UI (composants UI)
- React Query (gestion d'état et cache)
- i18next (internationalisation Fr/En)
- Chart.js (visualisation de données)

**Backend**
- Node.js 20 LTS
- NestJS (framework)
- TypeORM / Prisma (ORM)
- Passport.js (authentification JWT)
- Bull (files d'attente)

**Base de données**
- MySQL 8.0+ (base de données principale)
- Redis 7+ (cache et sessions)
- MinIO (stockage d'objets S3-compatible)

**Infrastructure**
- Docker (conteneurisation)
- Kubernetes (orchestration)
- NGINX/Traefik (reverse proxy)
- Prometheus + Grafana (monitoring)
- ELK Stack (logs centralisés)

### Architecture des données

- **21 tables** normalisées (3NF)
- **120+ index** pour performance optimale
- **6 vues** pré-construites pour requêtes courantes
- Support du **multi-langue** (français/anglais)
- **Soft deletes** pour traçabilité historique

## 📁 Structure du projet

```
pmis-tetouan/
├── docs/                          # Documentation complète
│   ├── architecture/             # Diagrammes d'architecture
│   │   ├── system-architecture.md
│   │   ├── data-flow-diagrams.md
│   │   └── deployment-architecture.md
│   ├── database/                 # Documentation base de données
│   │   ├── schema.md
│   │   ├── erd.png
│   │   └── data-dictionary.md
│   ├── api/                      # Documentation API
│   │   └── api-reference.md
│   ├── user-guides/              # Guides utilisateurs
│   │   ├── admin-guide.md
│   │   ├── project-manager-guide.md
│   │   └── equipment-officer-guide.md
│   └── development/              # Guides développement
│       ├── setup-guide.md
│       ├── coding-standards.md
│       └── deployment-guide.md
├── database/                      # Scripts de base de données
│   ├── schema/                   # Schéma DDL
│   │   ├── 01-create-database.sql
│   │   ├── 02-create-tables.sql
│   │   ├── 03-create-indexes.sql
│   │   ├── 04-create-views.sql
│   │   └── 05-create-constraints.sql
│   ├── migrations/               # Migrations versionnées
│   ├── seeds/                    # Données initiales
│   │   ├── 01-roles.sql
│   │   ├── 02-permissions.sql
│   │   ├── 03-role-permissions.sql
│   │   ├── 04-system-settings.sql
│   │   └── 05-admin-user.sql
│   └── queries/                  # Requêtes métier courantes
│       └── business-queries.sql
├── backend/                       # Application backend
│   ├── src/
│   │   ├── modules/              # Modules métier
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── projects/
│   │   │   ├── budget/
│   │   │   ├── equipment/
│   │   │   ├── procurement/
│   │   │   ├── approvals/
│   │   │   ├── documents/
│   │   │   ├── reports/
│   │   │   └── audit/
│   │   ├── common/               # Code partagé
│   │   ├── config/               # Configuration
│   │   └── main.ts               # Point d'entrée
│   ├── test/                     # Tests
│   ├── package.json
│   └── tsconfig.json
├── frontend/                      # Application frontend
│   ├── src/
│   │   ├── components/           # Composants React
│   │   ├── pages/                # Pages
│   │   ├── services/             # Services API
│   │   ├── hooks/                # Custom hooks
│   │   ├── utils/                # Utilitaires
│   │   ├── i18n/                 # Traductions
│   │   └── App.tsx               # Composant racine
│   ├── public/
│   ├── package.json
│   └── tsconfig.json
├── infrastructure/                # Infrastructure as Code
│   ├── docker/
│   │   ├── docker-compose.yml
│   │   ├── docker-compose.prod.yml
│   │   └── Dockerfile.backend
│   ├── kubernetes/
│   │   ├── deployments/
│   │   ├── services/
│   │   └── configmaps/
│   └── nginx/
│       └── nginx.conf
├── scripts/                       # Scripts utilitaires
│   ├── setup-dev.sh
│   ├── backup-db.sh
│   └── deploy.sh
├── .github/                       # GitHub workflows
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── .gitignore
├── LICENSE
└── README.md
```

## 🚀 Installation

### Prérequis

- Node.js 20 LTS ou supérieur
- MySQL 8.0 ou supérieur
- Redis 7.0 ou supérieur
- Docker et Docker Compose (optionnel)
- Git

### Installation locale

1. **Cloner le repository**
   ```bash
   git clone https://github.com/achrafChemsi1/pmis-tetouan.git
   cd pmis-tetouan
   ```

2. **Configurer la base de données**
   ```bash
   # Se connecter à MySQL
   mysql -u root -p
   
   # Exécuter les scripts dans l'ordre
   source database/schema/01-create-database.sql
   source database/schema/02-create-tables.sql
   source database/schema/03-create-indexes.sql
   source database/schema/04-create-views.sql
   source database/seeds/01-roles.sql
   source database/seeds/02-permissions.sql
   source database/seeds/03-role-permissions.sql
   source database/seeds/04-system-settings.sql
   source database/seeds/05-admin-user.sql
   ```

3. **Configurer le backend**
   ```bash
   cd backend
   npm install
   
   # Copier et configurer les variables d'environnement
   cp .env.example .env
   # Éditer .env avec vos paramètres
   
   # Démarrer en mode développement
   npm run start:dev
   ```

4. **Configurer le frontend**
   ```bash
   cd frontend
   npm install
   
   # Copier et configurer les variables d'environnement
   cp .env.example .env
   
   # Démarrer en mode développement
   npm start
   ```

5. **Accéder à l'application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Utilisateur par défaut: `admin` / `Admin@2025` (à changer immédiatement)

### Installation avec Docker

```bash
# Construire et démarrer tous les services
docker-compose up -d

# Vérifier les logs
docker-compose logs -f

# Arrêter les services
docker-compose down
```

## 📚 Documentation

La documentation complète est disponible dans le dossier `/docs`:

- **[Architecture système](docs/architecture/system-architecture.md)** - Architecture détaillée du système
- **[Schéma de base de données](docs/database/schema.md)** - Structure complète de la BD
- **[Guide de développement](docs/development/setup-guide.md)** - Configuration de l'environnement de dev
- **[Guide de déploiement](docs/development/deployment-guide.md)** - Déploiement en production
- **[Référence API](docs/api/api-reference.md)** - Documentation des endpoints API
- **[Guides utilisateurs](docs/user-guides/)** - Guides par rôle utilisateur

## 🎯 Roadmap

### Phase 1: MVP (Mois 0-3) ✅
- [x] Architecture système complète
- [x] Schéma de base de données
- [ ] Authentification et gestion des utilisateurs
- [ ] Gestion de projets (CRUD)
- [ ] Gestion budgétaire de base
- [ ] Gestion d'inventaire d'équipement
- [ ] Tableaux de bord principaux
- [ ] Rapports de base

### Phase 2: Fonctionnalités avancées (Mois 3-6)
- [ ] Module de procurement complet
- [ ] Gestion des jalons et livrables
- [ ] Gestion documentaire avec versioning
- [ ] Notifications par email
- [ ] Rapports avancés
- [ ] Allocation des ressources

### Phase 3: Optimisations (Mois 6-12)
- [ ] Design responsive mobile
- [ ] Diagrammes de Gantt
- [ ] Gestion des risques
- [ ] Analyses prédictives avec IA
- [ ] Intégration calendrier
- [ ] Signature numérique

## 👥 Rôles utilisateurs

1. **ADMIN** - Administrateur système (accès complet)
2. **PROJECT_MANAGER** - Chef de projet (gestion de projets)
3. **EQUIPMENT_OFFICER** - Agent matériel (gestion équipements)
4. **FINANCE_CONTROLLER** - Contrôleur financier (approbations budgets/achats)
5. **SUPERVISOR** - Superviseur (lecture + rapports)
6. **VIEWER** - Lecteur (lecture limitée aux projets assignés)

## 🔒 Sécurité

- **Authentification**: JWT avec refresh tokens
- **Chiffrement**: AES-256 pour données au repos, TLS 1.3 en transit
- **RBAC**: Contrôle d'accès basé sur les rôles avec permissions granulaires
- **Audit**: Traçabilité complète de toutes les opérations
- **Conformité**: Respect du Décret n° 2-24-921 (cloud services Maroc)
- **Sécurité réseau**: WAF, DDoS protection, IP whitelisting

## 📊 Performance

- **Temps de chargement**: < 2 secondes
- **Temps de réponse API**: < 500ms (95e percentile)
- **Utilisateurs simultanés**: 100+ (initial), 1000+ (évolutif)
- **Disponibilité**: 99.5% (uptime)
- **Taille BD**: ~500 MB (an 1), ~5-10 GB (an 5)

## 🤝 Contribuer

Les contributions sont les bienvenues! Veuillez suivre ces étapes:

1. Fork le projet
2. Créez votre branche de fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Poussez vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

Consultez [CONTRIBUTING.md](CONTRIBUTING.md) pour plus de détails.

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 📧 Contact

**Préfecture de Tétouan - Division d'Équipement**
- Email: contact@prefecture-tetouan.ma
- Site web: [www.prefecture-tetouan.ma](https://www.prefecture-tetouan.ma)

## 🙏 Remerciements

- Ministère de l'Intérieur du Maroc
- Équipe de la Division d'Équipement
- Contributeurs open-source

---

**Développé avec ❤️ pour la Préfecture de Tétouan**
