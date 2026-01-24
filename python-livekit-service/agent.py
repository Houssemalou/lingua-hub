# ============================================
# PYTHON LIVEKIT SERVICE - GEMINI REALTIME
# Utilise Gemini Flash 2.5 avec audio natif
# pour transcription temps réel et génération de résumés
# Le chat est géré via LiveKit DataChannel (WebRTC)
# ============================================

from livekit import api, rtc, agents
from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli
import asyncio
import logging
import os
from datetime import datetime, timedelta
from typing import Dict, List, Any
import aiohttp
import json
import google.generativeai as genai
from google.generativeai.types import FunctionDeclaration, Tool

# Configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables
LIVEKIT_URL = os.getenv("LIVEKIT_URL", "ws://localhost:7880")
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8080")

# Configure Gemini
genai.configure(api_key=GEMINI_API_KEY)

# ============================================
# BACKEND API TOOLS FOR GEMINI
# ============================================

async def get_room_info(room_id: str) -> Dict[str, Any]:
    """Tool: Get room information from Spring Boot API"""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{BACKEND_URL}/api/rooms/{room_id}") as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get("data", {})
                return {"error": f"Failed to fetch room: {response.status}"}
    except Exception as e:
        logger.error(f"Error fetching room info: {e}")
        return {"error": str(e)}

async def get_room_participants(room_id: str) -> List[Dict[str, Any]]:
    """Tool: Get room participants from Spring Boot API"""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{BACKEND_URL}/api/rooms/{room_id}/participants") as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get("data", [])
                return [{"error": f"Failed to fetch participants: {response.status}"}]
    except Exception as e:
        logger.error(f"Error fetching participants: {e}")
        return [{"error": str(e)}]

async def save_session_summary(session_id: str, summary: Dict[str, Any]) -> Dict[str, Any]:
    """Tool: Save session summary to Spring Boot API"""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{BACKEND_URL}/api/sessions/{session_id}/summary",
                json=summary,
                headers={"Content-Type": "application/json"}
            ) as response:
                if response.status == 200:
                    return {"success": True}
                return {"error": f"Failed to save summary: {response.status}"}
    except Exception as e:
        logger.error(f"Error saving summary: {e}")
        return {"error": str(e)}

# Define tools for Gemini
get_room_info_declaration = FunctionDeclaration(
    name="get_room_info",
    description="Obtenir les informations d'une room (nom, objectif, langue, niveau, professeur)",
    parameters={
        "type": "object",
        "properties": {
            "room_id": {
                "type": "string",
                "description": "L'ID de la room"
            }
        },
        "required": ["room_id"]
    }
)

get_participants_declaration = FunctionDeclaration(
    name="get_room_participants",
    description="Obtenir la liste des participants d'une room avec leurs statuts",
    parameters={
        "type": "object",
        "properties": {
            "room_id": {
                "type": "string",
                "description": "L'ID de la room"
            }
        },
        "required": ["room_id"]
    }
)

gemini_tools = Tool(
    function_declarations=[
        get_room_info_declaration,
        get_participants_declaration
    ]
)

# ============================================
# GEMINI REALTIME SESSION MONITOR
# ============================================

