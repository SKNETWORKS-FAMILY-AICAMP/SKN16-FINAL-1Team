# AI_service_LLM/chatbot/agents/web_agent.py

from __future__ import annotations

from typing import List, Dict, Any

from ..core.state import ChatState
from ..core.tracing import traceable
from ..core.prompts import WEB_SYSTEM_PROMPT
from ..core.llm import call_llm

# 🔥 이 함수는 네가 구현해둔 웹 검색 래퍼에 맞게 import만 맞추면 돼.
# 예시) core/web_search.py 에서 search_web 을 제공한다고 가정.
try:
    from ..core.web_search import search_web  # type: ignore
except ImportError:
    # 만약 아직 구현 안 했다면, 아래 시그니처에 맞게 만들어주면 됨:
    #
    # def search_web(query: str, top_k: int = 5) -> List[Dict[str, Any]]:
    #     return [{"title": "...", "url": "...", "snippet": "...", "score": 0.9}, ...]
    #
    def search_web(query: str, top_k: int = 5) -> List[Dict[str, Any]]:  # type: ignore
        # 임시 더미 구현 (원하는 대로 교체)
        return []


@traceable(name="web_agent")
def run(state: ChatState) -> ChatState:
    """
    신뢰할 수 있는 웹 검색 결과를 기반으로 답변하는 에이전트.

    - 예:
        - "최근 고혈압 치료 가이드라인 알려줘"
        - "타이레놀과 이부프로펜의 차이를 최신 논문 기준으로 알려줘"
    - 내부적으로 search_web(...) 으로 웹 검색을 수행하고,
      그 결과(title, url, snippet)를 LLM 컨텍스트와 sources로 넘긴다.
    """
    user_message = state["messages"][-1]["content"]

    # ------------------------------------------------
    # 1) 웹 검색
    # ------------------------------------------------
    # search_web 은 다음 형태로 결과를 반환한다고 가정:
    # [
    #   {"title": "...", "url": "...", "snippet": "...", "score": 0.9, "id": "..."},
    #   ...
    # ]
    web_results: List[Dict[str, Any]] = search_web(user_message, top_k=5)

    # ------------------------------------------------
    # 2) 컨텍스트 & 출처 리스트 구성
    # ------------------------------------------------
    context_parts: List[str] = []
    sources: List[Dict[str, Any]] = []

    for idx, r in enumerate(web_results):
        title = r.get("title") or "웹 검색 결과"
        url = r.get("url")
        snippet = r.get("snippet") or ""
        score = r.get("score")

        # LLM 컨텍스트용 텍스트
        context_parts.append(f"{title}\n{snippet}")

        # 출처용 메타데이터
        sources.append(
            {
                "id": r.get("id") or url or f"web_result_{idx}",
                "collection": "web",
                "title": title,
                "url": url,
                "score": float(score) if isinstance(score, (float, int)) else None,
            }
        )

    # 웹 결과가 하나도 없을 때 대비
    if context_parts:
        context_text = "\n\n---\n\n".join(context_parts)
    else:
        context_text = None

    # ------------------------------------------------
    # 3) LLM 호출
    # ------------------------------------------------
    if context_text:
        answer = call_llm(
            system_prompt=WEB_SYSTEM_PROMPT,
            user_message=user_message,
            context=context_text,
        )
    else:
        # 검색 결과가 없을 때의 fallback 답변
        answer = (
            "요청하신 내용에 대해 신뢰할 수 있는 웹 검색 결과를 찾지 못했습니다. "
            "질문을 조금 더 구체적으로 바꾸거나, 다른 표현으로 다시 물어봐 주세요."
        )

    # ------------------------------------------------
    # 4) state.messages 에 assistant 메시지 추가
    # ------------------------------------------------
    state["messages"].append(
        {
            "role": "assistant",
            "content": answer,
            "meta": {
                "agent": "web_agent",
                "result_count": len(web_results),
            },
        }
    )

    # ------------------------------------------------
    # 5) 최종 응답/출처 필드 채우기
    # ------------------------------------------------
    state["answer"] = answer
    # 검색 결과가 없으면 sources는 빈 리스트
    state["sources"] = sources if web_results else []

    return state
