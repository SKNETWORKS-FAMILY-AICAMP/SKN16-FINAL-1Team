# AI_service_LLM/tests/test_api_chatbot.py

from __future__ import annotations

from typing import List

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

# ⛔️ 여기서 router를 미리 import 하면 안 된다!
# from chatbot.api.router import router as chatbot_router  # <- 삭제


# =========================================================
# 테스트용 FastAPI 앱 생성
# =========================================================

def _create_app() -> FastAPI:
    """
    mocks 세팅이 끝난 뒤에 router 를 import 해서
    이미 mock 된 chat_repository 함수를 가져가게 만든다.
    """
    from chatbot.api.router import router as chatbot_router  # ✅ 지연 import

    app = FastAPI()
    app.include_router(chatbot_router)
    return app


# =========================================================
# 공통 mock 세팅
# =========================================================

def _setup_mocks(monkeypatch):
    """
    /chatbot/query, /chatbot/sessions* 에서 사용하는
    LLM, RAG, 웹 검색, DB 레이어를 전부 mock 처리.
    """

    # 에이전트 / 레포지토리 모듈 import (여기는 그냥 모듈만 가져옴)
    import chatbot.agents.chit_agent as chit_agent
    import chatbot.agents.disease_agent as disease_agent
    import chatbot.agents.drug_agent as drug_agent
    import chatbot.agents.history_agent as history_agent
    import chatbot.agents.web_agent as web_agent
    import chatbot.agents.db_agent as db_agent
    import chatbot.core.chat_repository as chat_repo

    # ============================
    # 1) LLM 더미 (모든 에이전트 공통)
    # ============================
    def fake_llm(system_prompt: str, user_message: str, *args, **kwargs) -> str:
        # 어떤 에이전트든, user_message만 그대로 돌려주는 더미 응답
        return f"[DUMMY ANSWER] {user_message}"

    # 각 에이전트 모듈 안의 call_llm 심볼을 덮어쓴다
    monkeypatch.setattr(chit_agent, "call_llm", fake_llm, raising=False)
    monkeypatch.setattr(disease_agent, "call_llm", fake_llm, raising=False)
    monkeypatch.setattr(drug_agent, "call_llm", fake_llm, raising=False)
    monkeypatch.setattr(history_agent, "call_llm", fake_llm, raising=False)
    monkeypatch.setattr(web_agent, "call_llm", fake_llm, raising=False)
    monkeypatch.setattr(db_agent, "call_llm", fake_llm, raising=False)

    # ============================
    # 2) RAG 검색 더미 (질병 / 약 / 상호작용)
    # ============================
    if hasattr(disease_agent, "search_disease_docs"):
        monkeypatch.setattr(
            disease_agent,
            "search_disease_docs",
            lambda query, k=5: [f"Disease doc for: {query}"],
            raising=False,
        )

    if hasattr(disease_agent, "search_interaction_docs"):
        monkeypatch.setattr(
            disease_agent,
            "search_interaction_docs",
            lambda query, k=5: [f"Interaction doc for: {query}"],
            raising=False,
        )

    if hasattr(drug_agent, "search_drug_docs"):
        monkeypatch.setattr(
            drug_agent,
            "search_drug_docs",
            lambda query, k=5: [f"Drug doc for: {query}"],
            raising=False,
        )

    if hasattr(drug_agent, "search_interaction_docs"):
        monkeypatch.setattr(
            drug_agent,
            "search_interaction_docs",
            lambda query, k=5: [f"Interaction doc for: {query}"],
            raising=False,
        )

    # ============================
    # 3) Tavily 웹 검색 더미 (web_agent)
    # ============================
    if hasattr(web_agent, "tavily_search"):
        monkeypatch.setattr(
            web_agent,
            "tavily_search",
            lambda query, max_results=5: [f"Web result for: {query}"],
            raising=False,
        )

    # ============================
    # 4) history / DB 관련 더미
    #    - history_agent 안에서 쓰는 get_recent_logs
    #    - chat_repository 에서 쓰는 함수들 전부 fake
    # ============================

    # history_agent 에서 사용하는 get_recent_logs 더미
    if hasattr(history_agent, "get_recent_logs"):
        monkeypatch.setattr(
            history_agent,
            "get_recent_logs",
            lambda user_id, limit=20: [
                {
                    "session_id": 1,
                    "query": "지난번에 물어봤던 질문",
                    "answer": "지난번에 했던 답변",
                    "created_at": "2025-01-01T00:00:00",
                }
            ],
            raising=False,
        )

    # ─────────────────────────────
    # chat_repository 용 fake 함수들
    # router.py 에서 import 하는 이름과 정확히 맞춘다:
    #   create_session_with_log, append_log, list_sessions,
    #   get_session_messages, delete_all_sessions, delete_session
    # ─────────────────────────────

    # 새 세션 생성 + 첫 로그 기록
    def fake_create_session_with_log(*args, **kwargs) -> int:
        # 항상 123번 세션이라고 가정
        return 123

    # 기존 세션에 로그 추가
    def fake_append_log(*args, **kwargs) -> None:
        return None

    # 세션 목록 조회
    def fake_list_sessions() -> List[dict]:
        return [
            {
                "session_id": 1,
                "title": "첫 질문입니다",
                "created_at": "2025-01-01T10:00:00",
            },
            {
                "session_id": 2,
                "title": "두 번째 질문입니다",
                "created_at": "2025-01-02T11:00:00",
            },
        ]

    # 세션 상세 메시지 조회
    def fake_get_session_messages(session_id: int) -> List[dict]:
        if int(session_id) == 1:
            return [
                {
                    "role": "user",
                    "content": "첫 질문입니다",
                    "created_at": "2025-01-01T10:00:00",
                },
                {
                    "role": "assistant",
                    "content": "첫 답변입니다",
                    "created_at": "2025-01-01T10:00:05",
                },
            ]
        else:
            return []

    # 전체 세션 삭제
    def fake_delete_all_sessions() -> None:
        return None

    # 특정 세션 삭제
    def fake_delete_session(session_id: int) -> bool:
        # 1번은 존재한다고 가정
        return int(session_id) == 1

    # ─────────────────────────────
    # chat_repository 모듈에 직접 패치
    # ─────────────────────────────
    monkeypatch.setattr(
        chat_repo,
        "create_session_with_log",
        fake_create_session_with_log,
        raising=False,
    )
    monkeypatch.setattr(
        chat_repo,
        "append_log",
        fake_append_log,
        raising=False,
    )
    monkeypatch.setattr(
        chat_repo,
        "list_sessions",
        fake_list_sessions,
        raising=False,
    )
    monkeypatch.setattr(
        chat_repo,
        "get_session_messages",
        fake_get_session_messages,
        raising=False,
    )
    monkeypatch.setattr(
        chat_repo,
        "delete_all_sessions",
        fake_delete_all_sessions,
        raising=False,
    )
    monkeypatch.setattr(
        chat_repo,
        "delete_session",
        fake_delete_session,
        raising=False,
    )


