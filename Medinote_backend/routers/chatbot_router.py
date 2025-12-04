# routers/chatbot_router.py
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db

# 🔹 CRUD 로직 (나중에 구현할 예정)
from crud.chatbot_crud import (
    handle_chat_query,
    get_chat_sessions,
    delete_all_chat_sessions,
    get_chat_session_detail,
    delete_chat_session,
)

# 🔹 Schemas
from schemas.chatbot_schemas import (
    ChatQueryRequest,
    ChatQueryResponse,
    SessionsResponse,
    SessionDetailResponse,
)

router = APIRouter(prefix="/chatbot", tags=["chatbot"])


# ======================================
# POST /chatbot/query
#  - AI_service_LLM/app.py 와 JSON 구조 동일
# ======================================
@router.post("/query", response_model=ChatQueryResponse)
def post_chatbot_query(
    payload: ChatQueryRequest,
    db: Session = Depends(get_db),
):
    """
    프론트에서 사용하는 POST /chatbot/query 엔드포인트.

    - payload.session_id == 0 이면: 새 세션 생성 + 첫 메시지 저장 + LLM 호출
    - 아니면: 기존 세션에 메시지 append + LLM 호출
    """
    return handle_chat_query(db, payload)


# ======================================
# GET /chatbot/sessions
# ======================================
@router.get("/sessions", response_model=SessionsResponse)
def get_chatbot_sessions(
    db: Session = Depends(get_db),
):
    """
    세션 목록 조회 (사이드바용)
    """
    sessions = get_chat_sessions(db)
    return SessionsResponse(sessions=sessions)


# ======================================
# DELETE /chatbot/sessions
# ======================================
@router.delete("/sessions", response_model=str)
def delete_all_sessions_api(
    db: Session = Depends(get_db),
):
    """
    모든 챗봇 세션 삭제 (개발/테스트용, 또는 '모두 지우기' 기능)
    """
    delete_all_chat_sessions(db)
    return "All chatbot sessions deleted."


# ======================================
# GET /chatbot/sessions/{session_id}
# ======================================
@router.get(
    "/sessions/{session_id}",
    response_model=SessionDetailResponse,
)
def get_chatbot_session_detail_api(
    session_id: int,
    db: Session = Depends(get_db),
):
    """
    특정 세션 상세 내역 조회
    """
    detail = get_chat_session_detail(db, session_id)
    if detail is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found.",
        )
    return detail


# ======================================
# DELETE /chatbot/sessions/{session_id}
# ======================================
@router.delete(
    "/sessions/{session_id}",
    response_model=str,
)
def delete_one_chatbot_session_api(
    session_id: int,
    db: Session = Depends(get_db),
):
    """
    특정 세션 삭제
    """
    deleted = delete_chat_session(db, session_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found.",
        )
    return f"Session {session_id} deleted."
