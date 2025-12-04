# AI_service_LLM/tests/test_graph_basic.py

from __future__ import annotations

from typing import Any, Dict

from chatbot.graph import chatbot_graph
from chatbot.core.state import ChatState

# 🔹 에이전트 모듈들을 직접 import 해서, 그 안의 call_llm / search_* 등을 패치해야 한다
import chatbot.agents.chit_agent as chit_agent
import chatbot.agents.disease_agent as disease_agent
import chatbot.agents.drug_agent as drug_agent
import chatbot.agents.history_agent as history_agent
import chatbot.agents.web_agent as web_agent


def _setup_mocks(monkeypatch):
    """
    LLM, RAG, 웹 검색, 히스토리 조회 등 외부 의존성을 모두 mock 처리.
    - 중요: 에이전트가 직접 import 해 둔 심볼(call_llm, search_*, get_recent_logs)을
      '그 에이전트 모듈' 기준으로 patch 해야 효과가 있다.
    """

    # 1) LLM 호출 더미 (모든 에이전트 공통)
    def fake_llm(system_prompt: str, user_message: str, *args, **kwargs) -> str:
        # 어떤 에이전트든, user_message만 그대로 돌려주는 더미 응답
        return f"[DUMMY ANSWER] {user_message}"

    # 각 에이전트 모듈 안의 call_llm 심볼을 덮어쓴다
    monkeypatch.setattr(chit_agent, "call_llm", fake_llm, raising=False)
    monkeypatch.setattr(disease_agent, "call_llm", fake_llm, raising=False)
    monkeypatch.setattr(drug_agent, "call_llm", fake_llm, raising=False)
    monkeypatch.setattr(history_agent, "call_llm", fake_llm, raising=False)
    monkeypatch.setattr(web_agent, "call_llm", fake_llm, raising=False)

    # 2) RAG 검색 더미 (질병 / 약 / 상호작용)
    # disease_agent는 search_disease_docs / search_interaction_docs 를 사용한다고 가정
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

    # drug_agent는 search_drug_docs / search_interaction_docs 를 사용한다고 가정
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

    # 3) Tavily 웹 검색 더미 (web_agent)
    if hasattr(web_agent, "tavily_search"):
        monkeypatch.setattr(
            web_agent,
            "tavily_search",
            lambda query, max_results=5: [f"Web result for: {query}"],
            raising=False,
        )

    # 4) 히스토리 조회 더미 (history_agent → get_recent_logs 사용)
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
    # 혹시 history_agent 내부에서 chat_repository를 다시 import 해서 쓴다면,
    # 따로 chat_repository를 patch 할 필요는 없음 (위처럼 agent에 patch하는 게 우선)


def _run_query(text: str, monkeypatch) -> Dict[str, Any]:
    _setup_mocks(monkeypatch)

    state: ChatState = {
        "user_id": "test_user",
        "messages": [
            {"role": "user", "content": text},  # 마지막 메시지가 항상 user
        ],
    }

    result = chatbot_graph.invoke(state)
    return result


def test_graph_chit_agent(monkeypatch):
    """일반 대화(잡담) 질문이 그래프에서 에러 없이 처리되는지 확인."""
    result = _run_query("안녕? 오늘 기분이 어때?", monkeypatch)
    msgs = result["messages"]
    assert msgs[-1]["role"] == "assistant"
    assert "[DUMMY ANSWER]" in msgs[-1]["content"]


def test_graph_disease_agent(monkeypatch):
    """질병/증상 관련 질문이 처리되는지 확인."""
    result = _run_query("두통이 있고 열이 나는데 어느 과 가야 해?", monkeypatch)
    msgs = result["messages"]
    assert msgs[-1]["role"] == "assistant"
    assert "[DUMMY ANSWER]" in msgs[-1]["content"]


def test_graph_drug_agent(monkeypatch):
    """약/영양제 관련 질문이 처리되는지 확인."""
    result = _run_query("타이레놀과 이부프로펜을 같이 먹어도 돼?", monkeypatch)
    msgs = result["messages"]
    assert msgs[-1]["role"] == "assistant"
    assert "[DUMMY ANSWER]" in msgs[-1]["content"]


def test_graph_history_agent(monkeypatch):
    """과거 대화 기록 관련 질문이 처리되는지 확인."""
    result = _run_query("지난번에 너랑 뭐라고 얘기했었지?", monkeypatch)
    msgs = result["messages"]
    assert msgs[-1]["role"] == "assistant"
    assert "[DUMMY ANSWER]" in msgs[-1]["content"]