# =========================================================
# 테스트 헬퍼
# =========================================================

def _get_client(monkeypatch) -> TestClient:
    # 1) 먼저 mocks 설정
    _setup_mocks(monkeypatch)
    # 2) 그 다음에 app + router import
    app = _create_app()
    return TestClient(app)


# =========================================================
# /chatbot/query
# =========================================================

def test_post_chatbot_query_new_session(monkeypatch):
    """
    session_id=0 일 때,
    새 세션을 만들고 답변을 반환하는지 확인.
    """
    client = _get_client(monkeypatch)

    payload = {
        "session_id": 0,
        "query": "혈압 약은 뭐가 있어?",
    }

    resp = client.post("/chatbot/query", json=payload)

    assert resp.status_code == 200

    data = resp.json()
    # 응답 스키마: { "session_id": int, "answer": str }
    assert "session_id" in data
    assert "answer" in data
    assert data["session_id"] == 123
    assert "[DUMMY ANSWER]" in data["answer"]


# =========================================================
# /chatbot/sessions
# =========================================================

def test_get_chatbot_sessions(monkeypatch):
    """
    세션 목록(GET /chatbot/sessions)이 정상적으로 변환되어 오는지 확인.
    """
    client = _get_client(monkeypatch)

    resp = client.get("/chatbot/sessions")
    assert resp.status_code == 200

    data = resp.json()
    # 응답 스키마: { "sessions": [ { "session_id", "title", "created_at" }, ... ] }
    assert "sessions" in data
    assert isinstance(data["sessions"], list)
    assert len(data["sessions"]) >= 1

    first = data["sessions"][0]
    assert "session_id" in first
    assert "title" in first
    assert "created_at" in first


def test_get_chatbot_session_detail(monkeypatch):
    """
    특정 세션 상세(GET /chatbot/sessions/{session_id})가
    메시지 리스트로 반환되는지 확인.
    """
    client = _get_client(monkeypatch)

    resp = client.get("/chatbot/sessions/1")
    assert resp.status_code == 200

    data = resp.json()
    # 응답 스키마: { "session_id": int, "messages": [ { role, content, created_at } ] }
    assert data["session_id"] == 1
    assert "messages" in data
    assert isinstance(data["messages"], list)
    assert len(data["messages"]) == 2

    msg0 = data["messages"][0]
    assert msg0["role"] == "user"
    assert "content" in msg0
    assert "created_at" in msg0


# =========================================================
# DELETE /chatbot/sessions & /chatbot/sessions/{session_id}
# =========================================================

def test_delete_all_sessions(monkeypatch):
    """
    전체 세션 삭제(DELETE /chatbot/sessions)가 2xx를 반환하는지 확인.
    """
    client = _get_client(monkeypatch)

    resp = client.delete("/chatbot/sessions")
    # 라우터 구현에 따라 200 또는 204 둘 중 하나일 수 있음 → 2xx만 허용
    assert 200 <= resp.status_code < 300


def test_delete_one_session(monkeypatch):
    """
    특정 세션 삭제(DELETE /chatbot/sessions/{session_id})가
    존재하는 세션에 대해 성공 코드를 주는지 확인.
    """
    client = _get_client(monkeypatch)

    resp = client.delete("/chatbot/sessions/1")
    assert 200 <= resp.status_code < 300
