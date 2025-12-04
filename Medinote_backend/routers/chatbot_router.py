# routers/chatbot_router.py
from __future__ import annotations

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    Form,
    UploadFile,
    File,
)
from sqlalchemy.orm import Session

from database import get_db

# 🔹 CRUD 로직
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
    """세션 목록 조회 (사이드바용)"""
    sessions = get_chat_sessions(db)
    return SessionsResponse(sessions=sessions)


# ======================================
# DELETE /chatbot/sessions
# ======================================
@router.delete("/sessions", response_model=str)
def delete_all_sessions_api(
    db: Session = Depends(get_db),
):
    """모든 챗봇 세션 삭제"""
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
    """특정 세션 상세 내역 조회"""
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
    """특정 세션 삭제"""
    deleted = delete_chat_session(db, session_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found.",
        )
    return f"Session {session_id} deleted."


# ============================================================
# STT / OCR (임시 더미 구현)
#   - 멀티파트 폼으로 파일을 받는 형태
#   - session_id 는 선택값
# ============================================================
@router.post("/voice")
async def voice_stt(
    session_id: int | None = Form(None),
    audio: UploadFile = File(...),
):
    """
    음성 파일을 받아서 STT 결과를 돌려주는 임시 더미 엔드포인트.
    실제 구현 시에는 STT 서버/모듈 호출로 교체.
    """
    if audio is None:
        raise HTTPException(status_code=400, detail="audio 파일 누락")

    # TODO: 여기에 실제 STT 로직 붙이기
    stt_text = "최근 복용약 알려줘"

    return {
        "session_id": session_id,
        "stt_text": stt_text,
        "status": "completed",
    }


@router.post("/ocr")
async def ocr_extract(
    session_id: int | None = Form(None),
    file: UploadFile = File(...),
):
    """
    이미지/파일을 받아서 OCR 결과를 돌려주는 임시 더미 엔드포인트.
    실제 구현 시에는 OCR 모듈 호출로 교체.
    """
    if file is None:
        raise HTTPException(status_code=400, detail="file 누락")

    # TODO: 여기에 실제 OCR 로직 붙이기
    text = "타이레놀 500mg 하루 3회"

    return {
        "session_id": session_id,
        "text": text,
        "status": "completed",
    }
