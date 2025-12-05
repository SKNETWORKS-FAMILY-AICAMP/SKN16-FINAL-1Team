# AI_service_LLM/chatbot/agents/disease_agent.py

from __future__ import annotations

from typing import List, Dict, Any

from ..core.state import ChatState
from ..core.tracing import traceable
from ..core.prompts import DISEASE_SYSTEM_PROMPT
from ..core.retriever import search_disease_docs      # Chroma 기반 질병/interaction 컬렉션 pool
from ..core.reranker import rerank                    # Cohere Rerank
from ..core.qscore import compute_qscore              # rerank 결과 기반 Q-score
from ..core.llm import call_llm
from ..core.web_search import search_web              # Tavily 기반 웹 검색

LOW_THRESHOLD = 0.4
MID_THRESHOLD = 0.6
WEB_FALLBACK_THRESHOLD = 0.15  # 🔥 정말 망했을 때만 웹 검색 사용 (원하면 튜닝)


@traceable(name="disease_agent")
def run(state: ChatState) -> ChatState:
    user_message = state["messages"][-1]["content"]

    # ------------------------------------------------
    # 1) Retriever: 질병/interaction 컬렉션에서 문서 pool 생성
    #    docs_pool: [{"text": ..., "detail_url": ...}, ...]
    # ------------------------------------------------
    docs_pool: List[Dict[str, Any]] = search_disease_docs(user_message, pool_size=50)

    context_parts: List[str] = []
    sources: List[Dict[str, Any]] = []
    used_web = False

    # 로컬 RAG 문서가 하나도 없을 때 → q_score=0.0, 웹 검색만 시도
    if not docs_pool:
        q_score = 0.0
        reliability_level = "low"

        web_results = search_web(user_message, top_k=3)
        if web_results:
            used_web = True
            for r in web_results:
                title = r.get("title") or "웹 검색 결과"
                snippet = r.get("snippet") or ""
                url = r.get("url")
                score = r.get("score")

                if title or snippet:
                    context_parts.append(f"{title}\n{snippet}")

                sources.append(
                    {
                        "id": r.get("id") or url or "web_result",
                        "collection": "web",
                        "title": title,
                        "url": url,
                        "score": float(score) if isinstance(score, (int, float)) else None,
                    }
                )

        context_text = "\n\n---\n\n".join(context_parts) if context_parts else None

        system_prompt = DISEASE_SYSTEM_PROMPT.format(
            q_score=q_score,
            reliability_level=reliability_level,
        )

        answer = call_llm(
            system_prompt=system_prompt,
            user_message=user_message,
            context=context_text,
        )

        state["messages"].append(
            {
                "role": "assistant",
                "content": answer,
                "meta": {
                    "agent": "disease_agent",
                    "q_score": q_score,
                    "reliability_level": reliability_level,
                    "used_web": used_web,
                    "used_rag": False,
                },
            }
        )

        state["answer"] = answer
        state["sources"] = sources
        return state

    # ------------------------------------------------
    # 2) Reranker: Cohere로 상위 문서 재정렬 (top_k=5)
    #    - rerank에는 text만 전달
    # ------------------------------------------------
    texts = [d["text"] for d in docs_pool]
    text2meta: Dict[str, Dict[str, Any]] = {d["text"]: d for d in docs_pool}

    ranked: List[Dict[str, Any]] = rerank(
        query=user_message,
        docs=texts,
        top_k=5,
    )

    # 3) Q-score 계산 (rerank 결과 기반)
    q_score = compute_qscore(ranked, query=user_message)

    if q_score < LOW_THRESHOLD:
        reliability_level = "low"
    elif q_score < MID_THRESHOLD:
        reliability_level = "medium"
    else:
        reliability_level = "high"

    # 4) 로컬 RAG 상위 문서 → 컨텍스트 + 출처
    for idx, r in enumerate(ranked):
        text: str = r.get("text", "") or ""
        score = r.get("score")
        if not text:
            continue

        meta = text2meta.get(text, {})
        detail_url = meta.get("detail_url")

        context_parts.append(text)
        first_line = text.strip().split("\n", 1)[0][:60]

        sources.append(
            {
                "id": f"disease_doc_{idx}",
                "collection": "disease",
                "title": first_line or "질병 정보 문서",
                "url": detail_url,  # 🔥 여기서 detail_url을 연결
                "score": float(score) if isinstance(score, (int, float)) else None,
            }
        )

    # ------------------------------------------------
    # 5) q_score 가 아주 낮을 때만 웹 검색도 함께 활용
    # ------------------------------------------------
    if q_score < WEB_FALLBACK_THRESHOLD:
        web_results = search_web(user_message, top_k=3)
        if web_results:
            used_web = True
            for r in web_results:
                title = r.get("title") or "웹 검색 결과"
                snippet = r.get("snippet") or ""
                url = r.get("url")
                score = r.get("score")

                if title or snippet:
                    context_parts.append(f"{title}\n{snippet}")

                sources.append(
                    {
                        "id": r.get("id") or url or "web_result",
                        "collection": "web",
                        "title": title,
                        "url": url,
                        "score": float(score) if isinstance(score, (int, float)) else None,
                    }
                )

    # ------------------------------------------------
    # 6) 최종 컨텍스트 문자열 구성
    # ------------------------------------------------
    context_text = "\n\n---\n\n".join(context_parts) if context_parts else None

    # ------------------------------------------------
    # 7) LLM 호출
    # ------------------------------------------------
    system_prompt = DISEASE_SYSTEM_PROMPT.format(
        q_score=q_score,
        reliability_level=reliability_level,
    )

    answer = call_llm(
        system_prompt=system_prompt,
        user_message=user_message,
        context=context_text,
    )

    # ------------------------------------------------
    # 8) state 저장
    # ------------------------------------------------
    state["messages"].append(
        {
            "role": "assistant",
            "content": answer,
            "meta": {
                "agent": "disease_agent",
                "q_score": q_score,
                "reliability_level": reliability_level,
                "used_web": used_web,
                "used_rag": True,
                "doc_count": len(ranked),
            },
        }
    )

    state["answer"] = answer
    state["sources"] = sources

    return state
