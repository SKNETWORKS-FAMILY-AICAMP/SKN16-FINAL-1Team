# AI_service_LLM/chatbot/agents/history_agent.py

from __future__ import annotations

from typing import List, Dict

from ..core.state import ChatState
from ..core.tracing import traceable
from ..core.prompts import HISTORY_SYSTEM_PROMPT
from ..core.llm import call_llm
from ..core.chat_repository import get_recent_logs


@traceable(name="history_agent")
def run(state: ChatState) -> ChatState:
    """
    사용자의 '과거 챗봇 대화 기록(chat_log / chat_session)'을 기반으로
    요약하거나 다시 설명해주는 에이전트.

    예:
        - "최근에 너랑 무슨 대화 했는지 요약해줘"
        - "지난번에 고혈압 약 설명해준 거 다시 알려줘"
    """
    user_id = state.get("user_id")
    user_message = state["messages"][-1]["content"]

    # 1) 최근 대화 기록 N개 조회
    logs: List[Dict] = get_recent_logs(user_id=user_id, limit=20)

    if not logs:
        # 과거 기록이 없으면 그대로 안내
        answer = (
            "현재 저장된 이전 대화 기록이 없어서, 과거 대화를 참고할 수 없습니다. "
            "질문을 다시 구체적으로 말씀해 주시면, 새로운 질문으로 답변해 드릴게요."
        )

        # 🔥 state 값 채우기
        state["answer"] = answer
        state["sources"] = []  # history agent는 출처가 없다

        # state.messages append
        state["messages"].append(
            {
                "role": "assistant",
                "content": answer,
                "meta": {"agent": "history_agent", "log_count": 0},
            }
        )
        return state

    # 2) context 문자열로 변환
    history_lines: List[str] = []
    for log in logs:
        created_at = log.get("created_at", "")
        # datetime 객체일 수도 있으니 문자열로 캐스팅
        if hasattr(created_at, "isoformat"):
            created_at_str = created_at.isoformat()
        else:
            created_at_str = str(created_at)

        session_id = log.get("session_id", "")
        role = log.get("role", "user")
        content = log.get("content", "")

        # 각 메시지를 한 줄씩 기록
        history_lines.append(
            f"[세션 {session_id} | {created_at_str} | {role}]\n"
            f"{role}: {content}"
        )

    history_context = "\n\n".join(history_lines)

    # 3) LLM 호출 (시스템 프롬프트 + 과거 기록 컨텍스트 제공)
    answer = call_llm(
        system_prompt=HISTORY_SYSTEM_PROMPT,
        user_message=user_message,
        context=history_context,
    )

    # 4) state.messages append
    state["messages"].append(
        {
            "role": "assistant",
            "content": answer,
            "meta": {
                "agent": "history_agent",
                "log_count": len(logs),
            },
        }
    )

    # 🔥 최종 반환용 필드
    state["answer"] = answer
    state["sources"] = []  # history agent는 외부 문서 RAG가 아니므로 항상 빈 리스트

    return state
