from typing import Optional, List, Dict, Any

from sqlalchemy.orm import Session
from sqlalchemy import func
from models import ChatSession, ChatLog


# ============================================================
# 1) 새 세션 생성
# ============================================================
def create_session(db: Session, user_id: int, title: str) -> ChatSession:
    session = ChatSession(
        user_id=user_id,
        title=title
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


# ============================================================
# 2) 세션 하나 가져오기
# ============================================================
def get_session(db: Session, user_id: int, session_id: int) -> ChatSession | None:
    return (
        db.query(ChatSession)
        .filter(
            ChatSession.user_id == user_id,
            ChatSession.session_id == session_id
        )
        .first()
    )


# ============================================================
# 3) 메시지 저장 (한 줄)
#    - role: "user" / "assistant"
#    - content: 실제 메시지 텍스트
#    - sources: assistant 메시지일 때만, 출처 리스트(JSON)
# ============================================================
def save_message(
    db: Session,
    user_id: int,
    session_id: int,
    role: str,
    content: str,
    sources: Optional[List[Dict[str, Any]]] = None,
) -> ChatLog:
    msg = ChatLog(
        session_id=session_id,
        user_id=user_id,
        role=role,
        content=content,
        sources=sources,  # 🔥 새 필드 저장 (없으면 None)
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


# ============================================================
# 4) 세션 목록 조회 (사이드바)
# ============================================================
def get_session_list(db: Session, user_id: int):
    return (
        db.query(ChatSession)
        .filter(ChatSession.user_id == user_id)
        .order_by(ChatSession.created_at.desc())
        .all()
    )


# ============================================================
# 5) 특정 세션의 전체 메시지 조회
# ============================================================
def get_session_messages(db: Session, user_id: int, session_id: int):
    return (
        db.query(ChatLog)
        .filter(
            ChatLog.user_id == user_id,
            ChatLog.session_id == session_id
        )
        .order_by(ChatLog.created_at.asc())
        .all()
    )


# ============================================================
# 6) 특정 세션 삭제
# ============================================================
def delete_session(db: Session, user_id: int, session_id: int) -> bool:
    session = get_session(db, user_id, session_id)
    if not session:
        return False

    db.delete(session)   # cascade 로 메시지도 같이 삭제
    db.commit()
    return True


# ============================================================
# 7) 전체 세션 삭제
# ============================================================
def delete_all_sessions(db: Session, user_id: int) -> None:
    (
        db.query(ChatSession)
        .filter(ChatSession.user_id == user_id)
        .delete(synchronize_session=False)
    )
    db.commit()
