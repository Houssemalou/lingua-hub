# ============================================
# LINGUA HUB - Complete E-Learning Platform
# ============================================

##  Architecture

**Stack Technique:**
- **Frontend**: React + TypeScript + Vite + TailwindCSS + shadcn/ui
- **Backend**: Spring Boot 3.2.1 + PostgreSQL 15
- **Real-time**: LiveKit (Video/Audio/Data channels)
- **IA**: OpenAI GPT-4 Realtime API + Deepgram STT
- **Containerisation**: Docker + Docker Compose

##  Fonctionnalités

###  Gestion des Sessions
- Création de rooms avec LiveKit
- Vidéo/audio en temps réel
- Partage d'écran
- Chat peer-to-peer via DataChannel (WebRTC)

###  Modération Professeur
- **Muter/démuter les étudiants**
- **Pinger les étudiants** (notifications)
- Contrôle participants en temps réel

###  Intelligence Artificielle
-  **RealtimeMonitor silencieux** dans chaque session
- Transcription audio automatique
- **Génération automatique de résumés** IA
- Analyse GPT-4 (topics, vocabulaire, grammaire)

##  Documentation API

**Swagger UI**: http://localhost:8080/swagger-ui.html

##  Démarrage Rapide

### Avec Docker (Recommandé)

\\\ash
# 1. Configurer .env
cp .env.example .env
# Éditer .env avec vos clés API

# 2. Démarrer tous les services
docker-compose up -d

# 3. Accéder à l'application
# Frontend: http://localhost:5173
# Backend: http://localhost:8080
# Swagger: http://localhost:8080/swagger-ui.html
\\\

### Développement Manuel

\\\ash
# Backend
cd backend-spring
./mvnw spring-boot:run

# Frontend
npm install && npm run dev

# Python Service
cd python-livekit-service
pip install -r requirements.txt
python agent.py start
\\\

##  Comptes par Défaut

\\\javascript
// Admin
{ email: \"admin@example.com\", password: \"admin123\" }

// Professeur
{ email: \"prof@example.com\", password: \"prof123\" }

// Étudiant
{ email: \"student@example.com\", password: \"student123\" }
\\\

##  Configuration

Variables dans \.env\:

\\\env
# LiveKit
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret

# JWT
JWT_SECRET=your-secure-secret

# OpenAI (pour résumés IA)
OPENAI_API_KEY=sk-your-key

# Deepgram (transcription)
DEEPGRAM_API_KEY=your-key
\\\

##  Services

- **PostgreSQL**: \localhost:5432\
- **LiveKit**: \localhost:7880\
- **Backend**: \localhost:8080\
- **Frontend**: \localhost:5173\

##  Workflow Session

1. Professeur crée room  Backend génère room LiveKit
2. Participants obtiennent tokens JWT
3. RealtimeMonitor s'attache (mode mute)
4. Session: vidéo/audio/chat en temps réel
5. Professeur peut muter/pinger étudiants
6. Fin session  Résumé IA automatique généré

##  Documentation

- Swagger: http://localhost:8080/swagger-ui.html
- LiveKit: https://docs.livekit.io/
- OpenAI: https://platform.openai.com/docs/

---

**Développé avec  pour l'apprentissage des langues**
