# 🔐 Guide d'utilisation Token & Refresh Token

## Architecture JWT

### Tokens utilisés
1. **Access Token** (JWT) - Durée: 24 heures
   - Utilisé pour authentifier chaque requête API
   - Contient l'email de l'utilisateur
   - Stocké côté client (localStorage/sessionStorage)

2. **Refresh Token** - Durée: 7 jours
   - Utilisé pour obtenir un nouveau Access Token
   - Stocké de manière sécurisée (httpOnly cookie recommandé)
   - Ne devrait être utilisé QUE sur l'endpoint `/api/auth/refresh`

---

## 📝 Flux d'authentification complet

### 1. Inscription (Register)

**Requête:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "role": "STUDENT"
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "token": "eyJhbGciOiJIUzUxMiJ9...",
    "refreshToken": "eyJhbGciOiJIUzUxMiJ9...",
    "userId": "uuid-here",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "STUDENT",
    "expiresIn": 86400000
  }
}
```

### 2. Connexion (Login)

**Requête:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Réponse:** (même structure que register)

### 3. Utiliser l'Access Token

**Toutes les requêtes protégées:**
```http
GET /api/rooms
Authorization: Bearer eyJhbGciOiJIUzUxMiJ9...
```

### 4. Rafraîchir le token (avant expiration)

**Requête:**
```http
POST /api/auth/refresh
Content-Type: application/json

"eyJhbGciOiJIUzUxMiJ9.refresh-token-here..."
```

**Réponse:**
```json
{
  "success": true,
  "message": "Token refreshed",
  "data": {
    "token": "NEW-ACCESS-TOKEN",
    "refreshToken": "NEW-REFRESH-TOKEN",
    "userId": "uuid-here",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "STUDENT",
    "expiresIn": 86400000
  }
}
```

---

## 💻 Implémentation Frontend (React/TypeScript)

### 1. Service d'authentification

```typescript
// src/services/AuthService.ts
import axios from 'axios';

const API_URL = 'http://localhost:8080/api/auth';

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest extends LoginRequest {
  name: string;
  role: 'STUDENT' | 'PROFESSOR' | 'ADMIN';
}

interface AuthResponse {
  token: string;
  refreshToken: string;
  userId: string;
  email: string;
  name: string;
  role: string;
  expiresIn: number;
}

class AuthService {
  
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await axios.post(`${API_URL}/login`, data);
    const authData = response.data.data;
    
    // Stocker les tokens
    this.setTokens(authData.token, authData.refreshToken);
    
    return authData;
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await axios.post(`${API_URL}/register`, data);
    const authData = response.data.data;
    
    // Stocker les tokens
    this.setTokens(authData.token, authData.refreshToken);
    
    return authData;
  }

  async refreshToken(): Promise<AuthResponse | null> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      return null;
    }

    try {
      const response = await axios.post(`${API_URL}/refresh`, refreshToken, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      const authData = response.data.data;
      this.setTokens(authData.token, authData.refreshToken);
      
      return authData;
    } catch (error) {
      // Refresh token invalide - déconnecter l'utilisateur
      this.logout();
      return null;
    }
  }

  // Gestion du stockage
  private setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    
    // Calculer l'expiration (24h)
    const expiresAt = new Date().getTime() + 24 * 60 * 60 * 1000;
    localStorage.setItem('token_expires_at', expiresAt.toString());
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expires_at');
  }

  isTokenExpired(): boolean {
    const expiresAt = localStorage.getItem('token_expires_at');
    if (!expiresAt) return true;
    
    return new Date().getTime() > parseInt(expiresAt);
  }

  // Vérifier si le token va bientôt expirer (dans les 5 minutes)
  shouldRefreshToken(): boolean {
    const expiresAt = localStorage.getItem('token_expires_at');
    if (!expiresAt) return false;
    
    const fiveMinutes = 5 * 60 * 1000;
    return new Date().getTime() > parseInt(expiresAt) - fiveMinutes;
  }
}

export default new AuthService();
```

### 2. Intercepteur Axios (Auto-refresh)

```typescript
// src/lib/apiClient.ts
import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import AuthService from '../services/AuthService';

