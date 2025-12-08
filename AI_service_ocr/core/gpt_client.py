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


# ------------------------------------------
# Visit Parsing Prompt
# ------------------------------------------
VISIT_SYSTEM_PROMPT = """
너는 병원 진료기록(진료확인서, 진단서 등)의 OCR 결과를 분석해서
프론트엔드에서 쓰기 좋은 JSON 형태로 정리하는 전문가야.

입력으로는 줄바꿈/오타/불필요한 정보(주소, 전화번호 등)가 섞인 원문 텍스트가 들어온다.
이 텍스트를 기반으로 아래 필드들을 채워서 **JSON 객체 하나만** 반환해.

반드시 다음 키를 모두 포함해야 한다:
- hospital          : 진료를 받은 병원/의료기관 이름
- doctor_name       : 담당 의사 이름
- symptom           : 환자가 호소하는 증상, 방문 이유 (한두 문장 요약)
- opinion           : 검사/치료 내용 또는 의사의 소견/메모 요약
- diagnosis_code    : 진단 코드(KCD/ICD 등). 없으면 "".
- diagnosis_name    : 진단명/질병명. 없으면 "".
- date              : 진료일 또는 문서 발급일. 형식은 "YYYY-MM-DD".
                      날짜를 알 수 없으면 ""(빈 문자열)을 사용한다.

규칙:
1. 최종 출력은 반드시 JSON 객체 한 개만 있어야 하고, 다른 설명 문장은 절대 넣지 마.
2. 모르는 값은 임의로 추정하지 말고 ""(빈 문자열)로 둔다.
3. hospital:
   - "○○병원", "○○의원", "○○대학교병원"처럼 의료기관명만 깔끔하게 한 줄로.
   - 주소, 층수, 전화번호는 포함하지 않는다.
4. doctor_name:
   - "홍길동", "Dr. Kim" 같은 의사 이름만 추출한다.
   - "원장", "교수" 같은 직함은 빼는 것이 좋다.
5. symptom:
   - "다뇨증, 다음, 체중 감소"처럼 주요 증상/주호소를 한두 문장으로 정리한다.
6. opinion:
   - 시행한 검사, 처방, 향후 계획 등 의사 소견을 요약한다.
7. diagnosis_code / diagnosis_name:
   - OCR 텍스트에 KCD/ICD 코드나 질병명이 보이면 최대한 사용한다.
   - 없으면 둘 다 "".
8. date:
   - "진료일자", "진료일", "조제일자", "발급일자" 등에서 날짜를 찾아 "YYYY-MM-DD" 형식으로 변환한다.
   - 연/월/일이 불명확하면 ""로 둔다.
"""


def parse_visit_form_from_ocr(text: str) -> Dict[str, Any]:
    client = get_client()

    resp = client.chat.completions.create(
        model=OCR_GPT_MODEL,
        temperature=0.1,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": VISIT_SYSTEM_PROMPT},
            {"role": "user", "content": text},
        ],
    )

    content = resp.choices[0].message.content
    return json.loads(content)


# ------------------------------------------
# Prescription Parsing Prompt
# ------------------------------------------
PRESCRIPTION_SYSTEM_PROMPT = """
너는 처방전/약봉투 OCR 텍스트를 분석해서
프론트엔드의 복약 정보 폼에 맞게 구조화하는 전문가야.

입력으로는 줄바꿈/오타/불필요한 정보(주소, 전화번호, 병원 안내문 등)가 섞인
처방전 또는 약봉투의 전체 텍스트가 들어온다.

이 텍스트를 기반으로 **하나의 대표 약** 정보를 골라서
다음 필드를 가진 JSON 객체 하나만 반환해라:

- med_name         : 약 이름 (예: "글루코파지정 500mg")
- dosage_form      : 제형 (예: "정제", "캡슐", "시럽" 등)
- dose             : 1회 투여량 숫자 또는 문자열 (예: "500")
- unit             : 용량 단위 (예: "mg", "mcg", "g", "mL", "%")
- schedule         : 복용 시점의 배열
                     예) ["아침"], ["아침", "저녁"], ["아침", "점심", "저녁"], ["취침전"], ["증상시"]
- custom_schedule  : 위 기본 시점으로 표현하기 어려운 추가 설명(없으면 null)
                     예) "식후 30분", "매 식사와 함께", "필요 시 1정"
- start_date       : 복용 시작일. 알 수 있으면 "YYYY-MM-DD", 없으면 "".
- end_date         : 복용 종료일. 알 수 있으면 "YYYY-MM-DD", 없으면 "".

규칙:
1. 최종 출력은 반드시 JSON 객체 하나만 있어야 한다. 그 외 문장은 절대 넣지 마.
2. 필드를 전부 포함해야 하며, 모르면 아래처럼 처리한다:
   - 문자열 필드: "" (빈 문자열)
   - 배열 필드: []
   - custom_schedule: 값이 없으면 null
3. 처방전/약봉투에 여러 약이 있어도,
   - 가장 대표적인 주약(예: 첫 번째로 나오는 당뇨약 등) 1개만 골라서 채운다.
4. med_name:
   - 상품명 + 함량이 같이 적혀 있으면 가능한 그대로 사용한다.
     예: "글루코파지정 500mg", "자누비아정 100mg"
5. dosage_form:
   - OCR 텍스트에서 "정", "정제", "캡슐", "연질캡슐", "시럽", "현탁액" 등을 보고 알맞게 선택한다.
   - 확실하지 않으면 "" 대신 텍스트에서 가장 유력한 제형을 심플하게 한 단어로 정리한다.
6. dose / unit:
   - "500mg", "1정", "1정(500mg)" 같이 적혀 있으면
     - dose: "500" 또는 "1" 같은 핵심 숫자
     - unit: "mg" 또는 "정" 등 단위를 넣는다.
   - 모호하면 "dose"는 "", "unit"도 ""로 둔다.
7. schedule:
   - 텍스트를 읽고 가능한 한 ["아침", "점심", "저녁", "취침전", "증상시"] 중에서 골라 배열로 구성한다.
   - 예시 매핑:
     - "아침, 저녁 식후"  → ["아침", "저녁"]
     - "1일 3회 식후"    → ["아침", "점심", "저녁"]
     - "필요 시"         → ["증상시"]
     - "취침 전"         → ["취침전"]
   - 시점이 전혀 보이지 않으면 []로 둔다.
8. custom_schedule:
   - 보다 구체적인 설명을 담는다.
   - 예: "식후 30분", "매일 같은 시간 1정", "필요 시 1회 200mL를 여러 번"
   - 없다면 null로 둔다.
9. start_date / end_date:
   - "조제일자", "처방일자", "투약기간" 등에서 날짜를 찾고 가능하면 "YYYY-MM-DD"로 변환한다.
   - 연/월/일이 명확하지 않으면 ""로 둔다.
"""


def parse_prescription_form_from_ocr(text: str) -> Dict[str, Any]:
    client = get_client()

    resp = client.chat.completions.create(
        model=OCR_GPT_MODEL,
        temperature=0.1,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": PRESCRIPTION_SYSTEM_PROMPT},
            {"role": "user", "content": text},
        ],
    )

    content = resp.choices[0].message.content
    return json.loads(content)
