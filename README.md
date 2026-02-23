# Lingua Hub - Plateforme d'apprentissage des langues

Une plateforme innovante pour l'apprentissage des langues avec sessions vidéo en direct, animées par des professeurs ou des agents IA.

## 🚀 Démarrage rapide

**Nouveau? Commencez ici:** [QUICK-START.md](./QUICK-START.md)

## 📚 Documentation

- **[Guide de démarrage rapide](./QUICK-START.md)** - Démarrer l'application en 5 minutes
- **[Checklist de configuration](./CONFIGURATION-CHECKLIST.md)** - Vérifier que tout est bien configuré
- **[Intégration Frontend-Backend-LiveKit](./FRONTEND-BACKEND-LIVEKIT-INTEGRATION.md)** - Documentation technique complète
- **[Résumé de l'intégration](./INTEGRATION-SUMMARY.md)** - Modifications et améliorations
- **[Tests LiveKit](./easyLearn/src/test/java/com/free/easyLearn/service/README-LIVEKIT-TESTS.md)** - Documentation des tests backend

## 🏗️ Architecture

```
Frontend (React + Vite) ←→ Backend (Spring Boot) ←→ LiveKit Server
         ↓                          ↓
    Port 5173              Port 8081 + PostgreSQL
```

## ✨ Fonctionnalités

- 🎓 **Sessions de cours en direct** avec vidéo/audio
- 👨‍🏫 **Animation par professeur** ou agent IA
- 📊 **Tableau de bord** pour étudiants et professeurs
- 🎯 **Quiz interactifs** et évaluations
- 📈 **Suivi de progression** et statistiques
- 🏆 **Système de gamification** avec badges
- 💬 **Chat en temps réel** pendant les sessions

## 🛠️ Technologies

### Frontend
- React 18 + TypeScript
- Vite
- TailwindCSS + shadcn/ui
- LiveKit React Components
- Framer Motion

### Backend
- Spring Boot 3.2.0
- Java 17
- PostgreSQL 15
- LiveKit Server SDK
- JWT Authentication

### Services externes
- **LiveKit** - Serveur WebRTC pour vidéo/audio
- **PostgreSQL** - Base de données
- **Docker** - Containerisation

## 📋 Prérequis

- Node.js 18+
- Java 17+
- Docker
- PostgreSQL 15+ (ou via Docker)

## 🚀 Installation et démarrage

### 1. Cloner le repository

```bash
git clone <YOUR_GIT_URL>
cd lingua-hub
```

### 2. Configuration

**Frontend (.env) — note for Docker/nginx**
```env
# when running inside the lingua-hub container we route through nginx
# the frontend can then use relative URLs for both services
VITE_API_URL=/api
VITE_AI_ASSISTANT_URL=/assistant
VITE_LIVEKIT_URL=ws://localhost:7880
# (during local dev you may still point to http://localhost:8081/api etc.)
```

**Backend (easyLearn/src/main/resources/application.yml)**
```yaml
livekit:
  api-key: devkey
  api-secret: secret
  url: ws://localhost:7880
```

### 3. Démarrer les services

**Terminal 1 - PostgreSQL**
```powershell
docker run --rm -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=lingua_hub postgres:15
```

**Terminal 2 - LiveKit**
```powershell
docker run --rm -p 7880:7880 -p 7881:7881 -p 7882:7882/udp livekit/livekit-server --dev
```

**Terminal 3 - Backend**
```powershell
cd easyLearn
.\mvnw.cmd spring-boot:run
```

**Terminal 4 - Frontend**
```powershell
npm install
npm run dev
```

### 4. Accéder à l'application

- Frontend: http://localhost:5173
- Backend API: http://localhost:8081/api
- Swagger: http://localhost:8081/swagger-ui.html

## 🧪 Tests

```powershell
# Tests backend complets
cd easyLearn
.\mvnw.cmd test

# Tests LiveKit uniquement
.\mvnw.cmd test -Dtest=LiveKitServiceTest
```

**Résultat attendu**: Tests run: 11, Failures: 0, Errors: 0 ✅

## 📖 Comment utiliser

### En tant que Professeur

1. Créer un compte professeur
2. Aller sur "Sessions" → "Create Session"
3. Remplir les détails (nom, langue, niveau, objectif)
4. Cliquer "Start Session" pour démarrer
5. La session vidéo se lance automatiquement

### En tant qu'Étudiant

1. Créer un compte étudiant
2. Aller sur "My Sessions"
3. Rejoindre une session LIVE
4. Interagir avec le professeur et les autres étudiants

## 🔧 Troubleshooting

Consultez [QUICK-START.md](./QUICK-START.md#troubleshooting-courant) pour les solutions aux problèmes courants.

## 🤝 Contribution

Ce projet est en développement actif. Voir [INTEGRATION-SUMMARY.md](./INTEGRATION-SUMMARY.md) pour les dernières modifications.

## 📝 Développement local

## How can I edit this code?

There are several ways of editing your application.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Deployment instructions go here; configure your hosting/CI as needed.

