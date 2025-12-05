from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ================================
# 🔹 출처용 스키마
# ================================
class ChatSource(BaseModel):
    id: str                    # 벡터DB doc_id 등
    collection: str            # 'disease', 'drug', 'web' 등
    title: Optional[str] = None
    url: Optional[str] = None
    score: Optional[float] = None


#============================================================
# 1) 세션 목록 (사이드바)
#============================================================
class ChatSessionItem(BaseModel):
    session_id: int
    title: str
    created_at: datetime   # FastAPI가 자동 ISO8601로 변환


class ChatSessionListResponse(BaseModel):
    sessions: List[ChatSessionItem]


#============================================================
# 2) 특정 세션의 전체 메시지
#============================================================
class ChatMessageItem(BaseModel):
    role: str
    content: str
    created_at: datetime   # DB timestamp → 자동 변환
    # 🔥 각 메시지에 대한 출처 리스트 (assistant 메시지에 주로 사용)
    sources: Optional[List[ChatSource]] = None


class ChatSessionDetailResponse(BaseModel):
    session_id: int
    messages: List[ChatMessageItem]


#============================================================
# 3) POST /chatbot/query 요청
#============================================================
class ChatbotQueryRequest(BaseModel):
    session_id: Optional[int] = None
    query: str


#============================================================
# 4) POST /chatbot/query 응답
#============================================================
class ChatbotQueryResponse(BaseModel):
    session_id: int
    answer: str
    # 🔥 이번 응답에서 사용된 출처 리스트
    sources: List[ChatSource] = []
