#!/bin/bash

# ============================================
# START LIVEKIT PYTHON SERVICE
# ============================================

echo "Starting LiveKit Python Service..."

# Activate virtual environment (if exists)
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Load environment variables
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Run the agent
python agent.py

echo "Service stopped."
