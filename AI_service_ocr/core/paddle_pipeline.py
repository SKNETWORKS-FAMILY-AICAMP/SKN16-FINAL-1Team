# core/paddle_pipeline.py
from __future__ import annotations

from typing import List

from .engine import get_ocr_engine


def extract_text_from_image(image_path: str) -> str:
    """
    이미지 파일 경로를 입력받아
    PaddleOCR 로 인식한 텍스트 전체를 줄 단위로 합쳐서 반환.
    """
    ocr = get_ocr_engine()

    # result 구조: [ [ [box, (text, score)], ... ], ... ]
    result = ocr.ocr(image_path, cls=True)

    lines: List[str] = []
    for page in result:
        for line in page:
            text = line[1][0]  # (text, score)
            if text:
                lines.append(text)

    return "\n".join(lines)
