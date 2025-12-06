# crud/ocr_crud.py

import os
import uuid
import shutil
from datetime import datetime
from typing import Optional

from fastapi import UploadFile
from sqlalchemy.orm import Session

from models import File, OCRJob
from schemas.ocr_schemas import VisitFormSchema

UPLOAD_DIR = "uploads/ocr"


# -----------------------------
# 파일 저장
# -----------------------------
def save_file(upload: UploadFile) -> str:
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    ext = os.path.splitext(upload.filename or "")[1]
    new_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, new_name)

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
    path: str
) -> File:
    size = os.path.getsize(path)

    file = File(
        user_id=user_id,
        path=path,
        original_name=upload.filename,
        mime_type=upload.content_type,
        size=size
    )
    db.add(file)
    db.commit()
    db.refresh(file)
    return file


# -----------------------------
# Dummy OCR Model
# (모델 작업자가 이 함수만 교체하면 됨)
# -----------------------------
def run_ocr_model(path: str) -> str:
    return f"OCR 더미 결과입니다. (path={path})"


# -----------------------------
# OCR 실행 + DB 저장
# -----------------------------
def run_ocr_and_save(
    db: Session,
    user_id: int,
    upload_file: UploadFile,
    source_type: str,
    visit_id: Optional[int] = None,   # visit_id는 Nullable
):
    # 1) 파일 저장
    path = save_file(upload_file)

    # 2) File 레코드 생성
    file_obj = create_file_record(db, user_id, upload_file, path)

    # 3) OCRJob 레코드 생성 (RUNNING)
    ocr = OCRJob(
        user_id=user_id,
        file_id=file_obj.file_id,
        visit_id=visit_id,         # 지금은 Visit에만 FK 있음
        source_type=source_type,
        status="RUNNING",
        created_at=datetime.utcnow()
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
# OCR Raw → Visit/Prescription 폼 구조화 (LLM 자리)
# -----------------------------
def parse_ocr_text_to_visit(text: str) -> VisitFormSchema:
    """
    OCR result text → Visit/Prescription 폼 자동 구조화

    지금은 dummy.
    LLM 연동 시 여기를 교체하면 됨.
    """

    dummy = {
        "hospital": "",
        "doctor_name": "",
        "symptom": text[:30],  # 일단 raw text 앞부분만 사용
        "opinion": "",
        "diagnosis_code": "",
        "diagnosis_name": "",
        "date": str(datetime.today().date())
    }

    return VisitFormSchema(**dummy)
