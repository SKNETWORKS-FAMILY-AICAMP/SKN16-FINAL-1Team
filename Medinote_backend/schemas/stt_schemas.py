# schemas/stt_schemas.py
# ============================================================
# STT SCHEMAS
# ============================================================

from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional
from datetime import date as DateType


# ------------------------------------------------------------
# STT 분석 시작 응답 (stt_id + 상태 반환)
# ------------------------------------------------------------
class STTAnalyzeResponse(BaseModel):
    user_id: int
    stt_id: str
    status: str  # "pending"

    model_config = ConfigDict(from_attributes=True)


# ------------------------------------------------------------
# Whisper → 백엔드 결과 전달용 (POST /stt/{stt_id}/result)
# ------------------------------------------------------------
class STTResultInput(BaseModel):
    status: str                    # "done" 또는 "error"
    diagnosis: Optional[str] = None
    symptoms: Optional[str] = None
    notes: Optional[str] = None
    date: Optional[str] = None     # "YYYY-MM-DD"

    model_config = ConfigDict(from_attributes=True)


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

    # DB에서 datetime.date 객체가 오면 문자열로 변환
    @field_validator('date', mode='before')
    @classmethod
    def convert_date_to_str(cls, v):
        if v is None:
            return None
        if isinstance(v, DateType):
            return v.strftime("%Y-%m-%d")
        return str(v)

    model_config = ConfigDict(from_attributes=True)
