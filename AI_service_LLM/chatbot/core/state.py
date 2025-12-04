# AI_service_LLM/chatbot/core/state.py

from __future__ import annotations

from typing import TypedDict, Literal, List, Dict, Any, Optional


class Message(TypedDict, total=False):
    role: Literal["user", "assistant"]
    content: str
    # 에이전트 이름, q_score, sources 등 메타데이터
    meta: Dict[str, Any]


class ChatState(TypedDict, total=False):
    """
    LangGraph 에이전트들 사이에서 공유되는 상태 구조.
    기본적으로 messages 배열과 user_id만 있어도 동작한다.
    """
    user_id: Optional[str]
    # 나중에 세션을 재사용하고 싶다면 session_id도 추가 가능
    session_id: Optional[str]
    messages: List[Message]