const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur de requête - Ajouter le token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Ne pas ajouter de token pour les endpoints publics
    if (config.url?.includes('/auth/')) {
      return config;
    }

    // Vérifier si le token doit être rafraîchi
    if (AuthService.shouldRefreshToken()) {
      await AuthService.refreshToken();
    }

    const token = AuthService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur de réponse - Gérer les erreurs 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Si erreur 401 et pas déjà tenté de refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Tenter de rafraîchir le token
        const newAuth = await AuthService.refreshToken();
        
        if (newAuth && originalRequest.headers) {
          // Réessayer la requête avec le nouveau token
          originalRequest.headers.Authorization = `Bearer ${newAuth.token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh a échoué - rediriger vers login
        AuthService.logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

### 3. Context d'authentification React

```typescript
// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import AuthService from '../services/AuthService';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: string) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const checkAuth = async () => {
      const token = AuthService.getAccessToken();
      
      if (token && !AuthService.isTokenExpired()) {
        // Token valide - récupérer les infos utilisateur
        setIsAuthenticated(true);
        // TODO: Appeler un endpoint /api/auth/me pour récupérer l'utilisateur
      } else if (token) {
        // Token expiré - tenter un refresh
        const newAuth = await AuthService.refreshToken();
        if (newAuth) {
          setIsAuthenticated(true);
        }
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Auto-refresh périodique (toutes les 20 minutes)
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(async () => {
      if (AuthService.shouldRefreshToken()) {
        await refreshAuth();
      }
    }, 20 * 60 * 1000); // 20 minutes

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const login = async (email: string, password: string) => {
    const authData = await AuthService.login({ email, password });
    setUser({
      id: authData.userId,
      email: authData.email,
      name: authData.name,
      role: authData.role,
    });
    setIsAuthenticated(true);
  };

  const register = async (name: string, email: string, password: string, role: string) => {
    const authData = await AuthService.register({ 
      name, 
      email, 
      password, 
      role: role as 'STUDENT' | 'PROFESSOR' | 'ADMIN' 
    });
    setUser({
      id: authData.userId,
      email: authData.email,
      name: authData.name,
      role: authData.role,
    });
    setIsAuthenticated(true);
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const refreshAuth = async () => {
    const newAuth = await AuthService.refreshToken();
    if (!newAuth) {
      logout();
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, register, logout, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### 4. Composant de login

```typescript
// src/pages/auth/Login.tsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Login</h2>
      {error && <div className="error">{error}</div>}
      
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      
      <button type="submit">Login</button>
    </form>
  );
};
```

---

## 🔒 Améliorations de sécurité recommandées

### Backend: Stocker les Refresh Tokens en base de données

```java
// src/main/java/com/lingua/hub/entity/RefreshToken.java
@Entity
@Table(name = "refresh_tokens")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefreshToken {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(nullable = false, unique = true)
    private String token;
    
    @Column(nullable = false)
    private LocalDateTime expiresAt;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    private LocalDateTime revokedAt;
    
    private String ipAddress;
    private String userAgent;
}
```

### Frontend: Utiliser httpOnly cookies (plus sécurisé)

Pour le refresh token, il est recommandé d'utiliser des cookies httpOnly au lieu de localStorage :

**Backend (Spring Boot):**
```java
@PostMapping("/login")
public ResponseEntity<ApiResponse<AuthResponse>> login(
    @Valid @RequestBody LoginRequest request,
    HttpServletResponse response
) {
    AuthResponse authResponse = authService.login(request);
    
    // Envoyer le refresh token dans un cookie httpOnly
    Cookie refreshTokenCookie = new Cookie("refresh_token", authResponse.getRefreshToken());
    refreshTokenCookie.setHttpOnly(true);
    refreshTokenCookie.setSecure(true); // HTTPS only
    refreshTokenCookie.setPath("/api/auth/refresh");
    refreshTokenCookie.setMaxAge(7 * 24 * 60 * 60); // 7 jours
    response.addCookie(refreshTokenCookie);
    
    // Ne pas renvoyer le refresh token dans le body
    authResponse.setRefreshToken(null);
    
    return ResponseEntity.ok(ApiResponse.success("Login successful", authResponse));
}
```

---

## 📊 Monitoring et logs

Ajoutez des logs pour tracer l'utilisation des tokens :

```java
@Slf4j
@Service
public class AuthService {
    
    public AuthResponse login(LoginRequest request) {
        // ... code existant ...
        
        log.info("User logged in: {} from IP: {}", user.getEmail(), getClientIp());
        log.debug("Access token generated, expires at: {}", new Date(now.getTime() + jwtExpirationMs));
        
        return authResponse;
    }
    
    public AuthResponse refreshToken(String refreshToken) {
        // ... code existant ...
        
        log.info("Token refreshed for user: {}", email);
        
        return authResponse;
    }
}
```

---

## 🧪 Tests

### Test avec curl

```bash
# 1. Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'

# 2. Utiliser le token
curl http://localhost:8080/api/rooms \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 3. Refresh le token
curl -X POST http://localhost:8080/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '"YOUR_REFRESH_TOKEN"'
```

---

## ⚡ Bonnes pratiques

1. ✅ **Toujours vérifier l'expiration** avant d'utiliser un token
2. ✅ **Refresh proactif** : rafraîchir 5 min avant expiration
3. ✅ **Stocker le refresh token de manière sécurisée** (httpOnly cookie)
4. ✅ **Gérer les erreurs 401** et rediriger vers login si nécessaire
5. ✅ **Nettoyer les tokens** lors de la déconnexion
6. ✅ **Implémenter une blacklist** pour les tokens révoqués
7. ✅ **Limiter le nombre de refresh tokens** par utilisateur
8. ✅ **Logger toutes les tentatives** d'authentification

---

## 🔄 Diagramme de séquence

```
Client                  Backend                 Database
  |                       |                        |
  |-- 1. Login ---------->|                        |
  |                       |-- Check credentials -->|
  |                       |<-----------------------|
  |<-- Access + Refresh --|                        |
  |                       |                        |
  |-- 2. API Request ---->|                        |
  |    (Bearer Token)     |-- Validate Token ----->|
  |                       |<-----------------------|
  |<-- Response ----------|                        |
  |                       |                        |
  |-- 3. Token expires -->|                        |
  |-- Refresh Request --->|                        |
  |    (Refresh Token)    |-- Validate Refresh --->|
  |                       |<-----------------------|
  |<-- New Tokens --------|                        |
```

