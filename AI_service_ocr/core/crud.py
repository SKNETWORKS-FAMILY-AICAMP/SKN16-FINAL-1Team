# core/crud.py
from __future__ import annotations

import os
import uuid
import shutil
from datetime import datetime
from typing import Optional

from fastapi import UploadFile
from sqlalchemy.orm import Session

from core.models import File, OCRJob
from core.schemas import VisitFormSchema
from core.paddle_pipeline import extract_text_from_image
from core.gpt_client import parse_visit_form_from_ocr
from core.config import OCR_UPLOAD_DIR


# -----------------------------
# 파일 저장
# -----------------------------
def save_file(upload: UploadFile) -> str:
    os.makedirs(OCR_UPLOAD_DIR, exist_ok=True)

    ext = os.path.splitext(upload.filename or "")[1]
    new_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(OCR_UPLOAD_DIR, new_name)

    upload.file.seek(0)
    with open(file_path, "wb") as f:
        shutil.copyfileobj(upload.file, f)

    return file_path


# -----------------------------
# File 레코드 생성
# -----------------------------
def create_file_record(
    db: Session,
    user_id: int,
    upload: UploadFile,
    path: str,
) -> File:
    size = os.path.getsize(path)

    file = File(
        user_id=user_id,
        path=path,
        original_name=upload.filename,
        mime_type=upload.content_type,
        size=size,
    )
    db.add(file)
    db.commit()
    db.refresh(file)
    return file


# -----------------------------
# 실제 OCR 모델 실행 (PaddleOCR)
# -----------------------------
def run_ocr_model(path: str) -> str:
    """
    PaddleOCR 기반 실제 OCR 실행.
    """
    return extract_text_from_image(path)


# -----------------------------
# OCR 실행 + DB 저장
# -----------------------------
def run_ocr_and_save(
    db: Session,
    user_id: int,
    upload_file: UploadFile,
    source_type: str,
    visit_id: Optional[int] = None,
) -> OCRJob:
    """
    1) 파일 저장
    2) file 테이블에 레코드 생성
    3) ocr_job 레코드(RUNNING) 생성
    4) paddleocr 실행 → text
    5) ocr_job 상태/텍스트/완료시각 업데이트
    """
    # 1) 파일 저장
    path = save_file(upload_file)

    # 2) File 레코드 생성
    file_obj = create_file_record(db, user_id, upload_file, path)

    # 3) OCRJob 레코드 생성 (RUNNING)
    ocr = OCRJob(
        user_id=user_id,
        file_id=file_obj.file_id,
        visit_id=visit_id,
        source_type=source_type,
        status="RUNNING",
        created_at=datetime.utcnow(),
    )
    db.add(ocr)
    db.commit()
    db.refresh(ocr)

    # 4) OCR 모델 실행
    try:
        text = run_ocr_model(path)
        ocr.text = text
        ocr.status = "DONE"
    except Exception as e:
        ocr.status = "FAILED"
        ocr.text = f"OCR ERROR: {e}"

    ocr.completed_at = datetime.utcnow()

    db.add(ocr)
    db.commit()
    db.refresh(ocr)

    return ocr


# -----------------------------
# OCR Raw → Visit/Prescription 폼 구조화 (GPT)
# -----------------------------
def parse_ocr_text_to_visit(text: str) -> VisitFormSchema:
    """
    OCR result text → Visit/Prescription 폼 자동 구조화

    - GPT_API를 이용해 VisitFormSchema 형태로 파싱
    - 실패 시, 최소한의 더미 값으로 fallback
    """
    try:
        data = parse_visit_form_from_ocr(text)
        return VisitFormSchema(**data)
    except Exception:
        # 실패 시 안전한 기본 구조로 반환
        dummy = {
            "hospital": "",
            "doctor_name": "",
            "symptom": text[:200],
            "opinion": "",
            "diagnosis_code": "",
            "diagnosis_name": "",
            "date": str(datetime.today().date()),
        }
        return VisitFormSchema(**dummy)
