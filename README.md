# SKN16-FINAL-1Team
SKN16-FINAL-1Team

# 1. Backend (포트 8000)
cd Medinote_backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 2. Frontend (포트 5173)
cd medinote_front
npm run dev

- .env파일 필요
VITE_API_URL= your vite_api_url

# 3. STT (포트 8002)
cd AI_service_stt
uvicorn app:app --reload --host 0.0.0.0 --port 8002