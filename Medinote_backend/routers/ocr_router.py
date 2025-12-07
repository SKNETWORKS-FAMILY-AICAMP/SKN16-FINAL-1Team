# routers/ocr_router.py

from fastapi import APIRouter, UploadFile, File, Form, Depends
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from crud.ocr_crud import (
    run_ocr_and_save,
    parse_ocr_text_to_visit,
)
from schemas.ocr_schemas import (
    OCRDetail,
    OCRParseRequest,
    VisitFormSchema,
    ChatbotOCRResponse,
)


USE_FAKE_AUTH = True
FAKE_USER_ID = 1


def current_user_id() -> int:
    # TODO: 나중에 실제 JWT 의존성으로 교체
    return FAKE_USER_ID


ocr_router = APIRouter(prefix="/ocr", tags=["OCR"])
visit_ocr_router = APIRouter(prefix="/visits", tags=["Visit OCR"])
prescription_ocr_router = APIRouter(prefix="/prescriptions", tags=["Prescription OCR"])
chatbot_ocr_router = APIRouter(prefix="/chatbot", tags=["Chatbot OCR"])


# ======================================================
# OCR 공통 (모델 작업자 테스트용)
# ======================================================
@ocr_router.post("/analyze", response_model=OCRDetail)
async def analyze_ocr(
    file: UploadFile = File(...),
    source_type: str = Form("record"),
    visit_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
):
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
# ======================================================
@visit_ocr_router.post("/{visit_id}/ocr", response_model=OCRDetail)
async def upload_visit_ocr(
    visit_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
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
# ======================================================
@visit_ocr_router.post("/{visit_id}/ocr/parse", response_model=VisitFormSchema)
async def parse_ocr_to_visit(
    visit_id: int,
    payload: OCRParseRequest,
    db: Session = Depends(get_db),
):
    """
    OCR 결과(raw text)를 Visit 폼 구조로 자동 변환
    (STT 자동 입력과 동일한 역할)
    """
    structured = parse_ocr_text_to_visit(payload.text)
    return structured


# ======================================================
# Prescription OCR
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
    (필요하면 나중에 OCRJob에 prescription_id 컬럼 추가)
    """
    user = current_user_id()
    result = run_ocr_and_save(
        db=db,
        user_id=user,
        upload_file=file,
        source_type="prescription",
        visit_id=None,  # prescription에는 아직 FK 연결 안 함
    )
    return result


# ======================================================
# OCR → Prescription 폼 자동입력 구조화
# (VisitFormSchema 재사용)
# ======================================================
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
# Chatbot OCR
# ======================================================
@chatbot_ocr_router.post("/ocr", response_model=ChatbotOCRResponse)
async def chatbot_ocr(
    file: UploadFile = File(...),
    auto_query: bool = Form(False),
    db: Session = Depends(get_db),
):
    user = current_user_id()
    ocr_job = run_ocr_and_save(
        db=db,
        user_id=user,
        upload_file=file,
        source_type="chatbot",
        visit_id=None,
    )

    # auto_query=False → OCR 텍스트만 반환
    if not auto_query:
        return ChatbotOCRResponse(
            ocr_id=ocr_job.ocr_id,
            text=ocr_job.text or "",
            status=ocr_job.status,
            chat=None,
        )

    # auto_query=True → Chatbot까지 연동 (지금은 dummy)
    return ChatbotOCRResponse(
        ocr_id=ocr_job.ocr_id,
        text=ocr_job.text or "",
        status=ocr_job.status,
        chat={
            "chat_id": 0,
            "session_id": None,
            "answer": "더미 챗봇 응답입니다.",
            "created_at": ocr_job.completed_at or ocr_job.created_at,
        },
    )