class GeminiRealtimeMonitor:
    """
    Moniteur utilisant Gemini Flash 2.5 avec audio natif
    Écoute en temps réel et génère un résumé contextuel à la fin
    """
    
    def __init__(self, room_id: str, session_id: str):
        self.room_id = room_id
        self.session_id = session_id
        self.session_started = datetime.now()
        self.audio_chunks = []
        self.transcriptions = []
        self.participant_activity = {}
        self.is_muted = True  # Always in mute mode
        
        # Initialize Gemini model with audio support
        self.model = genai.GenerativeModel(
            model_name="gemini-2.0-flash-exp",  # Gemini Flash 2.5 avec audio natif
            tools=[gemini_tools]
        )
        
        logger.info(f"GeminiRealtimeMonitor initialized for session {session_id}")
    
    async def process_audio_stream(self, audio_stream, participant_identity: str):
        """Process audio stream in real-time with Gemini"""
        try:
            # Track participant activity
            if participant_identity not in self.participant_activity:
                self.participant_activity[participant_identity] = {
                    "interactions": 0,
                    "speech_segments": []
                }
            
            # Store audio chunk for transcription
            self.audio_chunks.append({
                "participant": participant_identity,
                "timestamp": datetime.now().isoformat(),
                "audio": audio_stream
            })
            
            self.participant_activity[participant_identity]["interactions"] += 1
            
            # Transcribe with Gemini (audio natif)
            transcription = await self._transcribe_audio_chunk(audio_stream)
            if transcription:
                await self.process_transcription(transcription, participant_identity)
                
        except Exception as e:
            logger.error(f"Error processing audio stream: {e}")
    
    async def _transcribe_audio_chunk(self, audio_data) -> str:
        """Transcribe audio using Gemini native audio support"""
        try:
            # Gemini peut traiter l'audio directement
            response = await asyncio.to_thread(
                self.model.generate_content,
                [
                    "Transcris cet audio en texte:",
                    {"mime_type": "audio/wav", "data": audio_data}
                ]
            )
            return response.text
        except Exception as e:
            logger.error(f"Transcription error: {e}")
            return ""
    
    async def process_transcription(self, text: str, participant_identity: str):
        """Store transcriptions for summary generation"""
        logger.info(f"[{participant_identity}]: {text[:80]}...")
        
        self.transcriptions.append({
            "participant": participant_identity,
            "text": text,
            "timestamp": datetime.now().isoformat()
        })
        
        # Update participant activity
        if participant_identity in self.participant_activity:
            self.participant_activity[participant_identity]["speech_segments"].append(text)
    
    async def generate_summary(self) -> Dict:
        """
        Generate comprehensive session summary using Gemini with tools
        Gemini calls Spring Boot API to get room context
        """
        logger.info("Generating session summary with Gemini...")
        
        session_duration = (datetime.now() - self.session_started).total_seconds() / 60
        
        # Prepare full transcript
        full_transcript = "\n".join([
            f"[{t['participant']}]: {t['text']}"
            for t in self.transcriptions
        ])
        
        # Prepare prompt for Gemini with tool usage
        prompt = f"""Tu es un assistant IA spécialisé dans l'analyse de sessions d'apprentissage de langues.

Session ID: {self.session_id}
Room ID: {self.room_id}
Durée: {session_duration:.1f} minutes
Nombre de participants: {len(self.participant_activity)}

Transcription complète:
{full_transcript}

ÉTAPES:
1. Utilise l'outil get_room_info(room_id="{self.room_id}") pour obtenir:
   - Objectif de la session
   - Langue enseignée
   - Niveau des étudiants
   - Nom du professeur

2. Utilise l'outil get_room_participants(room_id="{self.room_id}") pour obtenir:
   - Liste complète des participants
   - Leurs noms et rôles

3. Analyse la transcription en tenant compte du contexte

4. Génère un résumé JSON complet avec:
   - summary: résumé général de la session
   - key_topics: sujets principaux abordés (array)
   - vocabulary_covered: vocabulaire nouveau (array avec mots et définitions)
   - grammar_points: points de grammaire discutés (array avec explications)
   - student_highlights: performance par étudiant (object: {{studentId: {{participation, strengths, areas_to_improve}}}})
   - recommendations: suggestions pour la prochaine session (array)
   - audio_transcript: transcription complète
   - duration_minutes: durée en minutes (integer)
   - generated_by: "gemini-2.0-flash-exp"

Réponds UNIQUEMENT avec le JSON final, sans texte avant ou après."""

        try:
            # Start conversation with Gemini
            chat = self.model.start_chat(enable_automatic_function_calling=True)
            
            # Send prompt - Gemini will automatically call tools
            response = await asyncio.to_thread(
                chat.send_message,
                prompt
            )
            
            # Parse JSON response
            summary_json = json.loads(response.text)
            
            # Save summary to backend
            await save_session_summary(self.session_id, summary_json)
            
            logger.info("Summary generated and saved successfully")
            return summary_json
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Gemini response as JSON: {e}")
            return self._generate_fallback_summary(full_transcript, session_duration)
        except Exception as e:
            logger.error(f"Error generating summary with Gemini: {e}")
            return self._generate_fallback_summary(full_transcript, session_duration)
    
    def _generate_fallback_summary(self, transcript: str, duration: float) -> Dict:
        """Generate basic summary if Gemini fails"""
        return {
            "summary": f"Session terminée avec succès. Durée: {duration:.1f} minutes, {len(self.participant_activity)} participants.",
            "key_topics": [],
            "vocabulary_covered": [],
            "grammar_points": [],
            "student_highlights": {
                participant: {
                    "interactions": data["interactions"],
                    "participation": "active" if data["interactions"] > 10 else "moderate"
                }
                for participant, data in self.participant_activity.items()
            },
            "audio_transcript": transcript,
            "duration_minutes": int(duration),
            "generated_by": "fallback",
            "recommendations": []
        }

# ============================================
# LIVEKIT ROOM HANDLER
# ============================================

