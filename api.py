from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
import ast
import uvicorn
from tts import speak_and_download, TTSRequest
from scrape import understand_tickrs, get_keys, get_news, understand_markets, understand_sectors, get_technical_summary, get_sector_news, get_market_news, generate_podcast

app = FastAPI()

class TextRequest(BaseModel):
    text: str
    voice_id: str = "21m00Tcm4TlvDq8ikWAM"  # Default voice ID for ElevenLabs

# RUN LOCAL: python api.py
# EXAMPLE: curl -X POST -H "Content-Type: application/json" http://localhost:8000/process-text --data '{"text": "I'm interested in Apple and health services and crypto" }'
# EXAMPLE: curl -X POST http://localhost:8000/process-text -H "Content-Type: application/json" --data "{\"text\":\"I'm interested in Apple and health services and crypto\"}" --output podcast.mp3 --write-out "\nHTTP status: %{http_code} — bytes: %{size_download}\n"
@app.post("/process-text")
async def process_text(request: TextRequest):
    if not request.text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    try:
        input = request.text
        keys = understand_tickrs(input) 
        sectors = understand_sectors(input) 
        markets = understand_markets(input)

        summary = ""

        for key in keys:
            summary += get_keys(key) 
            summary += get_technical_summary(key)
            summary += get_news(key) 

        sectors  = ast.literal_eval(sectors)   
        markets  = ast.literal_eval(markets)  

        for sec in sectors:
            summary += get_sector_news(sec) 

        for market in markets:
            summary += get_market_news(market)
        
        podcast = generate_podcast(summary)
        
        tts_req   = TTSRequest(text=podcast, voice_id=request.voice_id)
        audio_data = speak_and_download(**tts_req.model_dump())     

        if isinstance(audio_data, dict) and "error" in audio_data:
            raise HTTPException(status_code=500, detail=audio_data["error"])
        return Response(content=audio_data, media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 