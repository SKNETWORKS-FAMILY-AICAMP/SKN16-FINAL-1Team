# --- Base image (ARM 지원) ---
FROM python:3.11-slim

# --- 작업 디렉토리 ---
WORKDIR /app

# --- 시스템 패키지 업데이트 (필요 시) ---
RUN apt-get update && apt-get install -y gcc

# --- requirements 설치 ---
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# --- 프로젝트 파일 복사 ---
COPY . /app

# --- FastAPI 서버 실행 ---
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
