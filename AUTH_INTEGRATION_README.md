# Authentification Backend Integration

## Vue d'ensemble

L'application Lingua Hub intègre maintenant un système d'authentification complet avec le backend Spring Boot. L'authentification prend en charge trois types d'utilisateurs : Admin, Professeur et Étudiant.

## Architecture

### Backend (Spring Boot)

#### Entités
- **User**: Entité de base avec email, mot de passe hashé, rôle et informations communes
- **Student**: Profil étudiant lié à User (OneToOne)
- **Professor**: Profil professeur lié à User (OneToOne)

#### DTOs d'inscription
- **StudentRegisterRequest**: Inscription étudiant avec token d'accès
- **ProfessorRegisterRequest**: Inscription professeur avec token d'accès
- **AdminRegisterRequest**: Inscription admin avec token d'accès

#### Endpoints API
```
POST /api/auth/register/student   - Inscription étudiant
POST /api/auth/register/professor - Inscription professeur
POST /api/auth/register/admin     - Inscription admin
POST /api/auth/login              - Connexion
POST /api/auth/refresh            - Rafraîchir token
GET  /api/auth/me                 - Informations utilisateur
POST /api/auth/logout             - Déconnexion
```

#### Tokens d'accès valides
- **Étudiants**: `STUDENT2024`, `LANG-ABC123`, `EDU-TOKEN-01`, `ACCESS-2024-XYZ`
- **Professeurs**: `PROF2024`, `TEACHER-ABC`, `PROF-TOKEN-01`
- **Admins**: `ADMIN2024`, `ADMIN-TOKEN-01`, `SUPER-ADMIN`

### Frontend (React/TypeScript)

#### Services
- **AuthService**: Service complet pour toutes les opérations d'authentification
- Méthodes: `login`, `registerStudent`, `registerProfessor`, `registerAdmin`, `refreshToken`, `getCurrentUser`

#### Contexte d'authentification
- **AuthContext**: Fournit les méthodes d'authentification à toute l'application
- Gestion automatique des tokens JWT
- Stockage sécurisé dans localStorage

## Flux d'authentification

### Inscription
1. Validation du token d'accès côté frontend
2. Envoi des données au backend approprié
3. Création de l'entité User + entité spécifique (Student/Professor)
4. Génération des tokens JWT
5. Retour des tokens et informations utilisateur

### Connexion
1. Envoi email/mot de passe au backend
2. Validation des credentials
3. Génération des tokens JWT
4. Retour des informations utilisateur

### Gestion des tokens
- **Access Token**: Valide 15 minutes (configurable)
- **Refresh Token**: Valide 7 jours (configurable)
- Rafraîchissement automatique des tokens

## Sécurité

### Backend
- **BCrypt** pour le hashage des mots de passe
- **JWT** pour l'authentification stateless
- **Spring Security** pour la protection des endpoints
- Validation des données avec Bean Validation

### Frontend
- Stockage sécurisé des tokens
- Validation des tokens d'accès
- Gestion automatique de l'expiration

## Utilisation

### Inscription d'un étudiant
```typescript
const result = await AuthService.registerStudent({
  name: "John Doe",
  email: "john@example.com",
  password: "password123",
  nickname: "Johnny",
  level: "A1",
  accessToken: "STUDENT2024"
});
```

### Connexion
```typescript
const result = await AuthService.login({
  email: "john@example.com",
  password: "password123"
});
```

### Utilisation dans les composants
```typescript
const { user, login, signupStudent, logout } = useAuth();
```

## Configuration

### Variables d'environnement (Backend)
```properties
jwt.secret=your-jwt-secret-key-here
jwt.expiration=900000
jwt.refresh-expiration=604800000
```

### Démarrage
1. **Backend**: `mvn spring-boot:run`
2. **Frontend**: `npm run dev`

## Tests

### Comptes de test
- **Admin**: admin@example.com / admin123
- **Professeur**: prof@example.com / prof123
- **Étudiant**: student@example.com / student123

### Tokens de test
Utilisez les tokens listés ci-dessus pour tester les inscriptions.

## Prochaines étapes

1. **Récupération des profils complets**: Ajouter des endpoints pour récupérer les informations Student/Professor
2. **Gestion des rôles**: Implémenter la logique de permissions basée sur les rôles
3. **Validation avancée**: Ajouter plus de validations métier
4. **Logs d'audit**: Implémenter le logging des opérations d'authentification
5. **Rate limiting**: Protéger contre les attaques par force brute