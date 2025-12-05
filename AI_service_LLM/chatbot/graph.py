# AI_service_LLM/chatbot/graph.py

from __future__ import annotations

from langgraph.graph import StateGraph, END

from .core.state import ChatState
from .core.supervisor import run_orchestrator  # ✅ 새로운 오케스트레이터(슈퍼바이저)


# LangGraph용 노드 함수
def _orchestrator_node(state: ChatState) -> ChatState:
    """
    LangGraph에서 호출되는 단일 노드.
    내부에서 run_orchestrator가
    - 규칙 기반 route_supervisor
    - GPT 플래너
    - 각 에이전트 호출
    을 모두 수행한다.
    """
    return run_orchestrator(state)


# 그래프 빌더 생성
_builder = StateGraph(ChatState)

# -------------------------------
# 노드 등록
# -------------------------------

# 엔트리 포인트: orchestrator
_builder.add_node("orchestrator", _orchestrator_node)
_builder.set_entry_point("orchestrator")

# orchestrator 실행 후 종료
_builder.add_edge("orchestrator", END)

# -------------------------------
# 최종 컴파일된 그래프
# -------------------------------

chatbot_graph = _builder.compile()
