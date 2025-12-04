# C:\Users\playdata\Desktop\SKN16-FINAL-1Team\AI_service_LLM\app.py

from __future__ import annotations

from typing import List, Dict

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# 🔹 OpenAI LLM (chatbot/core/llm.py)
from chatbot.core.llm import run_llm

# 🔹 DB 저장/조회용 레포지토리
from chatbot.core.chat_repository import (
    upsert_session_with_log,
    list_sessions as db_list_sessions,
    get_session_messages as db_get_session_messages,
    delete_session as db_delete_session,
    delete_all_sessions as db_delete_all_sessions,
)

# ============================================
# 공통 설정
# ============================================

# ⚠️ 아직 인증 연동 전이라 테스트용으로 user_id=1 고정
USER_ID = 1

MEDINOTE_SYSTEM_PROMPT = """
너는 '메디노트' 서비스의 AI 건강 챗봇이다.
- 사용자의 증상, 복용 중인 약, 병원 진료 기록 등을 바탕으로 일반적인 건강 정보와 생활 수칙을 안내한다.
- 의사/약사가 아니며, '진단', '처방', '특정 약 복용 지시'는 절대 내리지 않는다.
- 위험 신호(심한 통증, 호흡곤란, 의식 변화 등)가 의심되면 즉시 병원·응급실 방문을 권한다.
- 사용자가 이해하기 쉽게 한국어로, 친절하고 차분하게 설명한다.
"""

# ============================================
# Pydantic 모델들 (프론트와 1:1 매핑)
# ============================================

class ChatQueryRequest(BaseModel):
    session_id: int       # 0이면 새 세션
    query: str


class ChatQueryResponse(BaseModel):
    session_id: int
    answer: str


class SessionItem(BaseModel):
    session_id: int
    title: str
    created_at: str       # ISO 문자열


class SessionsResponse(BaseModel):
    sessions: List[SessionItem]


class SessionMessage(BaseModel):
    role: str             # "user" | "assistant"
    content: str
    created_at: str       # ISO 문자열


class SessionDetailResponse(BaseModel):
    session_id: int
    messages: List[SessionMessage]


# ============================================
# FastAPI 앱 & CORS 설정
# ============================================

app = FastAPI(title="MediNote AI LLM Service", version="0.2.0")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://192.168.0.11:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,      # 개발 중엔 ["*"] 도 가능
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================
# DB 기반 컨텍스트 빌더
# ============================================

def _build_context_from_db(session_id: int) -> str | None:
    """
    DB에서 해당 세션의 대화 내역을 가져와서
    LLM에 넘길 context 문자열로 변환.
    (최근 10개 메시지만 사용)
    """
    if not session_id or session_id == 0:
        return None

    rows = db_get_session_messages(session_id=session_id, user_id=USER_ID)
    if not rows:
        return None

    # rows 예: [{"role":"user","content":"...","created_at":"..."}, ...]
    last_msgs = rows[-10:]

    lines: List[str] = []
    for m in last_msgs:
        prefix = "사용자" if m["role"] == "user" else "챗봇"
        lines.append(f"[{prefix}] {m['content']}")

    return "\n".join(lines)


def generate_answer_with_db(session_id: int, query: str) -> str:
    """
    DB에 저장된 세션 기반으로 context를 만들고,
    LLM(run_llm)을 호출해서 답변을 생성.
    """
    context = _build_context_from_db(session_id)

    answer = run_llm(
        system_prompt=MEDINOTE_SYSTEM_PROMPT,
        user_message=query,
        context=context,
    )

    return answer or "죄송합니다. 지금은 답변을 생성하지 못했습니다."


# ============================================
# 기본 health 체크
# ============================================

@app.get("/health", tags=["default"])
async def health_check():
    return {"status": "ok"}


# ============================================
# POST /chatbot/query  (⭢ DB 저장 버전)
# ============================================

@app.post("/chatbot/query", response_model=ChatQueryResponse, tags=["chatbot"])
async def post_chatbot_query(payload: ChatQueryRequest):
    """
    - payload.session_id == 0 or 존재하지 않으면 ➜ 새 세션 생성 + 첫 로그 저장
    - 아니면 ➜ 기존 세션에 로그 append
    """
    # 1) LLM 답변 먼저 생성 (기존 세션 대화 내용으로 context 구성)
    try:
        answer_text = generate_answer_with_db(
            session_id=payload.session_id,
            query=payload.query,
        )
    except Exception as e:
        print(f"[LLM ERROR] session_id={payload.session_id} error={e!r}")
        answer_text = (
            "죄송합니다. 현재 챗봇 엔진에 문제가 발생하여 답변을 생성할 수 없습니다. "
            "잠시 후 다시 시도해 주세요."
        )

    # 2) DB 에 세션 + 로그 저장 (필요하면 새 세션 생성)
    used_session_id = upsert_session_with_log(
        session_id=payload.session_id,
        user_id=USER_ID,
        query=payload.query,
        answer=answer_text,
    )

    # 3) 프론트로 session_id + answer 반환
    return ChatQueryResponse(
        session_id=used_session_id,
        answer=answer_text,
    )


# ============================================
# GET /chatbot/sessions  (세션 목록)
# ============================================

@app.get("/chatbot/sessions", response_model=SessionsResponse, tags=["chatbot"])
async def get_chatbot_sessions():
    rows = db_list_sessions(user_id=USER_ID, limit=50, order="desc")
    # rows 예: [{"session_id":1,"title":"...","created_at":"..."}]
    sessions = [SessionItem(**row) for row in rows]
    return SessionsResponse(sessions=sessions)


# ============================================
# DELETE /chatbot/sessions  (해당 유저 전체 삭제)
# ============================================

@app.delete("/chatbot/sessions", response_model=str, tags=["chatbot"])
async def delete_all_chatbot_sessions():
    db_delete_all_sessions(user_id=USER_ID)
    return "All chatbot sessions deleted."


# ============================================
# GET /chatbot/sessions/{session_id}  (세션 상세)
# ============================================

@app.get(
    "/chatbot/sessions/{session_id}",
    response_model=SessionDetailResponse,
    tags=["chatbot"],
)
async def get_chatbot_session_detail(session_id: int):
    rows = db_get_session_messages(session_id=session_id, user_id=USER_ID)
    if not rows:
        raise HTTPException(status_code=404, detail="Session not found.")

    messages = [SessionMessage(**row) for row in rows]
    return SessionDetailResponse(
        session_id=session_id,
        messages=messages,
    )


# ============================================
# DELETE /chatbot/sessions/{session_id}  (단일 세션 삭제)
# ============================================

@app.delete(
    "/chatbot/sessions/{session_id}",
    response_model=str,
    tags=["chatbot"],
)
async def delete_one_chatbot_session(session_id: int):
    deleted = db_delete_session(session_id=session_id, user_id=USER_ID)
    if not deleted:
        raise HTTPException(status_code=404, detail="Session not found.")

    return f"Session {session_id} deleted."
