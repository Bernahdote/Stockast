from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
import uvicorn
from tts import speak_and_download, TTSRequest
from scrape import understand_input, get_keys, get_news

app = FastAPI()

class TextRequest(BaseModel):
    text: str
    voice_id: str = "21m00Tcm4TlvDq8ikWAM"  # Default voice ID for ElevenLabs

# RUN LOCAL: python api.py
# EXAMPLE: curl -X POST -H "Content-Type: application/json" http://localhost:8000/process-text --data '{"text": "interested in Google, Nividia and Apple stocks"}'
@app.post("/process-text")
async def process_text(request: TextRequest):
    if not request.text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    try:
        keys = understand_input(request.text)

        sum = ""
        for key in keys: 
            keyfacts = get_keys(key) 
            news = get_news(key)
            sum = sum.join([keyfacts, news])


        audio_data = speak_and_download(TTSRequest(text=sum, voice_id=request.voice_id))
        if isinstance(audio_data, dict) and "error" in audio_data:
            raise HTTPException(status_code=500, detail=audio_data["error"])
        return Response(content=audio_data, media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 