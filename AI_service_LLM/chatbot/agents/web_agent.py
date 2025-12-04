# AI_service_LLM/chatbot/agents/history_agent.py

from __future__ import annotations

from typing import List

from ..core.state import ChatState
from ..core.tracing import traceable
from ..core.prompts import HISTORY_SYSTEM_PROMPT
from ..core.chat_repository import get_recent_logs   # chat_log / chat_session 조회용
from ..core.llm import call_llm


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
    logs = get_recent_logs(user_id=user_id, limit=20)
    # logs: List[ChatLog] 라고 가정
    # ChatLog: { "session_id", "query", "answer", "created_at" }

    if not logs:
        # 과거 기록이 없으면 그대로 안내
        answer = (
            "현재 저장된 이전 대화 기록이 없어서, 과거 대화를 참고할 수 없습니다. "
            "질문을 다시 구체적으로 말씀해 주시면, 가능한 범위에서 새로 답변해 드릴게요."
        )
    else:
        # 2) context 문자열로 변환
        history_lines: List[str] = []
        for log in logs:
            history_lines.append(
                f"[{log.created_at}] user: {log.query}\nassistant: {log.answer}"
            )
        history_context = "\n\n".join(history_lines)

        # 3) LLM 호출
        answer = call_llm(
            system_prompt=HISTORY_SYSTEM_PROMPT,
            user_message=user_message,
            context=history_context,
        )

    state["messages"].append(
        {
            "role": "assistant",
            "content": answer,
            "meta": {
                "agent": "history_agent",
            },
        }
    )
    return state
