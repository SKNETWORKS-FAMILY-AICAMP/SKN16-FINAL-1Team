# AI_service_LLM/chatbot/graph.py

from __future__ import annotations

from langgraph.graph import StateGraph, END

from .core.state import ChatState
from .supervisor import route_supervisor
from .agents import (
    chit_agent_run,
    db_agent_run,
    disease_agent_run,
    drug_agent_run,
    history_agent_run,
    web_agent_run,
)


def _supervisor_node(state: ChatState) -> ChatState:
    """
    LangGraph용 supervisor 노드 함수.

    실제 라우팅 결정은 route_supervisor에서 하고,
    이 노드는 state를 그대로 넘겨주는 역할만 한다.
    """
    return state


# 그래프 빌더 생성
_builder = StateGraph(ChatState)

# -------------------------------
# 노드 등록
# -------------------------------

# 1) Supervisor 노드
_builder.add_node("supervisor", _supervisor_node)

# 2) 에이전트 노드들
_builder.add_node("chit", chit_agent_run)
_builder.add_node("db", db_agent_run)
_builder.add_node("disease", disease_agent_run)
_builder.add_node("drug", drug_agent_run)
_builder.add_node("history", history_agent_run)
_builder.add_node("web", web_agent_run)

# 진입점: supervisor
_builder.set_entry_point("supervisor")

# -------------------------------
# 조건부 엣지 (슈퍼바이저 → 각 에이전트)
# -------------------------------

_builder.add_conditional_edges(
    "supervisor",
    route_supervisor,   # state -> "chit" / "db" / "disease" / "drug" / "web" / "history"
    {
        "chit": "chit",
        "db": "db",
        "disease": "disease",
        "drug": "drug",
        "history": "history",
        "web": "web",
    },
)

# -------------------------------
# 각 에이전트 노드 → END
# -------------------------------

_builder.add_edge("chit", END)
_builder.add_edge("db", END)
_builder.add_edge("disease", END)
_builder.add_edge("drug", END)
_builder.add_edge("history", END)
_builder.add_edge("web", END)

# -------------------------------
# 최종 컴파일된 그래프
# -------------------------------

chatbot_graph = _builder.compile()
