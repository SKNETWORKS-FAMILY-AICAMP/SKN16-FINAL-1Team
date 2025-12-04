from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from database import get_db

from crud.chatbot_crud import (
    create_session,
    get_session,
    save_message,          # 🔥 query/answer를 role/content로 저장하는 핵심 CRUD
    get_session_list,
    get_session_messages,
    delete_session,
    delete_all_sessions,
)

from schemas.chatbot_schemas import (
    ChatbotQueryRequest,
    ChatbotQueryResponse,
    ChatSessionListResponse,
    ChatSessionItem,
    ChatSessionDetailResponse,
    ChatMessageItem,
)

USE_FAKE_AUTH = True
FAKE_USER_ID = 1


def current_user_id():
    return FAKE_USER_ID if USE_FAKE_AUTH else None


router = APIRouter(prefix="/chatbot", tags=["Chatbot"])


# ============================================================
# POST /chatbot/query
# (프론트의 query/answer 명세는 그대로 유지)
# ------------------------------------------------------------
# 🔥 내부(DB 저장)에서는 query → role=user, content=query
# 🔥 answer → role=assistant, content=answer
# ============================================================
@router.post("/query", response_model=ChatbotQueryResponse)
def chatbot_query(payload: ChatbotQueryRequest, db: Session = Depends(get_db)):
    user_id = current_user_id()

    # 세션 생성 또는 가져오기
    if payload.session_id:
        session = get_session(db, user_id, payload.session_id)
        if not session:
            raise HTTPException(404, "세션을 찾을 수 없습니다.")
    else:
        # 🔥 수정 설명:
        #   기존에는 chat_log에 단일 row를 저장했지만,
        #   정석 GPT 구조에서는 세션(chat_session) 먼저 생성해야 함.
        session = create_session(db, user_id, title=payload.query)

    session_id = session.session_id

    # ============================================================
    # 1) 사용자 메시지 저장
    # ------------------------------------------------------------
    # 🔥 수정된 핵심 부분:
    #   기존: create_chatlog(user_id, query, answer)
    #   변경: "메시지 1개 = DB row 1개" 구조로 바꾸기 위해
    #         role=user / content=query 형태로 저장
    # ============================================================
    save_message(
        db=db,
        user_id=user_id,
        session_id=session_id,
        role="user",              # 🔥 새로운 구조: role 추가
        content=payload.query,    # 🔥 query 텍스트를 content로 저장
    )

    # ============================================================
    # 2) LLM 응답 (더미)
    # ------------------------------------------------------------
    # API 명세상 프론트는 answer라는 필드가 필요하므로 answer 변수 유지
    # ============================================================
    answer = "최근 복용한 약은 타이레놀입니다."

    # ============================================================
    # 3) AI(assistant) 메시지 저장
    # ------------------------------------------------------------
    # 🔥 수정된 핵심 부분:
    #   answer를 content로 변환해서 저장
    #   즉, 기존 answer 컬럼 없음 → content로 통일
    # ============================================================
    save_message(
        db=db,
        user_id=user_id,
        session_id=session_id,
        role="assistant",     # 🔥 assistant 역할 추가
        content=answer,       # 🔥 answer 텍스트를 content로 저장
    )

    # ============================================================
    # 4) 프론트로 응답 (answer는 API 명세 유지)
    # ============================================================
    return ChatbotQueryResponse(
        session_id=session_id,
        answer=answer,
    )


# ============================================================
# GET /chatbot/sessions (사이드바 대화방 목록)
# ============================================================
@router.get("/sessions", response_model=ChatSessionListResponse)
def get_sessions(db: Session = Depends(get_db)):
    user_id = current_user_id()
    rows = get_session_list(db, user_id)

    sessions = [
        ChatSessionItem(
            session_id=row.session_id,
            title=row.title,
            created_at=row.created_at.isoformat(),
        )
        for row in rows
    ]

    return ChatSessionListResponse(sessions=sessions)


# ============================================================
# GET /chatbot/sessions/{session_id} (특정 세션 전체 메시지)
# ============================================================
@router.get("/sessions/{session_id}", response_model=ChatSessionDetailResponse)
def get_session_detail(session_id: int, db: Session = Depends(get_db)):
    user_id = current_user_id()

    session = get_session(db, user_id, session_id)
    if not session:
        raise HTTPException(404, "세션을 찾을 수 없습니다.")

    rows = get_session_messages(db, user_id, session_id)

    messages = [
        ChatMessageItem(
            role=row.role,              # user / assistant
            content=row.content,        # 실제 메시지 텍스트
            created_at=row.created_at.isoformat(),
        )
        for row in rows
    ]

    return ChatSessionDetailResponse(
        session_id=session_id,
        messages=messages,
    )


# ============================================================
# DELETE /chatbot/sessions/{session_id}
# ============================================================
@router.delete("/sessions/{session_id}")
def delete_session_api(session_id: int, db: Session = Depends(get_db)):
    user_id = current_user_id()
    ok = delete_session(db, user_id, session_id)

    if not ok:
        raise HTTPException(404, "세션을 찾을 수 없습니다.")

    return {"message": "대화 세션이 삭제되었습니다."}


# ============================================================
# DELETE /chatbot/sessions (전체 세션 삭제)
# ============================================================
@router.delete("/sessions")
def delete_all_sessions_api(db: Session = Depends(get_db)):
    user_id = current_user_id()
    delete_all_sessions(db, user_id)
    return {"message": "모든 대화 세션이 삭제되었습니다."}


# ============================================================
# STT / OCR (임시 더미)
# ============================================================
@router.post("/voice")
def voice_stt(session_id: int = Form(None), audio: UploadFile = File(...)):
    if not audio:
        raise HTTPException(400, "audio 파일 누락")

    stt_text = "최근 복용약 알려줘"
    return {"session_id": session_id, "stt_text": stt_text, "status": "completed"}


@router.post("/ocr")
def ocr_extract(session_id: int = Form(None), file: UploadFile = File(...)):
    if not file:
        raise HTTPException(400, "file 누락")

    text = "타이레놀 500mg 하루 3회"
    return {"session_id": session_id, "text": text, "status": "completed"}
