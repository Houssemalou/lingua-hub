# Corrections et Intégration LiveKit Complète

## Problèmes corrigés

### 1. Problème d'affichage du statut "Terminé"
**Cause** : Le backend retourne les statuts en MAJUSCULES (`SCHEDULED`, `LIVE`, `COMPLETED`) mais le frontend comparait avec des minuscules.

**Solution** : Normalisation de la comparaison avec `.toLowerCase()` dans :
- `ProfessorSessions.tsx`
- `StudentSessions.tsx`
- `ProfessorLiveRoom.tsx`

```typescript
const statusLower = session.status.toLowerCase();
// Utiliser statusLower pour toutes les comparaisons
```

## Intégration LiveKit Réelle

### Architecture

```
Frontend (React)
    ↓
RoomService.getLiveKitToken(roomId, userId)
    ↓
Backend API: POST /livekit/token
    ↓
LiveKit Server
    ↓
LiveKit Room (réelle)
```

### Flux de connexion

#### Pour le Professeur :
1. **Démarrer la session** : `POST /rooms/{id}/start`
   - Change le statut à `LIVE`
   - Crée la room LiveKit sur le serveur
   
2. **Obtenir le token** : `POST /livekit/token`
   - Paramètres : `{ roomId, userId }`
   - Retourne : `{ token, serverUrl }`
   
3. **Connecter à LiveKit** : 
   - Hook `useLiveKitRoom` gère la connexion
   - Composant `LiveKitRoom` affiche l'interface

#### Pour l'Étudiant :
1. **Vérifier l'autorisation** : `canJoinRoom(session)`
   - Vérifie le timing (15 min avant)
   - Vérifie que la session est `LIVE`
   
2. **Obtenir le token** : `POST /livekit/token`
   
3. **Connecter à LiveKit** : Même processus que le professeur

### Composants principaux

#### 1. `useLiveKitRoom` Hook
```typescript
const {
  room,
  participants,
  isConnected,
  error,
  connectToRoom,
  disconnectFromRoom,
  toggleMicrophone,
  toggleCamera,
  toggleScreenShare,
  serverUrl,
  token,
} = useLiveKitRoom(roomId);
```

**Fonctionnalités** :
- Récupère le token du backend
- Se connecte au serveur LiveKit
- Gère les participants (local + remote)
- Gère les médias (micro, caméra, partage d'écran)
- Écoute les événements LiveKit (connexion/déconnexion)

#### 2. `LiveKitRoom` Component
Affiche l'interface de la room avec :
- **VideoGrid** : Grille des vidéos des participants
- **MediaControls** : Contrôles (micro, caméra, partage d'écran)
- **ParticipantList** : Liste des participants avec leur statut
- **ChatPanel** : Panel de chat (si implémenté)

#### 3. Pages de Room

##### `ProfessorLiveRoom.tsx`
- Affiche la room pour le professeur
- Permet de démarrer la session si `SCHEDULED`
- Affiche l'état de connexion
- Bouton "Leave Room" pour quitter

##### `StudentLiveRoom.tsx`
- Affiche la room pour l'étudiant
- Vérifie l'autorisation avant de rejoindre
- Affiche l'état de connexion
- Bouton "Leave Room" pour quitter

### Statuts de Room

| Statut Backend | Affichage Frontend | Professeur peut... | Étudiant peut... |
|----------------|-------------------|-------------------|------------------|
| `SCHEDULED` | Planifié | Démarrer (15 min avant) | Attendre |
| `LIVE` | En direct | Rejoindre | Rejoindre |
| `COMPLETED` | Terminé | Voir le résumé | Voir le résumé |
| `CANCELLED` | Annulé | - | - |

### APIs Backend utilisées

#### 1. Obtenir un token LiveKit
```
POST /api/livekit/token
Body: { roomId: string, userId: string }
Response: { token: string, serverUrl: string }
```

#### 2. Démarrer une session
```
POST /api/rooms/{roomId}/start
Response: RoomModel (avec status=LIVE)
```

#### 3. Rejoindre une session
```
POST /api/rooms/{roomId}/join
Response: void
```

#### 4. Obtenir les détails d'une room
```
GET /api/rooms/{roomId}
Response: RoomModel
```

### Configuration LiveKit

Le serveur LiveKit doit être configuré dans le backend avec :
- **LIVEKIT_API_KEY** : Clé API LiveKit
- **LIVEKIT_API_SECRET** : Secret API LiveKit
- **LIVEKIT_URL** : URL du serveur LiveKit (ex: `wss://your-livekit.com`)

### Gestion des participants

Le composant `ParticipantList` affiche :
- ✅ Nom du participant
- ✅ Avatar (si disponible)
- ✅ Statut micro (muté/non muté)
- ✅ Statut caméra (on/off)
- ✅ Statut partage d'écran
- ✅ Rôle (professeur/étudiant)
- ✅ Indicateur "vous" pour l'utilisateur local
- ✅ Indicateur de parole (is speaking)

### Design conservé

✅ Même interface qu'avec les mock data
✅ Mêmes contrôles (micro, caméra, partage d'écran)
✅ Même disposition des participants
✅ Support RTL complet
✅ Thèmes clair/sombre

### Fonctionnalités LiveKit actives

- [x] Connexion au serveur LiveKit réel
- [x] Vidéo des participants
- [x] Audio des participants
- [x] Contrôle du micro (mute/unmute)
- [x] Contrôle de la caméra (on/off)
- [x] Partage d'écran
- [x] Détection de parole
- [x] Liste des participants en temps réel
- [x] Déconnexion propre

### Prochaines étapes possibles

- [ ] Chat en temps réel
- [ ] Levée de main
- [ ] Enregistrement de la session
- [ ] Sous-titres automatiques
- [ ] Arrière-plans virtuels
- [ ] Whiteboard collaboratif
- [ ] Sondages en direct

### Tests à effectuer

1. **Professeur démarre une session** :
   - [ ] Cliquer sur "Start Session" 15 min avant
   - [ ] Vérifier que la room LiveKit est créée
   - [ ] Vérifier que le statut passe à "LIVE"
   - [ ] Vérifier que la vidéo/audio fonctionnent

2. **Étudiant rejoint une session** :
   - [ ] Vérifier qu'il ne peut pas rejoindre trop tôt
   - [ ] Rejoindre quand la session est LIVE
   - [ ] Vérifier qu'il apparaît dans la liste des participants
   - [ ] Vérifier que le professeur le voit

3. **Interactions en temps réel** :
   - [ ] Muter/unmuter le micro
   - [ ] Activer/désactiver la caméra
   - [ ] Partager l'écran
   - [ ] Vérifier que les autres participants voient les changements

4. **Quitter la session** :
   - [ ] Cliquer sur "Leave Room"
   - [ ] Vérifier la déconnexion propre
   - [ ] Vérifier le retour à la liste des sessions

### Debugging

Pour déboguer les problèmes LiveKit :

1. **Console du navigateur** : Vérifier les erreurs LiveKit
2. **Network tab** : Vérifier les appels à `/livekit/token`
3. **LiveKit Dashboard** : Voir les rooms actives et participants
4. **Backend logs** : Vérifier la création des tokens

### Notes importantes

- Le token LiveKit expire après un certain temps (configurable)
- Chaque participant a un identifiant unique (userId)
- La room est créée automatiquement lors du premier participant
- La room persiste jusqu'à ce que tous les participants la quittent
