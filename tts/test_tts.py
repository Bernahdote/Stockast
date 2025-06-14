from fastapi.testclient import TestClient
from tts.tts import app  # ← 파일명이 tts.py이므로 여기서 app을 import

client = TestClient(app)

def test_speak_download():
    payload = {
        "text": "Let's gooo"
    }

    response = client.post("/speak-download", json=payload)

    # 응답 상태 코드 확인
    assert response.status_code == 200

    # MP3 형식인지 확인
    assert response.headers["content-type"] == "audio/mpeg"

    # 내용 존재 여부
    assert len(response.content) > 1000

    # 다운로드 헤더 확인
    assert "attachment" in response.headers.get("content-disposition", "")