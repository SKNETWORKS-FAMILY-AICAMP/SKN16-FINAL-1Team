# crud/chatbot_crud.py
from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session

from models import ChatSession, ChatLog
from schemas.chatbot_schemas import (
    ChatQueryRequest,
    ChatQueryResponse,
    SessionItem,
    SessionMessage,
    SessionDetailResponse,
)


# =========================================================
# 내부 유틸
# =========================================================

def _build_title_from_query(query: str, max_len: int = 50) -> str:
    title = (query or "").strip()
    if not title:
        title = "새로운 채팅"
    if len(title) > max_len:
        title = title[: max_len - 3] + "..."
    return title


def _now_iso() -> str:
    return datetime.utcnow().isoformat()


# =========================================================
# 1) 대화 처리 (POST /chatbot/query)
# =========================================================

def handle_chat_query(
    db: Session,
    payload: ChatQueryRequest,
    user_id: Optional[int] = None,
) -> ChatQueryResponse:

    uid = user_id if user_id is not None else 0

    # 🔹 임시 답변 (나중에 LLM 호출로 교체)
    answer_text = f"테스트 응답입니다. 당신이 말한 내용: {payload.query}"

    # =====================================================
    # 세션 생성 또는 조회
    # =====================================================
    if payload.session_id == 0:
        # 새 세션 생성
        new_session = ChatSession(
            user_id=uid,
            title=_build_title_from_query(payload.query),
            created_at=datetime.utcnow(),   # 🔥 수정 1
        )
        db.add(new_session)
        db.flush()
        session_id = new_session.session_id

    else:
        # 기존 세션 조회
        session = (
            db.query(ChatSession)
            .filter(ChatSession.session_id == payload.session_id)
            .first()
        )

        if session is None:
            # 세션이 없으면 새로 만듦
            new_session = ChatSession(
                user_id=uid,
                title=_build_title_from_query(payload.query),
                created_at=datetime.utcnow(),   # 🔥 수정 2
            )
            db.add(new_session)
            db.flush()
            session_id = new_session.session_id
        else:
            session_id = session.session_id

    # =====================================================
    # chat_log 저장 (user → assistant)
    # =====================================================

    now = datetime.utcnow()  # 🔥 수정 3 (안정적인 timestamp)
    
    # user 메시지
    user_log = ChatLog(
        session_id=session_id,
        user_id=uid,
        query=payload.query,
        answer="",
        created_at=now,
    )
    db.add(user_log)

    # assistant 메시지
    assistant_log = ChatLog(
        session_id=session_id,
        user_id=uid,
        query="",
        answer=answer_text,
        created_at=now,
    )
    db.add(assistant_log)

    db.commit()

    return ChatQueryResponse(
        session_id=session_id,
        answer=answer_text,
    )


# =========================================================
# 2) 세션 목록 조회
# =========================================================

def get_chat_sessions(
    db: Session,
    user_id: Optional[int] = None,
    limit: int = 50,
) -> List[SessionItem]:

    q = db.query(ChatSession)
    if user_id is not None:
        q = q.filter(ChatSession.user_id == user_id)

    sessions = (
        q.order_by(ChatSession.created_at.desc())
        .limit(limit)
        .all()
    )

    items: List[SessionItem] = []
    for s in sessions:
        created_at = s.created_at.isoformat() if s.created_at else _now_iso()
        items.append(
            SessionItem(
                session_id=s.session_id,
                title=s.title,
                created_at=created_at,
            )
        )
    return items


# =========================================================
# 3) 모든 세션 삭제
# =========================================================

def delete_all_chat_sessions(
    db: Session,
    user_id: Optional[int] = None,
) -> None:

    if user_id is not None:
        session_ids = [
            s.session_id
            for s in db.query(ChatSession.session_id)
            .filter(ChatSession.user_id == user_id)
            .all()
        ]

        if session_ids:
            db.query(ChatLog).filter(
                ChatLog.session_id.in_(session_ids)
            ).delete(synchronize_session=False)

            db.query(ChatSession).filter(
                ChatSession.session_id.in_(session_ids)
            ).delete(synchronize_session=False)

    else:
        db.query(ChatLog).delete(synchronize_session=False)
        db.query(ChatSession).delete(synchronize_session=False)

    db.commit()


# =========================================================
# 4) 특정 세션 상세 조회
# =========================================================

def get_chat_session_detail(
    db: Session,
    session_id: int,
    user_id: Optional[int] = None,
) -> Optional[SessionDetailResponse]:

    session = (
        db.query(ChatSession)
        .filter(ChatSession.session_id == session_id)
        .first()
    )
    if session is None:
        return None

    q = db.query(ChatLog).filter(ChatLog.session_id == session_id)
    if user_id is not None:
        q = q.filter(ChatLog.user_id == user_id)

    logs = q.order_by(ChatLog.created_at.asc()).all()
    messages: List[SessionMessage] = []

    for log in logs:
        if log.query:
            messages.append(
                SessionMessage(
                    role="user",
                    content=log.query,
                    created_at=log.created_at.isoformat()
                    if log.created_at else _now_iso(),
                )
            )
        if log.answer:
            messages.append(
                SessionMessage(
                    role="assistant",
                    content=log.answer,
                    created_at=log.created_at.isoformat()
                    if log.created_at else _now_iso(),
                )
            )

    return SessionDetailResponse(
        session_id=session_id,
        messages=messages,
    )


# =========================================================
# 5) 특정 세션 삭제
# =========================================================

def delete_chat_session(
    db: Session,
    session_id: int,
    user_id: Optional[int] = None,
) -> bool:

    q = db.query(ChatSession).filter(ChatSession.session_id == session_id)
    if user_id is not None:
        q = q.filter(ChatSession.user_id == user_id)

    session = q.first()
    if session is None:
        return False

    db.query(ChatLog).filter(ChatLog.session_id == session_id).delete(
        synchronize_session=False
    )
    db.delete(session)
    db.commit()
    return True
