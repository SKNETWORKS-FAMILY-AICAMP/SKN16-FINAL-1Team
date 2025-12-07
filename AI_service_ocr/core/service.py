# core/service.py
from __future__ import annotations

from typing import Optional
from fastapi import UploadFile
from sqlalchemy.orm import Session

from .crud import run_ocr_and_save, parse_ocr_text_to_visit
from .schemas import VisitFormSchema
from .models import OCRJob


def analyze_image_ocr(
    db: Session,
    user_id: int,
    file: UploadFile,
    source_type: str = "record",
    visit_id: Optional[int] = None,
) -> OCRJob:
    """
    기존 코드 호환용 래퍼.
    """
    return run_ocr_and_save(
        db=db,
        user_id=user_id,
        upload_file=file,
        source_type=source_type,
        visit_id=visit_id,
    )


def parse_ocr_text(
    text: str,
) -> VisitFormSchema:
    """
    기존 코드 호환용 래퍼.
    """
    return parse_ocr_text_to_visit(text)
