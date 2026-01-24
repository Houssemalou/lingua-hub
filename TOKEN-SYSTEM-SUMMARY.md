# 🔐 Résumé: Système Token & Refresh Token

## Architecture mise en place

### ✅ Backend (Spring Boot)

**Fichiers créés/modifiés:**
- ✅ `JwtTokenProvider.java` - Gestion des tokens JWT
- ✅ `AuthService.java` - Logique d'authentification avec logging
- ✅ `AuthController.java` - Endpoints REST pour auth
- ✅ `RefreshTokenRequest.java` - DTO pour refresh token
- ✅ `application.yml` - Configuration JWT (24h access, 7j refresh)

**Endpoints disponibles:**
```
POST /api/auth/register    - Inscription
POST /api/auth/login       - Connexion
POST /api/auth/refresh     - Rafraîchir les tokens
GET  /api/auth/me          - Info utilisateur courant
POST /api/auth/logout      - Déconnexion
```

### ✅ Frontend (React/TypeScript)

**Services créés (dans le guide):**
- ✅ `AuthService.ts` - Gestion tokens côté client
- ✅ `apiClient.ts` - Intercepteur Axios avec auto-refresh
- ✅ `AuthContext.tsx` - Context React pour l'authentification
- ✅ Composants de login/register

## 🚀 Comment l'utiliser

### 1. Login (Backend)

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzUxMiJ9...",
    "refreshToken": "eyJhbGciOiJIUzUxMiJ9...",
    "userId": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "role": "STUDENT",
    "expiresIn": 86400000
  }
}
```

### 2. Utiliser le token

```bash
curl http://localhost:8080/api/rooms \
  -H "Authorization: Bearer eyJhbGciOiJIUzUxMiJ9..."
```

### 3. Rafraîchir le token

```bash
curl -X POST http://localhost:8080/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzUxMiJ9..."
  }'
```

### 4. Frontend (React)

```typescript
import { useAuth } from './contexts/AuthContext';

function LoginPage() {
  const { login } = useAuth();
  
  const handleLogin = async () => {
    await login('user@example.com', 'password');
    // Redirige vers dashboard
  };
}

// L'intercepteur Axios gère automatiquement:
// - Ajout du Bearer token à chaque requête
// - Auto-refresh si token proche de l'expiration
// - Gestion des 401 avec retry automatique
```

## 🔒 Sécurité

### Actuellement implémenté:
- ✅ Tokens JWT signés (HS512)
- ✅ Access token court (24h)
- ✅ Refresh token long (7j)
- ✅ Validation des tokens
- ✅ Logging des authentifications

### Améliorations recommandées:
- ⚠️ Stocker refresh tokens en base de données
- ⚠️ Utiliser httpOnly cookies pour refresh token
- ⚠️ Implémenter token blacklist pour logout
- ⚠️ Limiter nombre de refresh tokens actifs par user
- ⚠️ Rotation des secrets JWT

## 📁 Fichiers importants

```
backend-spring/
├── src/main/java/com/lingua/hub/
│   ├── controller/
│   │   └── AuthController.java          ✅ Endpoints auth
│   ├── service/
│   │   └── AuthService.java             ✅ Logique auth
│   ├── security/
│   │   ├── JwtTokenProvider.java        ✅ Génération JWT
│   │   └── JwtAuthenticationFilter.java ✅ Validation JWT
│   └── dto/auth/
│       ├── LoginRequest.java
│       ├── RegisterRequest.java
│       ├── RefreshTokenRequest.java     ✅ Nouveau
│       └── AuthResponse.java
└── src/main/resources/
    └── application.yml                   ✅ Config JWT

JWT-TOKEN-GUIDE.md                        ✅ Guide complet
```

## 🎯 Flux d'authentification

```
1. User Login
   └─> Backend génère Access + Refresh tokens
       └─> Client stocke les tokens (localStorage)

2. API Request
   └─> Client envoie: Authorization: Bearer {access_token}
       └─> Backend valide le token
           └─> Si valide: traite la requête
           └─> Si expiré: retourne 401

3. Token expiré (401)
   └─> Intercepteur détecte 401
       └─> Envoie refresh token à /api/auth/refresh
           └─> Backend valide refresh token
               └─> Si valide: génère nouveaux tokens
               └─> Si invalide: redirect login

4. Auto-refresh (avant expiration)
   └─> Intercepteur vérifie expiration (toutes les 5 min)
       └─> Si expire dans < 5 min: refresh automatique
```

## 🧪 Tests

### Tester le flux complet:

```bash
# 1. Register
RESPONSE=$(curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"test123","role":"STUDENT"}')

# Extraire les tokens
ACCESS_TOKEN=$(echo $RESPONSE | jq -r '.data.token')
REFRESH_TOKEN=$(echo $RESPONSE | jq -r '.data.refreshToken')

# 2. Tester une requête protégée
curl http://localhost:8080/api/rooms \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# 3. Refresh le token
curl -X POST http://localhost:8080/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}"
```

## 📚 Documentation

Pour plus de détails, consultez:
- [JWT-TOKEN-GUIDE.md](./JWT-TOKEN-GUIDE.md) - Guide complet avec exemples frontend/backend
- [Swagger UI](http://localhost:8080/swagger-ui.html) - Documentation interactive des APIs

## 🔄 Prochaines étapes

1. **Base de données pour refresh tokens** (recommandé)
2. **HttpOnly cookies** pour refresh token (plus sécurisé)
3. **Token rotation** lors du refresh
4. **Rate limiting** sur /api/auth/refresh
5. **Multi-device** gestion des sessions

---

✅ Le système est maintenant prêt à l'emploi !
