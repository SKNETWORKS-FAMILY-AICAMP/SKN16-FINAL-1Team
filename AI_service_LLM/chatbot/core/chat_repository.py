# AI_service_LLM/chatbot/core/chat_repository.py

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import List, Literal, Dict, Any, Optional

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

load_dotenv()

# 예시: postgresql+psycopg2://user:password@host:port/dbname
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    # 로컬/EC2 어디서든 DATABASE_URL 없으면 바로 에러 내고 죽이기
    raise RuntimeError(
        "DATABASE_URL is not set. "
        "AI_service_LLM/.env 또는 Docker 환경변수를 확인하세요."
    )


def _get_engine() -> Engine:
    # lazy init로 바꿀 수도 있지만, 여기서는 모듈 import 시 한 번만 생성한다고 가정
    return create_engine(DATABASE_URL, future=True)


engine: Engine = _get_engine()


# =========================================================
# Dataclass (선택사항 - 타입 힌트용)
# =========================================================

@dataclass
class HistoryRow:
    id: int
    query: str
    answer: str
    created_at: str


@dataclass
class HistoryMessageRow:
    role: str
    content: str
    timestamp: str


# =========================================================
# CREATE (session + 첫 log)
# =========================================================

def create_session_with_log(
    user_id: int | str,
    query: str,
    answer: str,
    sources: List[str] | None = None,
    used_model: str | None = None,
    latency_ms: Optional[int] = None,
) -> int:
    """
    새로운 채팅 세션을 만들고, 첫 번째 질문/답변을 chat_log에 기록한다.
    반환값: 생성된 session_id

    테이블 스키마 (예상):
      chat_session(session_id PK, user_id, title, created_at)
      chat_log(chat_id PK, session_id, user_id, query, answer, created_at)
    """
    title = (query or "").strip()
    if not title:
        title = "새로운 채팅"
    if len(title) > 50:
        title = title[:47] + "..."

    # DB 에는 INTEGER 로 저장
    user_id_int = int(user_id)

    with engine.begin() as conn:
        # 1) chat_session 생성
        res = conn.execute(
            text(
                """
                INSERT INTO chat_session (user_id, title, created_at)
                VALUES (:user_id, :title, NOW())
                RETURNING session_id
                """
            ),
            {"user_id": user_id_int, "title": title},
        )
        session_id = res.scalar_one()

        # 2) chat_log 에 첫 질문/답변 기록
        conn.execute(
            text(
                """
                INSERT INTO chat_log (session_id, user_id, query, answer, created_at)
                VALUES (:session_id, :user_id, :query, :answer, NOW())
                """
            ),
            {
                "session_id": session_id,
                "user_id": user_id_int,
                "query": query,
                "answer": answer,
            },
        )

    return int(session_id)


# =========================================================
# APPEND (기존 세션에 log 추가)
# =========================================================

def append_log(
    session_id: int | str,
    user_id: int | str,
    query: str,
    answer: str,
) -> None:
    """
    기존 session_id에 질문/답변 한 쌍을 chat_log에 추가.
    """
    session_id_int = int(session_id)
    user_id_int = int(user_id)

    with engine.begin() as conn:
        conn.execute(
            text(
                """
                INSERT INTO chat_log (session_id, user_id, query, answer, created_at)
                VALUES (:session_id, :user_id, :query, :answer, NOW())
                """
            ),
            {
                "session_id": session_id_int,
                "user_id": user_id_int,
                "query": query,
                "answer": answer,
            },
        )


def upsert_session_with_log(
    session_id: Optional[int],
    user_id: int | str,
    query: str,
    answer: str,
) -> int:
    """
    session_id 가 None 또는 0이면 새로운 세션을 만들고 첫 로그를 기록.
    나머지 경우에는 해당 세션에 로그를 append.
    반환값: 사용된 session_id (새로 생성되었거나, 기존 것이거나)
    """
    if not session_id or int(session_id) == 0:
        return create_session_with_log(user_id=user_id, query=query, answer=answer)

    append_log(session_id=int(session_id), user_id=user_id, query=query, answer=answer)
    return int(session_id)


