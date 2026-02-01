# Système de Gestion des Sessions avec Timing

## Vue d'ensemble

Cette fonctionnalité implémente un système complet de gestion des sessions (rooms) avec des contraintes temporelles et des rôles différenciés pour les professeurs et les étudiants.

## Fonctionnalités Principales

### 1. **Sessions Filtrées par Rôle**
- **Professeurs** : Voient uniquement les sessions auxquelles ils sont assignés
- **Étudiants** : Voient uniquement les sessions auxquelles ils sont invités
- **Admins** : Voient toutes les sessions

### 2. **Contraintes Temporelles**
- Les utilisateurs peuvent rejoindre une session **15 minutes avant** l'heure prévue
- Impossible de rejoindre avant ce délai
- Vérification côté backend et frontend

### 3. **Flux de Démarrage (Professeurs)**
1. Le professeur accède à la page "Mes Sessions"
2. Il peut démarrer la session 15 minutes avant l'heure prévue
3. Lors du démarrage :
   - Appel à `/api/rooms/{id}/start` pour créer la room LiveKit
   - Changement du statut de `SCHEDULED` → `LIVE`
   - Enregistrement de la participation
   - Récupération du token LiveKit
   - Redirection vers la room

### 4. **Flux de Jointure (Étudiants)**
1. L'étudiant accède à "Mes Sessions"
2. Il attend que le professeur démarre la session
3. Une fois la session `LIVE` :
   - Appel à `/api/rooms/{id}/join` pour enregistrer la participation
   - Récupération du token LiveKit
   - Redirection vers la room

## Architecture Backend

### Nouveaux Endpoints

#### `GET /api/rooms/my-sessions`
Récupère les sessions de l'utilisateur connecté basées sur son rôle :
- **Professor** : Sessions où il est assigné comme professeur
- **Student** : Sessions où il est invité comme participant
- **Admin** : Toutes les sessions

#### `GET /api/rooms/{id}/can-join`
Vérifie si l'utilisateur peut rejoindre la session :
- Vérifie le timing (15 min avant)
- Vérifie le statut de la room
- Vérifie les permissions (invitation/assignation)

#### `POST /api/rooms/{id}/join`
Enregistre la participation de l'utilisateur :
- Valide les permissions
- Met à jour `joinedAt` pour les étudiants
- Retourne une confirmation

#### `POST /api/rooms/{id}/start` (Modifié)
Démarre une session (professeur uniquement) :
- Vérifie le timing (15 min avant)
- Crée la room LiveKit
- Change le statut à `LIVE`

### Modifications de Base de Données

#### Table `Room`
```java
@Entity
public class Room {
    // ... existing fields
    
    @OneToMany(mappedBy = "room")
    private List<RoomParticipant> participants;
    
    @ManyToOne
    private Professor professor;
}
```

#### Table `RoomParticipant`
```java
@Entity
public class RoomParticipant {
    private UUID id;
    private Room room;
    private Student student;
    private Boolean invited;
    private LocalDateTime joinedAt;
    // ... other fields
}
```

### Nouvelles Requêtes JPA

```java
// RoomRepository.java
@Query("SELECT r FROM Room r WHERE r.professor.id = :professorId")
Page<Room> findByProfessorId(UUID professorId, Pageable pageable);

@Query("SELECT DISTINCT r FROM Room r JOIN r.participants p " +
       "WHERE p.student.id = :studentId AND p.invited = true")
Page<Room> findByStudentId(UUID studentId, Pageable pageable);
```

## Architecture Frontend

### Nouveaux Services

#### `RoomService.getMySessions()`
Récupère les sessions de l'utilisateur connecté

#### `RoomService.canJoin(roomId)`
Vérifie si l'utilisateur peut rejoindre

#### `RoomService.join(roomId)`
Enregistre la participation

#### `RoomService.startAndJoin(roomId, userId)`
Démarre et rejoint la session (professeurs)

### Utilitaires de Timing

#### `roomUtils.ts`
```typescript
// Vérifie si une room peut être rejointe
canJoinRoom(room: RoomModel): { canJoin: boolean; reason?: string }

// Vérifie si une room peut être démarrée (professeur)
canStartRoom(room: RoomModel): { canStart: boolean; reason?: string }

// Calcule les minutes restantes avant de pouvoir rejoindre
getMinutesUntilJoinable(room: RoomModel): number

// Formate le temps en string lisible
formatTimeUntilJoinable(room: RoomModel): string
```

