from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ============================================================
# 1) 세션 목록 (사이드바)
# ============================================================

class ChatSessionItem(BaseModel):
    session_id: int
    title: str
    created_at: datetime   # FastAPI가 자동 ISO8601로 변환


class ChatSessionListResponse(BaseModel):
    sessions: List[ChatSessionItem]


# ============================================================
# 2) 특정 세션의 전체 메시지
# ============================================================

class ChatMessageItem(BaseModel):
    role: str
    content: str
    created_at: datetime   # DB timestamp → 자동 변환


class ChatSessionDetailResponse(BaseModel):
    session_id: int
    messages: List[ChatMessageItem]


# ============================================================
# 3) POST /chatbot/query 요청
# ============================================================

class ChatbotQueryRequest(BaseModel):
    session_id: Optional[int] = None
    query: str


# ============================================================
# 4) POST /chatbot/query 응답
# ============================================================

class ChatbotQueryResponse(BaseModel):
    session_id: int
    answer: str
