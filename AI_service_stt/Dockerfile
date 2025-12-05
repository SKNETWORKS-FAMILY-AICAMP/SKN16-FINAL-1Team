# AI_service_stt Dockerfile
FROM python:3.11-slim

# 작업 디렉토리 설정
WORKDIR /app

# ffmpeg 설치 (pydub 오디오 변환용)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# requirements.txt 복사 및 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 소스 코드 복사
COPY . .

# 포트 노출
EXPOSE 8002

# 서버 실행
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8002"]
