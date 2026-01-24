# ============================================
# SESSION RECORDING FEATURE - SETUP GUIDE
# ============================================

##  Vue d'ensemble

Le système d'enregistrement des sessions utilise:
- **LiveKit** pour l'enregistrement vidéo/audio
- **MinIO** pour le stockage des fichiers (compatible S3)
- **PostgreSQL** pour les métadonnées
- **Spring Boot** pour l'API backend
- **React** pour l'interface frontend

##  Architecture

\\\
[Session LiveKit]  [Enregistrement]  [Upload MinIO]  [Métadonnées PostgreSQL]
                                                           
[Étudiants/Admin]  [Lecture via URL présignée]  [Backend Spring Boot]
\\\

##  Base de données

### Table \session_recordings\

\\\sql
CREATE TABLE session_recordings (
    id BIGSERIAL PRIMARY KEY,
    room_id BIGINT NOT NULL REFERENCES rooms(id),
    livekit_recording_id VARCHAR(255) UNIQUE NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    minio_bucket VARCHAR(255) NOT NULL,
    minio_object_key VARCHAR(500) NOT NULL,
    duration_seconds INTEGER,
    file_size_bytes BIGINT,
    format VARCHAR(50),
    status VARCHAR(50) NOT NULL,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP
);
\\\

### Status possibles
- \RECORDING\: Enregistrement en cours
- \PROCESSING\: Upload vers MinIO en cours
- \COMPLETED\: Disponible pour lecture
- \FAILED\: Erreur lors de l'enregistrement ou upload

##  Démarrage

### 1. Lancer tous les services

\\\ash
docker-compose up -d
\\\

Ceci démarre:
- **PostgreSQL** sur port \5432\
- **LiveKit** sur port \7880\
- **MinIO API** sur port \9000\
- **MinIO Console** sur port \9001\
- **Backend** sur port \8080\
- **Python Service** pour AI monitoring

### 2. Accéder à MinIO Console

URL: http://localhost:9001

Credentials (défaut):
- Username: \minioadmin\
- Password: \minioadmin\

Le bucket \lingua-recordings\ sera créé automatiquement.

##  API Endpoints

### Backend Spring Boot

**Démarrer un enregistrement**
\\\ash
POST /api/recordings/start
Params: roomId, livekitRecordingId
Auth: PROFESSOR, ADMIN
\\\

**Upload fichier enregistré**
\\\ash
POST /api/recordings/upload
Params: livekitRecordingId, file, durationSeconds
Body: multipart/form-data
\\\

**Obtenir un enregistrement**
\\\ash
GET /api/recordings/{id}
Auth: STUDENT, PROFESSOR, ADMIN
Response: SessionRecording avec playbackUrl (24h)
\\\

**Enregistrements d'une room**
\\\ash
GET /api/recordings/room/{roomId}
Auth: PROFESSOR, ADMIN
Response: List<SessionRecording>
\\\

**Enregistrements d'un étudiant**
\\\ash
GET /api/recordings/student/{studentId}
Auth: STUDENT, ADMIN
Response: List<SessionRecording> (sessions où il a participé)
\\\

**Tous les enregistrements (Admin)**
\\\ash
GET /api/recordings/all?page=0&size=20
Auth: ADMIN
Response: Page<SessionRecording>
\\\

**Supprimer un enregistrement**
\\\ash
DELETE /api/recordings/{id}
Auth: ADMIN
\\\

##  Utilisation Frontend

### Importer le service

\\\	ypescript
import { RecordingService, RecordingStatus } from '@/services';
\\\

### Démarrer un enregistrement

\\\	ypescript
const result = await RecordingService.startRecording(roomId, livekitRecordingId);
if (result.success) {
  console.log('Recording started:', result.data);
}
\\\

### Obtenir les enregistrements d'un étudiant

\\\	ypescript
const result = await RecordingService.getStudentRecordings(studentId);
if (result.success) {
  result.data.forEach(recording => {
    console.log('Vidéo:', recording.fileName);
    console.log('URL:', recording.playbackUrl); // Valid 24h
    console.log('Durée:', RecordingService.formatDuration(recording.durationSeconds));
  });
}
\\\

### Afficher un enregistrement

\\\	ypescript
const result = await RecordingService.getRecording(recordingId);
if (result.success && result.data.playbackUrl) {
  // Utiliser dans un élément <video>
  videoElement.src = result.data.playbackUrl;
}
\\\

##  Configuration

### Variables d'environnement (.env)

\\\env
# MinIO
MINIO_URL=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=lingua-recordings
\\\

### Spring Boot (application.yml)

\\\yaml
minio:
  url: \
  access-key: \
  secret-key: \
  bucket-name: \
\\\

##  Sécurité

### Accès aux enregistrements

- **Étudiants**: Peuvent voir uniquement les enregistrements des sessions où ils ont participé
- **Professeurs**: Peuvent voir les enregistrements de leurs rooms
- **Admin**: Accès complet à tous les enregistrements

### URLs présignées

Les URLs de lecture sont valides **24 heures**. Le backend génère automatiquement une nouvelle URL à chaque requête via MinIO presigned URLs.

##  Swagger Documentation

URL: http://localhost:8080/swagger-ui.html

Section: **Recordings** - 8 endpoints disponibles

##  Workflow complet

### 1. Professeur démarre une session
\\\
POST /api/rooms (crée room avec LiveKit)
\\\

### 2. Backend démarre l'enregistrement
\\\
POST /api/recordings/start
 Crée entrée avec status=RECORDING
\\\

### 3. LiveKit enregistre la session
\\\
Fichier MP4 généré automatiquement
\\\

### 4. Python service upload vers MinIO
\\\
POST /api/recordings/upload (fichier + métadonnées)
 Upload vers MinIO
 Status = COMPLETED
\\\

### 5. Étudiant consulte ses enregistrements
\\\
GET /api/recordings/student/{id}
 Liste avec playbackUrl pour chaque vidéo
\\\

### 6. Lecture vidéo
\\\
<video src={recording.playbackUrl} controls />
\\\

##  Dépannage

### MinIO non accessible
\\\ash
docker logs lingua-minio
docker restart lingua-minio
\\\

### Bucket non créé
Se connecter à MinIO Console (http://localhost:9001) et créer manuellement le bucket \lingua-recordings\.

### Upload échoue
Vérifier:
1. MinIO est running: \docker ps | grep minio\
2. Credentials correctes dans \.env\
3. Logs backend: \docker logs lingua-backend\

### URL de lecture expirée
Les URLs sont valides 24h. Refaire une requête \GET /api/recordings/{id}\ pour obtenir une nouvelle URL.

##  Dépendances

### Backend (pom.xml)
\\\xml
<dependency>
    <groupId>io.minio</groupId>
    <artifactId>minio</artifactId>
    <version>8.5.7</version>
</dependency>
\\\

### Docker (docker-compose.yml)
\\\yaml
minio:
  image: minio/minio:latest
  ports:
    - "9000:9000"  # API
    - "9001:9001"  # Console
  volumes:
    - minio_data:/data
\\\

##  Test rapide

\\\ash
# 1. Démarrer stack
docker-compose up -d

# 2. Vérifier MinIO
curl http://localhost:9000/minio/health/live

# 3. Tester API
curl -X GET http://localhost:8080/api/recordings/all \\
  -H \"Authorization: Bearer YOUR_ADMIN_TOKEN\"

# 4. Console MinIO
open http://localhost:9001
\\\

---

**Développé pour Lingua Hub - Session Recording with MinIO**
