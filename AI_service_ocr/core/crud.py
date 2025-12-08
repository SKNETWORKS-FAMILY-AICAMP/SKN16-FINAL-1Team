from __future__ import annotations

import os
import uuid
import shutil
from datetime import datetime
from typing import Optional

from fastapi import UploadFile
from sqlalchemy.orm import Session

from core.models import File, OCRJob
from core.schemas import VisitFormSchema, PrescriptionFormSchema
from core.paddle_pipeline import extract_text_from_image
from core.gpt_client import (
    parse_visit_form_from_ocr,
    parse_prescription_form_from_ocr,
)
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
# File 테이블 Row 생성
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
# Paddle OCR 실행
# -----------------------------
def run_ocr_model(path: str) -> str:
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
    path = save_file(upload_file)

    file_obj = create_file_record(db, user_id, upload_file, path)

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


# ==================================================
# OCR raw text → Visit 구조화
# ==================================================
def parse_ocr_text_to_visit(text: str) -> VisitFormSchema:
    """
    OCR result text → Visit Form 자동 구조화
    GPT가 camelCase / 기타 키로 줘도 스키마에 맞게 매핑
    """
    try:
        raw = parse_visit_form_from_ocr(text) or {}

        data: dict[str, str] = {}

        # 병원명
        data["hospital"] = (
            raw.get("hospital")
            or raw.get("hospital_name")
            or raw.get("clinic")
            or ""
        )

        # 의사 이름
        data["doctor_name"] = (
            raw.get("doctor_name")
            or raw.get("doctor")
            or raw.get("physician")
            or ""
        )

        # 증상
        data["symptom"] = (
            raw.get("symptom")
            or raw.get("symptoms")
            or raw.get("chief_complaint")
            or ""
        )

        # 소견/메모
        data["opinion"] = (
            raw.get("opinion")
            or raw.get("notes")
            or raw.get("assessment")
            or ""
        )

        # 진단 코드 & 이름
        data["diagnosis_code"] = (
            raw.get("diagnosis_code")
            or raw.get("diagnosisCode")
            or raw.get("icd_code")
            or ""
        )
        data["diagnosis_name"] = (
            raw.get("diagnosis_name")
            or raw.get("diagnosisName")
            or raw.get("diagnosis")
            or ""
        )

        # 날짜
        data["date"] = (
            raw.get("date")
            or raw.get("visit_date")
            or raw.get("visitDate")
            or str(datetime.today().date())
        )

        return VisitFormSchema(**data)

    except Exception:
        # 완전 실패 시 최소한 날짜 + 증상 일부만 채워서 반환
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


# ==================================================
# OCR raw text → Prescription 구조화
# ==================================================
def parse_ocr_text_to_prescription(text: str) -> PrescriptionFormSchema:
    """
    OCR result text → Prescription Form 자동 구조화
    GPT가 camelCase / 다양한 키로 줘도 스키마에 맞게 매핑
    """
    try:
        raw = parse_prescription_form_from_ocr(text) or {}

        data: dict[str, object] = {}

        # 약 이름
        data["med_name"] = (
            raw.get("med_name")
            or raw.get("medName")
            or raw.get("drug_name")
            or raw.get("name")
            or ""
        )

        # 제형
        data["dosage_form"] = (
            raw.get("dosage_form")
            or raw.get("dosageForm")
            or raw.get("form")
            or ""
        )

        # 용량 / 단위
        data["dose"] = raw.get("dose") or raw.get("dose_amount") or raw.get("strength") or ""
        data["unit"] = raw.get("unit") or raw.get("dose_unit") or ""

        # 복용 시간(schedule)
        schedule = (
            raw.get("schedule")
            or raw.get("dose_times")
            or raw.get("when")
            or []
        )

        if isinstance(schedule, str):
            items = [s.strip() for s in schedule.split(",") if s.strip()]
            data["schedule"] = items
        elif isinstance(schedule, list):
            data["schedule"] = [
                str(s).strip() for s in schedule if str(s).strip()
            ]
        else:
            data["schedule"] = []

        # 기타 복약 시간
        data["custom_schedule"] = (
            raw.get("custom_schedule")
            or raw.get("customSchedule")
            or raw.get("etc")
            or None
        )

        # 시작일 / 종료일
        data["start_date"] = raw.get("start_date") or raw.get("startDate") or ""
        data["end_date"] = raw.get("end_date") or raw.get("endDate") or ""

        return PrescriptionFormSchema(**data)

    except Exception:
        dummy = {
            "med_name": "",
            "dosage_form": "",
            "dose": "",
            "unit": "",
            "schedule": [],
            "custom_schedule": None,
            "start_date": "",
            "end_date": "",
        }
        return PrescriptionFormSchema(**dummy)
