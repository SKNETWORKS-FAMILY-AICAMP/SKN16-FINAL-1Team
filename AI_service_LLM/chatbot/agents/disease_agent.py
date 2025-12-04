# AI_service_LLM/chatbot/agents/disease_agent.py

from __future__ import annotations

from typing import List

from ..core.state import ChatState
from ..core.tracing import traceable
from ..core.prompts import DISEASE_SYSTEM_PROMPT
from ..core.retriever import search_disease_docs   # Chroma 기반 검색 (질병 컬렉션)
from ..core.qscore import compute_qscore
from ..core.llm import call_llm

Q_THRESHOLD = 0.4  # 신뢰도 임계값


@traceable(name="disease_agent")
def run(state: ChatState) -> ChatState:
    """
    질병/증상/진료과/검사 관련 질문을 처리하는 에이전트.
    - 내부 Chroma 질병 컬렉션에서 RAG 검색
    - Q-score 계산 후, 너무 낮으면 답변을 조심스럽게 만들도록 LLM에 안내
    """
    user_message = state["messages"][-1]["content"]

    # 1) Chroma 질병 컬렉션 검색
    docs: List[str] = search_disease_docs(user_message)
    q_score = compute_qscore(docs, user_message)

    # 2) context 문자열로 합치기
    context_text = "\n\n".join(docs)

    # 3) LLM 호출
    answer = call_llm(
        system_prompt=DISEASE_SYSTEM_PROMPT.format(q_score=q_score),
        user_message=user_message,
        context=context_text,
    )

    state["messages"].append(
        {
            "role": "assistant",
            "content": answer,
            "meta": {
                "agent": "disease_agent",
                "q_score": q_score,
            },
        }
    )
    return state
