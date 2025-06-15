from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import Response, FileResponse, StreamingResponse
from pydantic import BaseModel
import ast
import uvicorn
from tts import speak_and_download, TTSRequest
from scrape import understand_tickrs, get_keyfacts, get_news, understand_markets, understand_sectors, get_technical_summary, get_sector_news, get_market_news, generate_podcast
import base64
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import json
import asyncio
from typing import List, Optional

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextRequest(BaseModel):
    text: str
    voice_id: str = "21m00Tcm4TlvDq8ikWAM"  # Default voice ID for ElevenLabs

# RUN LOCAL: python api.py
# EXAMPLE: curl -X POST -H "Content-Type: application/json" http://localhost:8000/generate-podcast-text --data '{"text": "I'm interested in Apple and health services and crypto" }'
# EXAMPLE: curl -X POST http://localhost:8000/generate-podcast-text -H "Content-Type: application/json" --data "{\"text\":\"I'm interested in Apple and health services and crypto\"}" --output podcast.mp3 --write-out "\nHTTP status: %{http_code} — bytes: %{size_download}\n"
@app.post("/generate-podcast-text")
async def generate_podcast_text(request: TextRequest):
    if not request.text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    async def generate():
        try:
            input = request.text
            
            # 생각하는 과정 스트리밍
            yield f"data: {json.dumps({'type': 'log', 'message': 'Analyzing Market Trends...'})}\n\n"
            keys = understand_tickrs(input) or []
            await asyncio.sleep(1)  # 실제 처리 시간을 시뮬레이션
            
            yield f"data: {json.dumps({'type': 'log', 'message': 'Gathering Financial Data...'})}\n\n"
            sectors = understand_sectors(input) or "[]"
            markets = understand_markets(input) or "[]"
            await asyncio.sleep(1)
            
            summary = ""
            yield f"data: {json.dumps({'type': 'log', 'message': 'Generating Comprehensive Analysis...'})}\n\n"
            
            for key in keys:
                summary += get_keyfacts(key) or ""
                summary += get_technical_summary(key) or ""
                summary += get_news(key) or ""
                await asyncio.sleep(0.5)
            
            try:
                sectors = ast.literal_eval(sectors)
            except Exception:
                sectors = []
            try:
                markets = ast.literal_eval(markets)
            except Exception:
                markets = []
            
            for sec in sectors:
                summary += get_sector_news(sec) or ""
                await asyncio.sleep(0.5)
            
            for market in markets:
                summary += get_market_news(market) or ""
                await asyncio.sleep(0.5)
            
            yield f"data: {json.dumps({'type': 'log', 'message': 'Structuring Podcast Content...'})}\n\n"
            podcast = generate_podcast(summary) or ""
            
            yield f"data: {json.dumps({'type': 'log', 'message': 'Generating Podcast Script...'})}\n\n"
            await asyncio.sleep(1)
            
            # 최종 스크립트 전송
            yield f"data: {json.dumps({'type': 'script', 'content': podcast})}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream"
    )

@app.post("/generate-audio")
async def generate_audio(request: TTSRequest):
    try:
        audio_data = speak_and_download(**request.model_dump())     

        if isinstance(audio_data, dict) and "error" in audio_data:
            raise HTTPException(status_code=500, detail=audio_data["error"])
        return Response(content=audio_data, media_type="audio/mpeg")
    except Exception as e:
        print(f"Error in generate_audio: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, timeout_keep_alive=120) 