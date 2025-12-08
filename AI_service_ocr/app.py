# app.py
from __future__ import annotations

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from database import Base, engine
from api.ocr import router as ocr_router

load_dotenv()

# ================================
# DB 테이블 생성
# ================================
Base.metadata.create_all(bind=engine)

# ================================
# FastAPI 앱 정의
# ================================
app = FastAPI(
    title="MediNote OCR Service",
    version="0.1.0",
)

# ================================
# CORS 설정
# ================================
origins = [
    os.getenv("FRONTEND_URL", "http://localhost:5173"),
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ================================
# 기본 헬스체크 라우터
# ================================
@app.get("/")
def home():
    return {"message": "MediNote OCR Service 연결 성공 🚀"}


# ================================
# OCR 라우터 등록
# ================================
app.include_router(ocr_router)
