# AI_service_LLM/chatbot/agents/chit_agent.py

from __future__ import annotations

from ..core.state import ChatState
from ..core.tracing import traceable
from ..core.prompts import CHIT_SYSTEM_PROMPT
from ..core.llm import call_llm


@traceable(name="chit_agent")
def run(state: ChatState) -> ChatState:
    """
    비의료 / 일반적인 대화(잡담, 공부, 개발 질문 등)를 처리하는 에이전트.
    RAG 없이 LLM만 사용한다.
    """
    user_message = state["messages"][-1]["content"]

    answer = call_llm(
        system_prompt=CHIT_SYSTEM_PROMPT,
        user_message=user_message,
        context=None,
    )

    # LLM 응답을 메시지 히스토리에 추가
    state["messages"].append(
        {
            "role": "assistant",
            "content": answer,
            "meta": {
                "agent": "chit_agent",
            },
        }
    )

    # 🔥 최종 응답/출처 필드도 채워줌
    state["answer"] = answer      # 백엔드로 넘길 최종 답변
    state["sources"] = []         # 잡담 에이전트는 RAG 안 쓰므로 항상 빈 리스트

    return state
