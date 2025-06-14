from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
import os 
from tts import speak_and_download
from os import system

# The speak_and_download function is already imported above.

app = FastAPI()

class TextRequest(BaseModel):
    text: str
    voice_id: str = "21m00Tcm4TlvDq8ikWAM"  # Default voice ID for ElevenLabs

# RUN LOCAL: python api.py
# EXAMPLE: curl -X POST -H "Content-Type: application/json" http://localhost:8000/process-text --data '{"text": "Hello World And me"}'
@app.post("/process-text")
async def process_text(request: TextRequest):
    if not request.text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    try:
        
        return speak_and_download(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 