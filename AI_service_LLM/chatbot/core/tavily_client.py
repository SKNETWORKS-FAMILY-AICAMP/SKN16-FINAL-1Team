# AI_service_LLM/chatbot/core/tavily_client.py

from __future__ import annotations

import os
from typing import List

try:
    from tavily import TavilyClient  # pip install tavily-python
except ImportError:  # 패키지가 없다면 Optional
    TavilyClient = None  # type: ignore[assignment]


_TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")


def _get_client() -> "TavilyClient | None":
    if TavilyClient is None or not _TAVILY_API_KEY:
        return None
    return TavilyClient(api_key=_TAVILY_API_KEY)


def tavily_search(query: str, max_results: int = 5) -> List[str]:
    """
    Tavily 웹 검색 래퍼.

    - Tavily 패키지나 API 키가 없으면, 빈 리스트를 반환한다.
    - 반환 값은 "문서 텍스트" 리스트이며, RAG 컨텍스트로 바로 사용할 수 있다.
    """
    client = _get_client()
    if client is None:
        # 웹 검색을 사용할 수 없는 환경이면 그냥 빈 리스트.
        return []

    resp = client.search(
        query=query,
        search_depth="basic",
        max_results=max_results,
    )

    # resp["results"] 안에 {title, url, content...} 구조가 들어온다고 가정
    docs: List[str] = []
    for item in resp.get("results", []):
        content = item.get("content") or ""
        if content:
            docs.append(content)

    return docs
