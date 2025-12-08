# core/engine.py
from __future__ import annotations

from functools import lru_cache
from paddleocr import PaddleOCR


@lru_cache(maxsize=1)
def get_ocr_engine() -> PaddleOCR:
    """
    PaddleOCR 엔진을 1번만 로드해서 재사용.
    - lang="korean" : 한국어 위주
      (영문도 어느 정도 인식 가능)
    """
    ocr = PaddleOCR(
        use_angle_cls=True,
        lang="korean",   # 한국어 OCR
        # show_log=False,  # ❌ 이 줄 삭제
    )
    return ocr
