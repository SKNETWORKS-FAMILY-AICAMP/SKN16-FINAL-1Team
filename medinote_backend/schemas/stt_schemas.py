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
    status: str                    # "done" / "error"
    diagnosis: Optional[str] = None
    symptoms: Optional[str] = None
    notes: Optional[str] = None
    date: Optional[str] = None     # "YYYY-MM-DD"

    class Config:
        orm_mode = True


# ------------------------------------------------------------
# STT 상태 조회 응답 (GET /stt/{stt_id}/status)
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


# ============================================================
# STT 결과 기반으로 VISIT 저장 요청
# (사용자가 '저장' 버튼을 눌렀을 때)
# ------------------------------------------------------------
class STTCreateVisitRequest(BaseModel):
    hospital: str
    dept: str
    diagnosis_code: str
    doctor_name: Optional[str] = None


# ------------------------------------------------------------
# STT 결과 기반 VISIT 저장 응답
# ------------------------------------------------------------
class STTCreateVisitResponse(BaseModel):
    message: str
    visit_id: int
