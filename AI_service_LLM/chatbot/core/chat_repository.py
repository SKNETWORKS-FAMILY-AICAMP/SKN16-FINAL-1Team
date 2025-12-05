# AI_service_LLM/chatbot/core/chat_repository.py

from __future__ import annotations

import os
import json  # 🔥 JSON 직렬화를 위해 추가
from dataclasses import dataclass
from typing import List, Literal, Dict, Any, Optional

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

load_dotenv()

# 예시: postgresql+psycopg2://user:password@host:port/dbname
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL이 설정되지 않았습니다. "
        "AI_service_LLM/.env 또는 Docker 환경변수를 확인하세요."
    )

DEFAULT_USER_ID = int(
    os.getenv("LLM_DEFAULT_USER_ID")
    or os.getenv("DEFAULT_USER_ID")
    or "1"
)


def _resolve_user_id(user_id: int | str | None) -> int:
    """
    user_id가 비어 있으면 기본값을, 문자열이면 정수로 변환한다.
    """
    if user_id is None:
        return DEFAULT_USER_ID
    try:
        return int(user_id)
    except Exception as exc:  # pragma: no cover - 안전 방어
        raise ValueError("user_id를 정수로 변환할 수 없습니다.") from exc


def _get_engine() -> Engine:
    # lazy init 로 바꿀 수도 있지만, 여기서는 모듈 import 시 한 번만 생성한다고 가정
    return create_engine(DATABASE_URL, future=True)


engine: Engine = _get_engine()


# =========================================================
# Dataclass (선택사항 - 타입 힌트용)
# =========================================================

@dataclass
class HistoryRow:
    session_id: int
    role: str
    content: str
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
    user_id: int | str | None,
    query: str,
    answer: str,
    sources: Optional[List[Dict[str, Any]]] = None,
    used_model: str | None = None,
    latency_ms: Optional[int] = None,
) -> int:
    """
    새로운 채팅 세션을 만들고, 첫 번째 질문/답변을 chat_log에 기록한다.
    반환값: 생성된 session_id

    테이블 스키마:
      chat_session(session_id PK, user_id, title, created_at)
      chat_log(message_id PK, session_id, user_id, role, content, sources, created_at)

    - user 메시지: sources = NULL
    - assistant 메시지: sources = JSON (List[Dict])
    """
    title = (query or "").strip()
    if not title:
        title = "새 채팅"
    if len(title) > 50:
        title = title[:47] + "..."

    user_id_int = _resolve_user_id(user_id)

    # 🔥 sources 를 JSON 문자열로 변환 (없으면 None 그대로)
    assistant_sources_json = (
        json.dumps(sources, ensure_ascii=False)
        if sources is not None else None
    )

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
        #   - user 메시지 (sources = NULL)
        conn.execute(
            text(
                """
                INSERT INTO chat_log (session_id, user_id, role, content, sources, created_at)
                VALUES (:session_id, :user_id, :role, :content, :sources, NOW())
                """
            ),
            {
                "session_id": session_id,
                "user_id": user_id_int,
                "role": "user",
                "content": query,
                "sources": None,
            },
        )
        #   - assistant 메시지 (sources = JSON 문자열)
        conn.execute(
            text(
                """
                INSERT INTO chat_log (session_id, user_id, role, content, sources, created_at)
                VALUES (:session_id, :user_id, :role, :content, :sources, NOW())
                """
            ),
            {
                "session_id": session_id,
                "user_id": user_id_int,
                "role": "assistant",
                "content": answer,
                "sources": assistant_sources_json,
            },
        )

        # TODO: used_model, latency_ms 는 별도 metric 테이블이 있으면 거기에 저장

    return int(session_id)


# =========================================================
# APPEND (기존 세션에 log 추가)
# =========================================================

