# core/config.py
from __future__ import annotations

import os
from dotenv import load_dotenv

load_dotenv()

# 업로드 경로
OCR_UPLOAD_DIR = os.getenv("OCR_UPLOAD_DIR", "uploads/ocr")

# GPT 모델
OCR_GPT_MODEL = os.getenv("OCR_GPT_MODEL", "gpt-4o-mini")