### Nouveaux Composants

#### `MySessions.tsx`
Composant unifié pour professeurs et étudiants :
- Affiche les sessions de l'utilisateur
- Gère le timing et les permissions
- Bouton dynamique selon le rôle et l'état
- Messages d'erreur clairs

## Flux Complets

### Professeur démarre une session

```
1. Professor opens "My Sessions"
2. Sees his assigned sessions
3. 15 min before scheduled time: "Start Session" button enabled
4. Clicks "Start Session"
   ↓
5. Frontend calls: POST /api/rooms/{id}/start
   ↓
6. Backend:
   - Validates professor assignment
   - Checks timing (15 min before)
   - Creates LiveKit room
   - Sets status to LIVE
   ↓
7. Frontend calls: POST /api/rooms/{id}/join
   ↓
8. Frontend calls: POST /api/livekit/token
   ↓
9. Receives token and serverUrl
   ↓
10. Navigates to room with token
```

### Étudiant rejoint une session

```
1. Student opens "My Sessions"
2. Sees invited sessions
3. Status "Scheduled": Shows "Waiting to start"
4. Professor starts → Status changes to "LIVE"
5. "Join" button enabled
6. Clicks "Join"
   ↓
7. Frontend calls: GET /api/rooms/{id}/can-join
   ↓
8. Backend validates:
   - Is student invited?
   - Is session live?
   - Is timing correct?
   ↓
9. If valid → Frontend calls: POST /api/rooms/{id}/join
   ↓
10. Frontend calls: POST /api/livekit/token
   ↓
11. Receives token and serverUrl
   ↓
12. Navigates to room with token
```

## Configuration

### Backend (application.yml)
```yaml
livekit:
  url: ${LIVEKIT_URL:http://localhost:7880}
  api-key: ${LIVEKIT_API_KEY}
  api-secret: ${LIVEKIT_API_SECRET}
  token-expiration: 3600000 # 1 hour
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8080/api
VITE_LIVEKIT_URL=ws://localhost:7880
```

## Tests

### Test Manuel - Professeur
1. Créer une session programmée dans 10 minutes
2. Essayer de démarrer → Doit échouer
3. Attendre jusqu'à 5 minutes avant
4. Essayer de démarrer → Doit réussir
5. Vérifier que le statut passe à LIVE
6. Vérifier l'accès à la room LiveKit

### Test Manuel - Étudiant
1. Être invité à une session
2. Voir la session dans "Mes Sessions"
3. Essayer de rejoindre avant le démarrage → Doit être désactivé
4. Attendre que le professeur démarre
5. Bouton "Join" devient actif
6. Rejoindre et vérifier l'accès à la room

## Sécurité

- Tous les endpoints sont protégés par JWT
- Validation côté backend des permissions
- Vérification des rôles (Professor/Student)
- Vérification de l'invitation/assignation
- Tokens LiveKit avec expiration

## Améliorations Futures

1. **Notifications en temps réel** : WebSocket pour notifier quand une session démarre
2. **Rappels automatiques** : Email/notification X minutes avant la session
3. **Historique des participants** : Tracer qui a rejoint et quand
4. **Statistiques de présence** : Analytics sur la participation
5. **Enregistrements automatiques** : Démarrer l'enregistrement au lancement

## Dépendances

### Backend
```xml
<dependency>
    <groupId>io.livekit</groupId>
    <artifactId>livekit-server</artifactId>
    <version>0.5.0</version>
</dependency>
```

### Frontend
```json
{
  "dependencies": {
    "@livekit/components-react": "^2.0.0",
    "livekit-client": "^2.0.0",
    "date-fns": "^3.0.0"
  }
}
```

## Troubleshooting

### Problème : "Cannot start room before scheduled time"
- **Cause** : Tentative de démarrage trop tôt
- **Solution** : Attendre jusqu'à 15 minutes avant l'heure prévue

### Problème : "Room is not live yet"
- **Cause** : Étudiant essaie de rejoindre avant que le professeur ne démarre
- **Solution** : Attendre que le professeur démarre la session

### Problème : "You are not invited to this room"
- **Cause** : L'étudiant n'est pas dans la liste des invités
- **Solution** : L'admin ou le professeur doit ajouter l'étudiant aux invités

### Problème : Token LiveKit expiré
- **Cause** : Token LiveKit a une durée de vie limitée
- **Solution** : Régénérer un nouveau token

## Support

Pour toute question ou problème, contactez l'équipe de développement.
