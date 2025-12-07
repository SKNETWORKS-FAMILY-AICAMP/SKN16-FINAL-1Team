# core/gpt_client.py
from __future__ import annotations

import json
import os
from typing import Dict, Any

from dotenv import load_dotenv
from openai import OpenAI

from .config import OCR_GPT_MODEL

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

_client: OpenAI | None = None


def get_client() -> OpenAI:
    global _client
    if _client is None:
        if not OPENAI_API_KEY:
            raise RuntimeError("OPENAI_API_KEY 환경변수가 설정되지 않았습니다.")
        _client = OpenAI(api_key=OPENAI_API_KEY)
    return _client


SYSTEM_PROMPT = """
너는 병원 진료기록/처방전 OCR 텍스트를 구조화하는 의료 서류 정리 전문가다.

다음 필드를 가진 JSON 객체 한 개만 반환해야 한다.
- hospital: 병원 이름 (모르면 "" 로)
- doctor_name: 의사 이름 (모르면 "" 로)
- symptom: 환자의 증상/호소 내용 요약
- opinion: 의사의 소견/계획 요약
- diagnosis_code: 상병 코드(예: J00, K21.9) 없으면 "" 
- diagnosis_name: 상병명 (예: 급성 기관지염)
- date: 내원일 / 진료일 (YYYY-MM-DD 형식, 없으면 "")

⚠️ 반드시 JSON 만 반환하고, 설명/자연어 문장은 절대 추가하지 마라.
"""


def parse_visit_form_from_ocr(text: str) -> Dict[str, Any]:
    """
    OCR로 나온 raw text 를 GPT를 사용해 VisitFormSchema 형태로 파싱.
    """
    client = get_client()

    resp = client.chat.completions.create(
        model=OCR_GPT_MODEL,
        temperature=0.1,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"OCR로 인식된 원본 텍스트는 다음과 같다:\n{text}",
            },
        ],
    )

    content = resp.choices[0].message.content
    return json.loads(content)