def append_log(
    session_id: int | str,
    user_id: int | str | None,
    query: str,
    answer: str,
    sources: Optional[List[Dict[str, Any]]] = None,
) -> None:
    """
    기존 session_id에 질문/답변 한 쌍을 chat_log에 추가.
    (각각 role='user', 'assistant' 로 두 줄 삽입)

    - user 메시지: sources = NULL
    - assistant 메시지: sources = JSON (List[Dict])
    """
    session_id_int = int(session_id)
    user_id_int = _resolve_user_id(user_id)

    # 🔥 sources 를 JSON 문자열로 변환
    assistant_sources_json = (
        json.dumps(sources, ensure_ascii=False)
        if sources is not None else None
    )

    with engine.begin() as conn:
        # user 메시지
        conn.execute(
            text(
                """
                INSERT INTO chat_log (session_id, user_id, role, content, sources, created_at)
                VALUES (:session_id, :user_id, :role, :content, :sources, NOW())
                """
            ),
            {
                "session_id": session_id_int,
                "user_id": user_id_int,
                "role": "user",
                "content": query,
                "sources": None,
            },
        )

        # assistant 메시지
        conn.execute(
            text(
                """
                INSERT INTO chat_log (session_id, user_id, role, content, sources, created_at)
                VALUES (:session_id, :user_id, :role, :content, :sources, NOW())
                """
            ),
            {
                "session_id": session_id_int,
                "user_id": user_id_int,
                "role": "assistant",
                "content": answer,
                "sources": assistant_sources_json,
            },
        )


def upsert_session_with_log(
    session_id: Optional[int],
    user_id: int | str | None,
    query: str,
    answer: str,
    sources: Optional[List[Dict[str, Any]]] = None,
) -> int:
    """
    session_id 가 None 또는 0이면 새로운 세션을 만들고 첫 로그를 기록.
    나머지 경우에는 해당 세션에 로그를 append.
    반환값: 사용된 session_id (새로 생성되었거나, 기존 것이거나)

    - sources: assistant 메시지 한 턴에 대한 출처 리스트(JSON)
    """
    user_id_int = _resolve_user_id(user_id)

    if not session_id or int(session_id) == 0:
        return create_session_with_log(
            user_id=user_id_int,
            query=query,
            answer=answer,
            sources=sources,
        )

    append_log(
        session_id=int(session_id),
        user_id=user_id_int,
        query=query,
        answer=answer,
        sources=sources,
    )
    return int(session_id)


# =========================================================
# READ: 세션 목록 (사이드바용)
# =========================================================

