from __future__ import annotations

from typing import List

from fastapi import APIRouter, UploadFile, File, Form, Depends
from sqlalchemy.orm import Session

from database import get_db
from core.crud import (
    run_ocr_and_save,
    parse_ocr_text_to_visit,
    parse_ocr_text_to_prescription,
)
from core.schemas import (
    OCRDetail,
    OCRParseRequest,
    VisitFormSchema,
    PrescriptionFormSchema,
)

FAKE_USER_ID = 1


def current_user_id() -> int:
    return FAKE_USER_ID


# 각 도메인별 라우터
visit_ocr_router = APIRouter(prefix="/visits", tags=["Visit OCR"])
prescription_ocr_router = APIRouter(prefix="/prescriptions", tags=["Prescription OCR"])


# ======================================================
# Visit OCR (DB 저장)
# ======================================================
@visit_ocr_router.post("/{visit_id}/ocr", response_model=OCRDetail)
async def upload_visit_ocr(
    visit_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    진료(Visit)에 대한 OCR 업로드 + PaddleOCR 실행 + DB 저장.
    - File 테이블, OCRJob 테이블에 기록
    - OCR 결과 텍스트는 OCRJob.text 에 저장
    """
    user = current_user_id()
    result = run_ocr_and_save(
        db=db,
        user_id=user,
        upload_file=file,
        source_type="visit",
        visit_id=visit_id,
    )
    return result


@visit_ocr_router.post("/{visit_id}/ocr/parse", response_model=VisitFormSchema)
async def parse_visit(
    visit_id: int,
    payload: OCRParseRequest,
    db: Session = Depends(get_db),
):
    """
    이미 OCR 된 raw text(payload.text)를 GPT에 넣어서
    VisitFormSchema(hospital, doctor_name, symptom, opinion, diagnosis_*, date) 구조로 변환.
    """
    return parse_ocr_text_to_visit(payload.text)


# ======================================================
# Prescription OCR (DB 저장)
# ======================================================
@prescription_ocr_router.post("/{prescription_id}/ocr", response_model=OCRDetail)
async def upload_prescription_ocr(
    prescription_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    처방(Prescription)에 대한 OCR 업로드 + PaddleOCR 실행 + DB 저장.
    - File 테이블, OCRJob 테이블에 기록
    - prescription_id 는 현재 OCR 서비스에서는 단순 path 변수로만 사용
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
    response_model=list[PrescriptionFormSchema],
)
async def parse_prescription(
    prescription_id: int,
    payload: OCRParseRequest,
    db: Session = Depends(get_db),
):
    """
    OCR raw text(payload.text)를 GPT에 넣어서
    여러 개의 PrescriptionFormSchema 리스트로 변환해 반환한다.
    (여러 약을 한 번에 인식하는 용도)
    """
    return parse_ocr_text_to_prescription(payload.text)


# 최종 router 묶기
router = APIRouter()
router.include_router(visit_ocr_router)
router.include_router(prescription_ocr_router)
