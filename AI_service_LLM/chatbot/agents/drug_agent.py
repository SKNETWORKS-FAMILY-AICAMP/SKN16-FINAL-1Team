# AI_service_LLM/chatbot/agents/drug_agent.py

from __future__ import annotations

from typing import List

from ..core.state import ChatState
from ..core.tracing import traceable
from ..core.prompts import DRUG_SYSTEM_PROMPT
from ..core.retriever import search_drug_docs    # Chroma 기반 (의약품/건강기능식품 컬렉션)
from ..core.qscore import compute_qscore
from ..core.llm import call_llm

Q_THRESHOLD = 0.4


@traceable(name="drug_agent")
def run(state: ChatState) -> ChatState:
    """
    약/영양제/상호작용 관련 질문 담당 에이전트.
    - e약은요, 전문의약품, 생물의약품, 건강기능식품 등 Chroma 컬렉션에서 검색
    """
    user_message = state["messages"][-1]["content"]

    # 1) 약/영양제 관련 컬렉션 검색
    docs: List[str] = search_drug_docs(user_message)
    q_score = compute_qscore(docs, user_message)

    # 2) context 문자열로 변환
    context_text = "\n\n".join(docs)

    # 3) LLM 호출
    answer = call_llm(
        system_prompt=DRUG_SYSTEM_PROMPT.format(q_score=q_score),
        user_message=user_message,
        context=context_text,
    )

    state["messages"].append(
        {
            "role": "assistant",
            "content": answer,
            "meta": {
                "agent": "drug_agent",
                "q_score": q_score,
            },
        }
    )
    return state