# =========================================================
# READ: 세션 목록 (사이드바용)
# =========================================================

def list_sessions(
    user_id: int | str,
    limit: int = 50,
    order: Literal["asc", "desc"] = "desc",
) -> List[Dict[str, Any]]:
    """
    특정 user_id 의 채팅 세션 목록 조회.
    /chatbot/sessions 에서 사용하기 좋은 형태.
    """
    order_sql = "ASC" if order == "asc" else "DESC"
    user_id_int = int(user_id)

    sql = f"""
        SELECT
            session_id,
            user_id,
            title,
            created_at
        FROM chat_session
        WHERE user_id = :user_id
        ORDER BY created_at {order_sql}
        LIMIT :limit
    """

    with engine.begin() as conn:
        rows = conn.execute(
            text(sql),
            {"user_id": user_id_int, "limit": limit},
        ).mappings().all()

    sessions: List[Dict[str, Any]] = []
    for row in rows:
        created_at = row["created_at"]
        created_at_str = (
            created_at.isoformat()
            if hasattr(created_at, "isoformat")
            else str(created_at)
        )
        sessions.append(
            {
                "session_id": row["session_id"],
                "title": row["title"],
                "created_at": created_at_str,
            }
        )

    return sessions


# =========================================================
# READ: 특정 세션의 전체 메시지
# =========================================================

def get_session_messages(
    session_id: int | str,
    user_id: Optional[int | str] = None,
) -> Optional[List[Dict[str, Any]]]:
    """
    특정 session_id의 전체 대화 내역을 "role + content + created_at" 형태로 반환.
    """
    sql = """
        SELECT query, answer, created_at, user_id
        FROM chat_log
        WHERE session_id = :session_id
        {user_filter}
        ORDER BY created_at ASC
    """

    user_filter = ""
    params: Dict[str, Any] = {"session_id": int(session_id)}
    if user_id is not None:
        user_filter = "AND user_id = :user_id"
        params["user_id"] = int(user_id)

    sql = sql.format(user_filter=user_filter)

    with engine.begin() as conn:
        rows = conn.execute(text(sql), params).mappings().all()

    if not rows:
        return None

    messages: List[Dict[str, Any]] = []
    for row in rows:
        created_at = row["created_at"]
        created_at_str = (
            created_at.isoformat()
            if hasattr(created_at, "isoformat")
            else str(created_at)
        )
        # user 메시지
        messages.append(
            {
                "role": "user",
                "content": row["query"],
                "created_at": created_at_str,
            }
        )
        # assistant 메시지
        messages.append(
            {
                "role": "assistant",
                "content": row["answer"],
                "created_at": created_at_str,
            }
        )

    return messages


# =========================================================
# DELETE: 세션 단위 삭제 / 전체 삭제
# =========================================================

def delete_session(session_id: int | str, user_id: Optional[int | str] = None) -> bool:
    """
    특정 session_id의 기록을 삭제.
    user_id가 주어졌으면 해당 user_id의 세션만 삭제.
    """
    session_id_int = int(session_id)

    with engine.begin() as conn:
        # 1) chat_log 삭제
        params: Dict[str, Any] = {"session_id": session_id_int}
        user_filter = ""
        if user_id is not None:
            user_filter = "AND user_id = :user_id"
            params["user_id"] = int(user_id)

        conn.execute(
            text(
                f"""
                DELETE FROM chat_log
                WHERE session_id = :session_id
                {user_filter}
                """
            ),
            params,
        )

        # 2) chat_session 삭제
        res = conn.execute(
            text(
                """
                DELETE FROM chat_session
                WHERE session_id = :session_id
                """
            ),
            {"session_id": session_id_int},
        )
        deleted = res.rowcount or 0

    return deleted > 0


