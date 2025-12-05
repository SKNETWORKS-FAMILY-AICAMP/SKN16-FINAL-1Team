# AI_service_LLM/chatbot/core/web_search.py

from __future__ import annotations
from typing import List, Dict, Any

from .tavily_client import _get_client


def search_web(query: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """
    Tavily에서 웹 검색을 수행하고,
    웹 agent가 사용할 수 있도록 title/url/snippet/score 메타데이터까지 포함한 리스트로 변환
    """
    client = _get_client()
    if client is None:
        return []   # 검색 불가 → 빈 결과

    resp = client.search(
        query=query,
        search_depth="basic",
        max_results=top_k,
    )

    results: List[Dict[str, Any]] = []
    for item in resp.get("results", []):
        title = item.get("title") or ""
        url = item.get("url")
        snippet = item.get("content") or ""        # tavily는 content를 줌
        score = item.get("score")                  # score가 있으면 사용

        results.append(
            {
                "id": url or None,
                "title": title[:100],
                "url": url,
                "snippet": snippet[:500],          # 너무 길어지지 않게
                "score": score,
            }
        )

    return results
