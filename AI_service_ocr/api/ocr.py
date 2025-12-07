# api/ocr.py
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, UploadFile, File, Form, Depends
from sqlalchemy.orm import Session

from database import get_db
from core.crud import (
    run_ocr_and_save,
    parse_ocr_text_to_visit,
)
from core.schemas import (
    OCRDetail,
    OCRParseRequest,
    VisitFormSchema,
    ChatbotOCRResponse,
)

# 지금은 인증 연동 전이므로 임시 유저 ID 사용
USE_FAKE_AUTH = True
FAKE_USER_ID = 1


def current_user_id() -> int:
    # TODO: 나중에 실제 JWT 의존성으로 교체
    return FAKE_USER_ID


# 개별 라우터들
ocr_router = APIRouter(prefix="/ocr", tags=["OCR"])
visit_ocr_router = APIRouter(prefix="/visits", tags=["Visit OCR"])
prescription_ocr_router = APIRouter(prefix="/prescriptions", tags=["Prescription OCR"])
chatbot_ocr_router = APIRouter(prefix="/chatbot", tags=["Chatbot OCR"])


# ======================================================
# OCR 공통 (모델 테스트용)
# ======================================================
@ocr_router.post("/analyze", response_model=OCRDetail)
async def analyze_ocr(
    file: UploadFile = File(...),
    source_type: str = Form("record"),
    visit_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
):
    """
    범용 OCR 테스트용 엔드포인트.
    """
    user = current_user_id()
    result = run_ocr_and_save(
        db=db,
        user_id=user,
        upload_file=file,
        source_type=source_type,
        visit_id=visit_id,
    )
    return result


# ======================================================
# Visit OCR
#   POST /visits/{visit_id}/ocr
# ======================================================
@visit_ocr_router.post("/{visit_id}/ocr", response_model=OCRDetail)
async def upload_visit_ocr(
    visit_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    진료기록 화면에서 OCR 업로드.
    - paddleocr 로 이미지 → text
    - ocr_job 테이블에 저장 후 결과 반환
    """
    user = current_user_id()
    result = run_ocr_and_save(
        db=db,
        user_id=user,
        upload_file=file,
        source_type="record",
        visit_id=visit_id,
    )
    return result


# ======================================================
# OCR → Visit 폼 자동입력 구조화
#   POST /visits/{visit_id}/ocr/parse
# ======================================================
@visit_ocr_router.post("/{visit_id}/ocr/parse", response_model=VisitFormSchema)
async def parse_ocr_to_visit(
    visit_id: int,
    payload: OCRParseRequest,
    db: Session = Depends(get_db),
):
    """
    OCR 결과(raw text)를 Visit 폼 구조로 자동 변환.
    - 내부에서 GPT_API 호출
    - {hospital, doctor_name, symptom, opinion, diagnosis_code,
       diagnosis_name, date} 형태로 반환
    """
    structured = parse_ocr_text_to_visit(payload.text)
    return structured


# ======================================================
# Prescription OCR
#   (선택: 처방전 OCR도 동일 패턴으로 사용 가능)
# ======================================================
@prescription_ocr_router.post("/{prescription_id}/ocr", response_model=OCRDetail)
async def upload_prescription_ocr(
    prescription_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    처방전 화면에서 OCR 업로드.
    현재는 prescription_id를 OCRJob에 직접 FK로 연결하지 않고,
    source_type="prescription" 으로만 구분해서 사용.
    """
    user = current_user_id()
    result = run_ocr_and_save(
        db=db,
        user_id=user,
        upload_file=file,
        source_type="prescription",
        visit_id=None,
    )
    return result


@prescription_ocr_router.post(
    "/{prescription_id}/ocr/parse",
    response_model=VisitFormSchema,
)
async def parse_ocr_to_prescription(
    prescription_id: int,
    payload: OCRParseRequest,
    db: Session = Depends(get_db),
):
    """
    OCR 결과(raw text)를 처방전 폼 구조로 자동 변환.
    Visit 폼과 구조가 동일해서 VisitFormSchema 재사용.
    """
    structured = parse_ocr_text_to_visit(payload.text)
    return structured


# ======================================================
# Chatbot OCR (선택)
# ======================================================
@chatbot_ocr_router.post("/ocr", response_model=ChatbotOCRResponse)
async def chatbot_ocr(
    file: UploadFile = File(...),
    auto_query: bool = Form(False),
    db: Session = Depends(get_db),
):
    """
    챗봇에서 이미지 업로드 → OCR 텍스트 반환
    (auto_query=True 이면, 나중에 챗봇까지 연동 가능)
    """
    user = current_user_id()
    ocr_job = run_ocr_and_save(
        db=db,
        user_id=user,
        upload_file=file,
        source_type="chatbot",
        visit_id=None,
    )

    if not auto_query:
        # OCR 텍스트만 반환
        return ChatbotOCRResponse(
            ocr_id=ocr_job.ocr_id,
            text=ocr_job.text or "",
            status=ocr_job.status,
            chat=None,
        )

    # auto_query=True 인 경우, 나중에 AI_service_LLM 연동 가능
    return ChatbotOCRResponse(
        ocr_id=ocr_job.ocr_id,
        text=ocr_job.text or "",
        status=ocr_job.status,
        chat={
            "chat_id": 0,
            "session_id": None,
            "answer": "더미 챗봇 응답입니다. (추후 LLM 연동 예정)",
            "created_at": ocr_job.completed_at or ocr_job.created_at,
        },
    )


# ======================================================
# 🔚 최종으로 app.py에 물릴 router
#    ⬇️ 이 블록은 반드시 파일 맨 아래에 있어야 함
# ======================================================
router = APIRouter()
router.include_router(ocr_router)
router.include_router(visit_ocr_router)
router.include_router(prescription_ocr_router)
router.include_router(chatbot_ocr_router)
