# core/paddle_pipeline.py
from __future__ import annotations

from pathlib import Path
from typing import List, Any, Dict

from .engine import get_ocr_engine


def extract_text_from_image(image_path: str) -> str:
    """
    이미지 파일 경로를 입력받아
    PaddleOCR(파이프라인 predict)로 인식한 텍스트 전체를
    줄 단위로 합쳐서 반환.
    """
    ocr = get_ocr_engine()

    img_path = Path(image_path)
    if not img_path.exists():
        raise FileNotFoundError(f"이미지 파일을 찾을 수 없습니다: {img_path}")

    # ✅ 3.x 파이프라인 방식: predict() 사용
    results = ocr.predict(str(img_path))

    lines: List[str] = []

    for res in results:
        # Result 객체 → dict 로 변환
        if hasattr(res, "to_dict"):
            data: Dict[str, Any] = res.to_dict()
        elif isinstance(res, dict):
            data = res
        else:
            # 혹시나 다른 타입이면 스킵
            continue

        inner = data.get("res") or data

        # rec_texts 에 인식된 텍스트들이 들어있음
        rec_texts = inner.get("rec_texts") or []

        for text in rec_texts:
            text_str = str(text).strip()
            if text_str:
                lines.append(text_str)

    # ✅ 한 줄당 한 OCR 결과 형태로 합치기
    return "\n".join(lines)
