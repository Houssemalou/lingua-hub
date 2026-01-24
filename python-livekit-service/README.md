# ============================================
# LIVEKIT PYTHON SERVICE README
# ============================================

# Installation
pip install -r requirements.txt

# Configuration
cp .env.example .env
# Edit .env with your credentials

# Run Service
python agent.py

# Or use the start script
chmod +x start.sh
./start.sh

# Features
- 🎙️ Speech-to-Text with Deepgram
- 🤖 AI Language Teacher with GPT-4
- 📹 Video and Screen Share Management
- 💬 Real-time Chat
- 📊 Automatic Session Summaries
- 🔄 Integration with Spring Boot Backend
