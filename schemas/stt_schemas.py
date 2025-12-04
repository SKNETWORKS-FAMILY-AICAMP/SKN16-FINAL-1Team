# schemas/stt_schemas.py
# ============================================================
# STT SCHEMAS
# ============================================================

from pydantic import BaseModel
from typing import Optional


# ------------------------------------------------------------
# STT 분석 시작 응답 (stt_id + 상태 반환)
# ------------------------------------------------------------
class STTAnalyzeResponse(BaseModel):
    user_id: int
    stt_id: str
    status: str  # "pending"

    class Config:
        orm_mode = True


# ------------------------------------------------------------
# Whisper → 백엔드 결과 전달용 (POST /stt/{stt_id}/result)
# ------------------------------------------------------------
class STTResultInput(BaseModel):
    status: str                    # "done" 또는 "error"
    diagnosis: Optional[str] = None
    symptoms: Optional[str] = None
    notes: Optional[str] = None
    date: Optional[str] = None     # "YYYY-MM-DD"

    class Config:
        orm_mode = True


# ------------------------------------------------------------
# STT 상태/결과 조회용 (GET /stt/{stt_id}/status)
# ------------------------------------------------------------
class STTStatusResponse(BaseModel):
    stt_id: str
    status: str
    user_id: Optional[int] = None
    diagnosis: Optional[str] = None
    symptoms: Optional[str] = None
    notes: Optional[str] = None
    date: Optional[str] = None

    class Config:
        orm_mode = True
