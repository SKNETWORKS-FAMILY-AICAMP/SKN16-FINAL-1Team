from __future__ import annotations
from datetime import date as Date
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


# ============================================
# Visit 생성 요청 (POST)
# ============================================
class VisitCreate(BaseModel):
    """
    POST /visit Request Body
    """
    hospital: str = Field(..., example="서울대병원")
    date: Date = Field(..., example="2025-12-01")      # ✅ 정상 date
    dept: str = Field(..., example="내과")
    diagnosis_code: str = Field(..., example="J00")

    # 추가 입력 필드 → DB 컬럼으로 매핑됨
    title: Optional[str] = Field(None, example="감기")             # diagnosis_name
    doctor: Optional[str] = Field(None, example="김의사")          # doctor_name
    symptoms: Optional[str] = Field(None, example="기침, 가래")     # symptom
    notes: Optional[str] = Field(None, example="4일 뒤 재방문")    # opinion

    # 이전 스펙(메모) 지원
    memo: Optional[str] = None



# ============================================
# Visit 수정 요청 (PATCH)
# ============================================
class VisitUpdate(BaseModel):
    """
    PATCH /visit/{id} Request Body
    (부분 수정 → 모두 Optional)
    """

    hospital: Optional[str] = Field(None, example="서울대병원")
    date: Optional[Date] = Field(None, example="2025-12-01")
    dept: Optional[str] = Field(None, example="내과")
    diagnosis_code: Optional[str] = Field(None, example="J00")

    title: Optional[str] = Field(None, example="감기")
    doctor: Optional[str] = Field(None, example="김의사")
    symptoms: Optional[str] = Field(None, example="기침")
    notes: Optional[str] = Field(None, example="증상 완화됨")

    memo: Optional[str] = None  # 예전 스펙 호환 (opinion에 매핑 가능)



# ============================================
# Visit 응답 스키마 (GET)
# ============================================
class VisitOut(BaseModel):
    """
    DB → 프론트 응답
    """
    visit_id: int
    hospital: str
    date: Date
    dept: str
    diagnosis_code: str

    # DB 컬럼 명 그대로 내려감 (프론트에서 상호 매핑)
    diagnosis_name: Optional[str]
    doctor_name: Optional[str]
    symptom: Optional[str]
    opinion: Optional[str]

    # Pydantic v2 스타일
    model_config = ConfigDict(from_attributes=True)
