# AI_service_LLM/chatbot/api/router.py

from __future__ import annotations

from typing import List

from fastapi import APIRouter, HTTPException, Path
from pydantic import BaseModel, Field

from ..graph import chatbot_graph
from ..core.chat_repository import (
    create_session_with_log,
    append_log,
    list_sessions,
    get_session_messages,
    delete_all_sessions,
    delete_session,
)

router = APIRouter(
    prefix="/chatbot",
    tags=["chatbot"],
)

# =========================
# Pydantic Models
# =========================


class ChatQueryRequest(BaseModel):
    """
    POST /chatbot/query 요청 바디

    - session_id: 0 이면 새 대화방 생성, 0이 아닌 경우 해당 세션에 메시지 추가
    - query: 사용자 질문
    """
    session_id: int = Field(0, ge=0, description="기존 세션 ID (0이면 새 세션)")
    query: str = Field(..., description="사용자 질문 텍스트")


class ChatQueryResponse(BaseModel):
    """
    POST /chatbot/query 응답 바디

    - session_id: 사용된 대화방 ID (새로 생성되었거나 기존 것)
    - answer: 챗봇 답변
    """
    session_id: int
    answer: str


class SessionItem(BaseModel):
    """
    GET /chatbot/sessions 한 줄 정보
    """
    session_id: int
    title: str
    created_at: str


class SessionsResponse(BaseModel):
    """
    GET /chatbot/sessions 응답 바디
    """
    sessions: List[SessionItem]


class SessionMessage(BaseModel):
    """
    GET /chatbot/sessions/{session_id} 메시지 한 줄
    """
    role: str
    content: str
    created_at: str


class SessionDetailResponse(BaseModel):
    """
    GET /chatbot/sessions/{session_id} 응답 바디
    """
    session_id: int
    messages: List[SessionMessage]


class MessageResponse(BaseModel):
    """
    DELETE 응답 바디 공통
    """
    message: str


# =========================
# Routes
# =========================


@router.post("/query", response_model=ChatQueryResponse)
async def chatbot_query(payload: ChatQueryRequest) -> ChatQueryResponse:
    """
    메인 챗봇 엔드포인트.

    - session_id == 0  → 새 세션 생성 + 첫 메시지 저장
    - session_id != 0  → 해당 세션에 메시지 추가
    """
    try:
        # LangGraph state 구성
        state = {
            "messages": [
                {
                    "role": "user",
                    "content": payload.query,
                }
            ]
        }

        # 기존 세션이면 state에 세션 ID 힌트로 넣어줄 수 있음 (옵션)
        if payload.session_id:
            state["session_id"] = str(payload.session_id)

        # LangGraph 실행
        result = chatbot_graph.invoke(state)

        messages = result.get("messages", [])
        if not messages or messages[-1].get("role") != "assistant":
            raise RuntimeError("Chatbot graph did not return assistant message.")

        last_msg = messages[-1]
        answer_text: str = last_msg.get("content", "")

        # DB 저장 (새 세션 or 기존 세션에 추가)
        if payload.session_id == 0:
            # 새 세션 생성 + 첫 질문/답변 로그 저장
            session_id = create_session_with_log(
                query=payload.query,
                answer=answer_text,
            )
        else:
            # 기존 세션에 로그만 추가
            session_id = payload.session_id
            append_log(
                session_id=session_id,
                query=payload.query,
                answer=answer_text,
            )

        return ChatQueryResponse(
            session_id=int(session_id),
            answer=answer_text,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions", response_model=SessionsResponse)
async def get_sessions() -> SessionsResponse:
    """
    모든 챗봇 세션 목록 조회.

    Response:
    {
      "sessions": [
        {
          "session_id": 1,
          "title": "첫 질문 일부...",
          "created_at": "2025-12-03T09:00:00Z"
        },
        ...
      ]
    }
    """
    try:
        rows = list_sessions()
        items = [
            SessionItem(
                session_id=int(row["session_id"]),
                title=row["title"],
                created_at=str(row["created_at"]),
            )
            for row in rows
        ]
        return SessionsResponse(sessions=items)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions/{session_id}", response_model=SessionDetailResponse)
async def get_session_detail(
    session_id: int = Path(..., ge=1, description="세션 ID"),
) -> SessionDetailResponse:
    """
    특정 세션의 전체 메시지 내역 조회.
    """
    try:
        rows = get_session_messages(session_id=session_id)
        if not rows:
            raise HTTPException(status_code=404, detail="Session not found")

        msgs = [
            SessionMessage(
                role=row["role"],
                content=row["content"],
                created_at=str(row["created_at"]),
            )
            for row in rows
        ]
        return SessionDetailResponse(
            session_id=session_id,
            messages=msgs,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/sessions", response_model=MessageResponse)
async def delete_sessions_all() -> MessageResponse:
    """
    모든 세션 + 관련 로그 삭제.
    """
    try:
        delete_all_sessions()
        return MessageResponse(message="All sessions deleted.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/sessions/{session_id}", response_model=MessageResponse)
async def delete_session_one(
    session_id: int = Path(..., ge=1, description="세션 ID"),
) -> MessageResponse:
    """
    특정 세션 삭제.
    """
    try:
        deleted = delete_session(session_id=session_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Session not found")

        return MessageResponse(message=f"Session {session_id} deleted.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
