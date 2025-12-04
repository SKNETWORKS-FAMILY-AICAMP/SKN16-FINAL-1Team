from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ============================================================
# 1) 세션 목록 (GET /chatbot/sessions)
# ============================================================

class SessionItem(BaseModel):
    session_id: int
    title: str
    created_at: str   # ISO 문자열 반환

    class Config:
        from_attributes = True   # ORM → Pydantic 변환 허용


class SessionsResponse(BaseModel):
    sessions: List[SessionItem]


# ============================================================
# 2) 특정 세션 상세 조회 (GET /chatbot/sessions/{session_id})
# ============================================================

class SessionMessage(BaseModel):
    role: str           # "user" | "assistant"
    content: str
    created_at: str     # ISO 문자열

    class Config:
        from_attributes = True


class SessionDetailResponse(BaseModel):
    session_id: int
    messages: List[SessionMessage]


# ============================================================
# 3) POST /chatbot/query 요청 스키마
# ============================================================

class ChatQueryRequest(BaseModel):
    session_id: Optional[int] = 0   # 없음 → 자동 새 세션
    query: str


# ============================================================
# 4) POST /chatbot/query 응답 스키마
# ============================================================

class ChatQueryResponse(BaseModel):
    session_id: int
    answer: str
