from fastapi import FastAPI
from pydantic import BaseModel
import requests
from dotenv import load_dotenv
import os
from fastapi.responses import FileResponse
import uuid

app = FastAPI()
load_dotenv()

eleven_api = os.getenv("ELEVENLABS_API_KEY")
voice_id = os.getenv("VOICE_ID")

class TTSRequest(BaseModel):
    text: str

@app.post("/speak-download")
def speak_and_download(req: TTSRequest):
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    headers = {
        "xi-api-key": eleven_api,
        "Content-Type": "application/json"
    }
    payload = {
        "text": req.text,
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75
        }
    }

    response = requests.post(url, json=payload, headers=headers)
    if response.status_code != 200:
        return {"error": response.text}

    filename = f"stockcast_{uuid.uuid4()}.mp3"
    with open(filename, "wb") as f:
        f.write(response.content)

    return FileResponse(
        path=filename,
        filename="tts_output.mp3",
        media_type="audio/mpeg"
    )