class RoomHandler:
    """Gestion d'une room LiveKit avec GeminiRealtimeMonitor"""
    
    def __init__(self, room: rtc.Room, session_id: str, room_id: str):
        self.room = room
        self.session_id = session_id
        self.room_id = room_id
        self.participants: Dict[str, rtc.Participant] = {}
        self.monitor = None
        
    async def setup_monitor(self):
        """Configure le moniteur Gemini pour la session"""
        self.monitor = GeminiRealtimeMonitor(self.room_id, self.session_id)
        logger.info(f"GeminiRealtimeMonitor configured for room {self.room_id}")
    
    async def handle_participant_connected(self, participant: rtc.RemoteParticipant):
        """Participant joint la room"""
        logger.info(f"Participant connected: {participant.identity}")
        self.participants[participant.identity] = participant
        
        # Subscribe to participant tracks
        for publication in participant.track_publications.values():
            if publication.track:
                await self.handle_track_subscribed(publication.track, publication, participant)
    
    async def handle_participant_disconnected(self, participant: rtc.RemoteParticipant):
        """Participant quitte la room"""
        logger.info(f"Participant disconnected: {participant.identity}")
        if participant.identity in self.participants:
            del self.participants[participant.identity]
    
    async def handle_track_subscribed(
        self,
        track: rtc.Track,
        publication: rtc.TrackPublication,
        participant: rtc.RemoteParticipant
    ):
        """Handle track subscription"""
        logger.info(f"Track subscribed: {track.kind} from {participant.identity}")
        
        if track.kind == rtc.TrackKind.KIND_AUDIO and self.monitor:
            # Process audio with Gemini native audio
            audio_stream = rtc.AudioStream(track)
            asyncio.create_task(
                self.monitor.process_audio_stream(audio_stream, participant.identity)
            )
        
        elif track.kind == rtc.TrackKind.KIND_VIDEO:
            # Handle video/screen share
            if publication.source == rtc.TrackSource.SOURCE_SCREEN_SHARE:
                logger.info(f"Screen share started by {participant.identity}")
                await self.notify_backend_screen_share(participant.identity, True)
    
    async def handle_track_unsubscribed(
        self,
        track: rtc.Track,
        publication: rtc.TrackPublication,
        participant: rtc.RemoteParticipant
    ):
        """Handle track unsubscription"""
        if publication.source == rtc.TrackSource.SOURCE_SCREEN_SHARE:
            logger.info(f"Screen share stopped by {participant.identity}")
            await self.notify_backend_screen_share(participant.identity, False)
    
    async def handle_data_received(
        self,
        data: rtc.DataPacket,
        participant: rtc.RemoteParticipant
    ):
        """
        Handle data messages via DataChannel
        Chat messages are now handled directly via WebRTC, not stored
        Only log for monitoring purposes
        """
        try:
            message = json.loads(data.data.decode())
            logger.info(f"DataChannel message from {participant.identity}: {message.get('type')}")
            
            # Data is handled client-to-client via LiveKit DataChannel
            # No backend storage needed
                
        except Exception as e:
            logger.error(f"Error handling data: {e}")
    
    async def notify_backend_screen_share(self, identity: str, is_sharing: bool):
        """Notify backend about screen share status"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{BACKEND_URL}/api/rooms/{self.room_id}/screen-share",
                    json={"identity": identity, "is_sharing": is_sharing},
                    headers={"Content-Type": "application/json"}
                ) as resp:
                    if resp.status == 200:
                        logger.info(f"Notified backend about screen share: {identity} - {is_sharing}")
        except Exception as e:
            logger.error(f"Error notifying backend about screen share: {e}")
    
    async def end_session_and_generate_summary(self):
        """End session and generate summary with Gemini"""
        if self.monitor:
            summary = await self.monitor.generate_summary()
            logger.info("Session summary generated and saved via Gemini")
            return summary
        return None

# ============================================
# LIVEKIT AGENT ENTRY POINT
# ============================================

async def entrypoint(ctx: JobContext):
    """Main entry point for LiveKit agent"""
    logger.info(f"Agent connecting to room: {ctx.room.name}")
    
    # Initialize room handler with room name as both session_id and room_id
    handler = RoomHandler(ctx.room, ctx.room.name, ctx.room.name)
    
    # Setup monitor
    await handler.setup_monitor()
    
    # Connect to room
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    
    # Set up event handlers
    ctx.room.on("participant_connected", handler.handle_participant_connected)
    ctx.room.on("participant_disconnected", handler.handle_participant_disconnected)
    ctx.room.on("track_subscribed", handler.handle_track_subscribed)
    ctx.room.on("track_unsubscribed", handler.handle_track_unsubscribed)
    ctx.room.on("data_received", handler.handle_data_received)
    
    logger.info(f"Agent ready for room: {ctx.room.name}")

if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            api_key=LIVEKIT_API_KEY,
            api_secret=LIVEKIT_API_SECRET,
            ws_url=LIVEKIT_URL,
        )
    )
