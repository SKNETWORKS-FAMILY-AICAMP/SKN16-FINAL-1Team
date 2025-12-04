# AI_service_LLM/chatbot/supervisor.py

from __future__ import annotations

from typing import Literal
from .core.state import ChatState

# 최종 라우트 타입 (6개)
RouteName = Literal["chit", "db", "disease", "drug", "web", "history"]


def _get_last_user_message(state: ChatState) -> str:
    messages = state.get("messages") or []
    if not messages:
        return ""
    return messages[-1].get("content", "") or ""


def route_supervisor(state: ChatState) -> RouteName:
    """
    유저 질문을 보고 적절한 에이전트로 라우팅하는 규칙 기반 Supervisor.
    - history: 이전 대화/요약/지난 질문 관련
    - db: 개인 의료 기록 (처방전, 진료기록, 복용약, 검사 결과)
    - drug: 약/복용/영양제/상호작용 관련
    - disease: 증상/질병/진료과/검사 관련
    - web: 최신 정보/뉴스/년도 언급
    - chit: 위에 해당하지 않는 일반 대화
    """

    text = _get_last_user_message(state)
    if not text:
        return "chit"

    t = text.strip()

    # ---------------------------------------------------
    # 1) 과거 대화 관련 (history agent)
    # ---------------------------------------------------
    history_keywords = [
        "지난번", "예전에", "이전 대화", "지난 대화",
        "전에 했던", "예전에 뭐라고", "지난 기록",
        "예전에 뭐라고 했었지", "물어봤었지",
        "이전 질문", "이전 답변",
    ]
    if any(k in t for k in history_keywords):
        return "history"

    # ---------------------------------------------------
    # 2) 개인 의료 DB (의무기록, 처방전, 진단서 등)
    # ---------------------------------------------------
    db_keywords = [
        "진료 기록", "진료기록", "진료 내역", "진료내역",
        "처방전", "내 처방", "지난 처방",
        "검사 결과", "검사결과",
        "입원 기록", "입원기록",
        "나의 기록", "내 기록", "나의 진료", "개인 기록",
        "병원 다녀온", "의무기록",
    ]
    if any(k in t for k in db_keywords):
        return "db"

    # ---------------------------------------------------
    # 3) 약/영양제/상호작용 → drug_agent
    # ---------------------------------------------------
    drug_keywords = [
        "약", "약을", "약이", "약은", "정(", "캡슐", "시럽",
        "복용", "복용법", "복용해도", "먹어도", "먹으면",
        "영양제", "비타민", "건강기능식품", "건기식",
        "상호작용", "같이 먹어도", "병용", "같이 먹으면",
        "충돌", "부작용", "반응이", "알약",
        "약국", "처방약", "의약품",
    ]
    if any(k in t for k in drug_keywords):
        return "drug"

    # ---------------------------------------------------
    # 4) 질병/증상/진료과 → disease_agent
    # ---------------------------------------------------
    disease_keywords = [
        "증상", "아픈", "아파요", "통증", "두통", "복통",
        "메스꺼움", "구토", "설사", "변비",
        "열이", "발열", "발진", "기침", "가래",
        "호흡곤란", "숨쉬기", "호흡",
        "진료과", "어느 과", "어떤 과",
        "검사해야", "검사를 받아야",
        "질병", "병명", "병인가요",
    ]
    if any(k in t for k in disease_keywords):
        return "disease"

    # ---------------------------------------------------
    # 5) 최신 뉴스 / 새로운 정보 / 특정 연도 → web agent
    # ---------------------------------------------------
    web_keywords = [
        "최신", "최근", "요즘", "업데이트",
        "새로 나온", "신약", "리콜", "뉴스",
        "2023", "2024", "2025", "2026", "2027",
        "최근 연구", "최근 발표",
    ]
    if any(k in t for k in web_keywords):
        return "web"

    # ---------------------------------------------------
    # 6) 그 외 → 일반 대화
    # ---------------------------------------------------
    return "chit"