def delete_all_sessions(user_id: Optional[int | str] = None) -> None:
    """
    전체 세션 삭제 (개발/테스트용).
    user_id가 주어지면 해당 유저의 세션과 로그만 삭제.
    아무것도 주어지지 않으면 전체 삭제.
    """
    with engine.begin() as conn:
        if user_id is not None:
            user_id_int = int(user_id)
            # 특정 유저 로그 삭제
            conn.execute(
                text("DELETE FROM chat_log WHERE user_id = :user_id"),
                {"user_id": user_id_int},
            )
            conn.execute(
                text("DELETE FROM chat_session WHERE user_id = :user_id"),
                {"user_id": user_id_int},
            )
        else:
            # 전체 삭제
            conn.execute(
                text("TRUNCATE chat_log, chat_session RESTART IDENTITY CASCADE")
            )


# =========================================================
# (기존) 히스토리용 유틸 - history_agent 등에서 사용 가능
# =========================================================

def list_history(
    limit: int = 20,
    order: Literal["asc", "desc"] = "desc",
) -> List[Dict[str, Any]]:
    """
    🔹 기존 버전: 전체 세션의 히스토리 목록을 조회.
    (user_id 구분 없이 전부)
    """
    order_sql = "ASC" if order == "asc" else "DESC"

    sql = f"""
        SELECT
            s.session_id AS id,
            l.query,
            l.answer,
            s.created_at
        FROM chat_session AS s
        JOIN LATERAL (
            SELECT query, answer
            FROM chat_log
            WHERE chat_log.session_id = s.session_id
            ORDER BY created_at ASC
            LIMIT 1
        ) AS l ON TRUE
        ORDER BY s.created_at {order_sql}
        LIMIT :limit
    """

    with engine.begin() as conn:
        rows = conn.execute(text(sql), {"limit": limit}).mappings().all()

    return [dict(row) for row in rows]


def get_history_detail(session_id: str | int) -> Optional[List[Dict[str, Any]]]:
    """
    🔹 기존 버전: 특정 session_id에 대한 상세 대화 내역 조회.
    timestamp 필드 이름으로 반환.
    """
    sql = """
        SELECT query, answer, created_at
        FROM chat_log
        WHERE session_id = :session_id
        ORDER BY created_at ASC
    """

    with engine.begin() as conn:
        rows = conn.execute(
            text(sql), {"session_id": int(session_id)}
        ).mappings().all()

    if not rows:
        return None

    messages: List[Dict[str, Any]] = []
    for row in rows:
        ts = (
            row["created_at"].isoformat()
            if hasattr(row["created_at"], "isoformat")
            else str(row["created_at"])
        )
        messages.append({"role": "user", "content": row["query"], "timestamp": ts})
        messages.append({"role": "assistant", "content": row["answer"], "timestamp": ts})

    return messages


def delete_all_history() -> None:
    """
    🔹 기존 버전: 모든 히스토리 삭제 (user_id 구분 없음).
    """
    with engine.begin() as conn:
        conn.execute(text("TRUNCATE chat_log, chat_session RESTART IDENTITY CASCADE"))


def delete_history_one(session_id: str | int) -> bool:
    """
    🔹 기존 버전: 특정 session_id에 대한 히스토리 삭제.
    """
    session_id_int = int(session_id)
    with engine.begin() as conn:
        conn.execute(
            text("DELETE FROM chat_log WHERE session_id = :session_id"),
            {"session_id": session_id_int},
        )
        res = conn.execute(
            text("DELETE FROM chat_session WHERE session_id = :session_id"),
            {"session_id": session_id_int},
        )
        deleted = res.rowcount or 0

    return deleted > 0


def get_recent_logs(user_id: int | str, limit: int = 20) -> List[Dict[str, Any]]:
    """
    특정 user_id의 최근 chat_log들을 가져온다.
    history_agent에서 과거 대화 기반 답변을 만들 때 사용.
    """
    user_id_int = int(user_id)

    sql = """
        SELECT
            session_id,
            query,
            answer,
            created_at
        FROM chat_log
        WHERE user_id = :user_id
        ORDER BY created_at DESC
        LIMIT :limit
    """

    with engine.begin() as conn:
        rows = conn.execute(
            text(sql), {"user_id": user_id_int, "limit": limit}
        ).mappings().all()

    return [dict(row) for row in rows]
