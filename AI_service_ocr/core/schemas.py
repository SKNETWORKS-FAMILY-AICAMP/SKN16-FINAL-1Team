from datetime import datetime
from typing import List, Optional, Union
from pydantic import BaseModel


# ---------------------------
# OCR Raw Result (DB 저장 내용)
# ---------------------------
class OCRDetail(BaseModel):
    ocr_id: int
    file_id: int
    user_id: int
    source_type: str
    status: str
    text: Optional[str]
    visit_id: Optional[int]
    created_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


# ---------------------------
# OCR Raw 텍스트 파싱 요청
# ---------------------------
class OCRParseRequest(BaseModel):
    text: str


# ---------------------------
# Visit Form Schema
# ---------------------------
class VisitFormSchema(BaseModel):
    hospital: Optional[str] = ""
    doctor_name: Optional[str] = ""
    symptom: Optional[str] = ""
    opinion: Optional[str] = ""
    diagnosis_code: Optional[str] = ""
    diagnosis_name: Optional[str] = ""
    date: Optional[str] = ""


# ---------------------------
# Prescription Form Schema
# ---------------------------
class PrescriptionFormSchema(BaseModel):
    med_name: str = ""
    dosage_form: str = ""
    dose: str = ""
    unit: str = ""
    schedule: List[str] = []
    custom_schedule: Optional[str] = None
    start_date: str = ""
    end_date: str = ""

    class Config:
        from_attributes = True


# ---------------------------
# 통합 OCR + 구조화 응답
# ---------------------------
class OCRAnalyzeResponse(BaseModel):
    status: str
    source_type: str
    raw_text: str
    parsed: Optional[Union[VisitFormSchema, PrescriptionFormSchema]] = None
    job_id: int


# ---------------------------
# Chatbot OCR 응답
# ---------------------------
class ChatbotAnswer(BaseModel):
    chat_id: int
    session_id: Optional[str]
    answer: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatbotOCRResponse(BaseModel):
    ocr_id: int
    text: str
    status: str
    chat: Optional[ChatbotAnswer] = None
