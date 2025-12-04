# schemas/chatbot_schemas.py
from __future__ import annotations

from typing import List
from pydantic import BaseModel


# ======================================
# POST /chatbot/query 요청/응답
# ======================================

class ChatQueryRequest(BaseModel):
    """
    AI_service_LLM/app.py 의 ChatQueryRequest 와 1:1 매칭
    """
    session_id: int   # 0이면 새 세션
    query: str


class ChatQueryResponse(BaseModel):
    """
    AI_service_LLM/app.py 의 ChatQueryResponse 와 1:1 매칭
    """
    session_id: int
    answer: str


# ======================================
# GET /chatbot/sessions 응답
# ======================================

class SessionItem(BaseModel):
    """
    개별 세션 요약 정보 (사이드바용)
    """
    session_id: int
    title: str
    created_at: str   # ISO 문자열 (예: "2025-12-01T12:00:00")


class SessionsResponse(BaseModel):
    """
    세션 목록 응답
    """
    sessions: List[SessionItem]


# ======================================
# GET /chatbot/sessions/{session_id} 응답
# ======================================

class SessionMessage(BaseModel):
    """
    세션 내 개별 메시지
    """
    role: str         # "user" | "assistant"
    content: str
    created_at: str   # ISO 문자열


class SessionDetailResponse(BaseModel):
    """
    특정 세션 상세 응답
    """
    session_id: int
    messages: List[SessionMessage]
