# AI_service_LLM/chatbot/agents/db_agent.py

from __future__ import annotations

from typing import List, Dict

from ..core.state import ChatState
from ..core.tracing import traceable
from ..core.prompts import DB_SYSTEM_PROMPT
from ..core.llm import call_llm
from ..core.user_repository import (
    get_user_profile,
    get_allergies,
    get_chronic_diseases,
    get_acute_diseases,
    get_drugs,
    get_prescriptions,
    get_visits,
)

@traceable(name="db_agent")
def run(state: ChatState) -> ChatState:
    """
    유저의 메디컬 데이터를 모두(건강정보, 알레르기, 질병, 약, 처방, 진료기록) 조회해서
    질문과 함께 GPT에게 전달 후 답변하는 Agent.
    """

    user_id = state.get("user_id")
    user_message = state["messages"][-1]["content"]

    if not user_id:
        answer = (
            "현재 사용자 정보를 확인할 수 없어 의료 기록을 불러올 수 없습니다. "
            "로그인이 되어 있는지 확인해주세요."
        )
        state["messages"].append(
            {"role": "assistant", "content": answer, "meta": {"agent": "db_agent"}}
        )
        return state

    # -----------------------------
    # 1) 백엔드 API 데이터 가져오기
    # -----------------------------
    try:
        profile = get_user_profile(user_id)            # 건강 프로필
        allergies = get_allergies(user_id)
        chronic = get_chronic_diseases(user_id)
        acute = get_acute_diseases(user_id)
        drugs = get_drugs(user_id)
        prescriptions = get_prescriptions(user_id)
        visits = get_visits(user_id)
    except Exception as e:
        answer = f"사용자 의료 기록을 조회하는 과정에서 오류가 발생했습니다: {e}"
        state["messages"].append(
            {"role": "assistant", "content": answer, "meta": {"agent": "db_agent"}}
        )
        return state

    # -----------------------------
    # 2) GPT에게 줄 컨텍스트 구성
    # -----------------------------
    context_blocks = []

    # ① 건강 프로필
    if profile:
        context_blocks.append("## 건강 프로필\n" + str(profile))

    # ② 알레르기
    if allergies:
        text = "\n".join([f"- {a['name']} ({a['severity']})" for a in allergies])
        context_blocks.append("## 알레르기 목록\n" + text)

    # ③ 만성 질환
    if chronic:
        text = "\n".join([f"- {c['name']} (진단일: {c['start_date']})" for c in chronic])
        context_blocks.append("## 만성 질환 목록\n" + text)

    # ④ 급성 질환
    if acute:
        text = "\n".join([f"- {a['name']} (발생일: {a['start_date']})" for a in acute])
        context_blocks.append("## 급성 질환 목록\n" + text)

    # ⑤ 복용 약
    if drugs:
        text = "\n".join([f"- {d['drug_name']} (복용법: {d['sig']})" for d in drugs])
        context_blocks.append("## 복용 중인 약 목록\n" + text)

    # ⑥ 처방전
    if prescriptions:
        text = "\n".join([f"- {p['title']} ({p['date']})" for p in prescriptions])
        context_blocks.append("## 처방 이력\n" + text)

    # ⑦ 진료 기록
    if visits:
        text = "\n".join([f"- {v['hospital_name']} | {v['date']} | {v['diagnosis']}" for v in visits])
        context_blocks.append("## 진료 기록\n" + text)

    medical_context = "\n\n".join(context_blocks) if context_blocks else "사용자의 의료 기록이 없습니다."

    # -----------------------------
    # 3) LLM 호출하여 답변 생성
    # -----------------------------
    answer = call_llm(
        system_prompt=DB_SYSTEM_PROMPT,
        user_message=user_message,
        context=medical_context,
    )

    # -----------------------------
    # 4) state에 답변 추가
    # -----------------------------
    state["messages"].append(
        {
            "role": "assistant",
            "content": answer,
            "meta": {
                "agent": "db_agent",
                "profile": bool(profile),
                "allergy_count": len(allergies or []),
                "drug_count": len(drugs or []),
            },
        }
    )

    return state
