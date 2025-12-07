# core/schemas.py
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


# ---------------------------
# OCR Raw Result
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
        orm_mode = True


# ---------------------------
# OCR Raw 텍스트 파싱 요청
# ---------------------------
class OCRParseRequest(BaseModel):
    text: str


# ---------------------------
# Visit / Prescription 폼 자동입력 스키마
# ---------------------------
class VisitFormSchema(BaseModel):
    hospital: Optional[str]
    doctor_name: Optional[str]
    symptom: Optional[str]
    opinion: Optional[str]
    diagnosis_code: Optional[str]
    diagnosis_name: Optional[str]
    date: Optional[str]


# ---------------------------
# Chatbot OCR 응답 (선택)
# ---------------------------
class ChatbotAnswer(BaseModel):
    chat_id: int
    session_id: Optional[str]
    answer: str
    created_at: datetime

    class Config:
        orm_mode = True


class ChatbotOCRResponse(BaseModel):
    ocr_id: int
    text: str
    status: str
    chat: Optional[ChatbotAnswer]