def list_sessions(
    user_id: int | str | None = None,
    limit: int = 50,
    order: Literal["asc", "desc"] = "desc",
) -> List[Dict[str, Any]]:
    """
    특정 user_id 의 채팅 세션 목록 조회.
    /chatbot/sessions 에서 사용하기 좋은 형태.
    """
    order_sql = "ASC" if order == "asc" else "DESC"
    user_id_int = _resolve_user_id(user_id)

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
        sessions.append(
            {
                "session_id": row["session_id"],
                "title": row["title"],
                "created_at": row["created_at"],  # datetime 그대로
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
    특정 session_id의 전체 대화 내역을
    "role + content + created_at + sources" 형태로 반환.
    (메인 백엔드와 맞추기 위해 sources 도 포함)
    """
    base_sql = """
        SELECT role, content, created_at, user_id, sources
        FROM chat_log
        WHERE session_id = :session_id
        {user_filter}
        ORDER BY created_at ASC, message_id ASC
    """

    params: Dict[str, Any] = {"session_id": int(session_id)}
    user_filter = "AND user_id = :user_id"
    params["user_id"] = _resolve_user_id(user_id)

    sql = base_sql.format(user_filter=user_filter)

    with engine.begin() as conn:
        rows = conn.execute(text(sql), params).mappings().all()

    if not rows:
        return None

    messages: List[Dict[str, Any]] = []
    for row in rows:
        messages.append(
            {
                "role": row["role"],
                "content": row["content"],
                "created_at": row["created_at"],   # datetime
                "sources": row.get("sources"),     # JSON → list/dict 로 자동 로드됨
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
        target_user_id = _resolve_user_id(user_id)

        # 1) chat_log 삭제
        conn.execute(
            text(
                """
                DELETE FROM chat_log
                WHERE session_id = :session_id
                  AND user_id = :user_id
                """
            ),
            {"session_id": session_id_int, "user_id": target_user_id},
        )

        # 2) chat_session 삭제
        res = conn.execute(
            text(
                """
                DELETE FROM chat_session
                WHERE session_id = :session_id
                  AND user_id = :user_id
                """
            ),
            {"session_id": session_id_int, "user_id": target_user_id},
        )
        deleted = res.rowcount or 0

    return deleted > 0


def delete_all_sessions(
    user_id: Optional[int | str] = None,
    include_all: bool = False,
) -> None:
    """
    전체 세션 삭제 (개발/테스트용).
    - user_id가 주어지면 해당 유저의 세션과 로그만 삭제
    - include_all=True 이고 user_id가 없으면 모든 세션/로그 삭제
    - 아무것도 없으면 기본 사용자(DEFAULT_USER_ID) 데이터만 삭제
    """
    with engine.begin() as conn:
        if include_all and user_id is None:
            conn.execute(
                text("TRUNCATE chat_log, chat_session RESTART IDENTITY CASCADE")
            )
            return

        target_user_id = _resolve_user_id(user_id)
        conn.execute(
            text("DELETE FROM chat_log WHERE user_id = :user_id"),
            {"user_id": target_user_id},
        )
        conn.execute(
            text("DELETE FROM chat_session WHERE user_id = :user_id"),
            {"user_id": target_user_id},
        )


# =========================================================
# (기존) 히스토리용 유틸 - history_agent 등에서 사용 가능
# =========================================================

def list_history(
    limit: int = 20,
    order: Literal["asc", "desc"] = "desc",
) -> List[Dict[str, Any]]:
    """
    🔹 전체 세션의 히스토리 목록을 조회.
    한 세션당
      - 첫 user 메시지를 query
      - 첫 assistant 메시지를 answer
    로 묶어서 반환 (기존 인터페이스 유지용).
    """
    order_sql = "ASC" if order == "asc" else "DESC"

    sql = f"""
        SELECT
            s.session_id AS id,
            u.content AS query,
            a.content AS answer,
            s.created_at
        FROM chat_session AS s
        LEFT JOIN LATERAL (
            SELECT content
            FROM chat_log
            WHERE chat_log.session_id = s.session_id
              AND role = 'user'
            ORDER BY created_at ASC, message_id ASC
            LIMIT 1
        ) AS u ON TRUE
        LEFT JOIN LATERAL (
            SELECT content
            FROM chat_log
            WHERE chat_log.session_id = s.session_id
              AND role = 'assistant'
            ORDER BY created_at ASC, message_id ASC
            LIMIT 1
        ) AS a ON TRUE
        ORDER BY s.created_at {order_sql}
        LIMIT :limit
    """

    with engine.begin() as conn:
        rows = conn.execute(text(sql), {"limit": limit}).mappings().all()

    return [dict(row) for row in rows]


def get_history_detail(session_id: str | int) -> Optional[List[Dict[str, Any]]]:
    """
    🔹 특정 session_id에 대한 상세 대화 내역 조회.
    timestamp 필드 이름으로 반환.
    (chat_log 의 role / content 를 그대로 사용)
    """
    sql = """
        SELECT role, content, created_at
        FROM chat_log
        WHERE session_id = :session_id
        ORDER BY created_at ASC, message_id ASC
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
        messages.append(
            {
                "role": row["role"],
                "content": row["content"],
                "timestamp": ts,
            }
        )

    return messages


def delete_all_history() -> None:
    """
    🔹 모든 히스토리 삭제 (user_id 구분 없음).
    """
    with engine.begin() as conn:
        conn.execute(text("TRUNCATE chat_log, chat_session RESTART IDENTITY CASCADE"))


def delete_history_one(session_id: str | int) -> bool:
    """
    🔹 특정 session_id에 대한 히스토리 삭제.
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


def get_recent_logs(
    user_id: int | str | None = None,
    limit: int = 20,
) -> List[Dict[str, Any]]:
    """
    특정 user_id의 최근 chat_log들을 가져온다.
    (이제는 한 줄 = 한 메시지 구조이므로
     session_id, role, content, created_at 을 그대로 반환)
    """
    user_id_int = _resolve_user_id(user_id)

    sql = """
        SELECT
            session_id,
            role,
            content,
            created_at
        FROM chat_log
        WHERE user_id = :user_id
        ORDER BY created_at DESC, message_id DESC
        LIMIT :limit
    """

    with engine.begin() as conn:
        rows = conn.execute(
            text(sql), {"user_id": user_id_int, "limit": limit}
        ).mappings().all()

    return [dict(row) for row in rows]
