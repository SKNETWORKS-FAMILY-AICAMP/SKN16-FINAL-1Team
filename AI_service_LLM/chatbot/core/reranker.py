# AI_service_LLM/chatbot/core/reranker.py

from __future__ import annotations

import os
from typing import List, Dict, Any, Optional
from functools import lru_cache

try:
    import cohere  # pip install cohere
except ImportError:  # 코히어 SDK가 없으면 None 처리
    cohere = None  # type: ignore[assignment]


COHERE_API_KEY = os.getenv("COHERE_API_KEY")
# 🔹 기본값을 다국어 모델로 (한국어 포함)
COHERE_RERANK_MODEL = os.getenv("COHERE_RERANK_MODEL", "rerank-multilingual-v3.0")


@lru_cache(maxsize=1)
def _get_client() -> Optional["cohere.Client"]:
    """
    Cohere 클라이언트 싱글톤.
    - COHERE_API_KEY 가 없거나 cohere 패키지가 없으면 None 반환.
    """
    if cohere is None:
        print("[reranker] ⚠ cohere 패키지가 설치되어 있지 않습니다. (pip install cohere)")
        return None
    if not COHERE_API_KEY:
        print("[reranker] ⚠ COHERE_API_KEY 환경변수가 설정되어 있지 않습니다.")
        return None
    return cohere.Client(api_key=COHERE_API_KEY)


def rerank(
    query: str,
    docs: List[str],
    top_k: int = 5,
) -> List[Dict[str, Any]]:
    """
    Cohere Rerank API를 사용해 documents 를 query와의 관련도 순으로 재정렬.

    ⚙ 사용 패턴 (권장):
      - retriever 에서 pool_size=50 정도로 넉넉하게 문서를 가져오고
      - rerank(query, docs, top_k=5) 로 상위 5개만 선택해서 context로 사용

    Parameters
    ----------
    query : str
        사용자 질문 텍스트
    docs : List[str]
        초기 retriever (Chroma 등)에서 가져온 문서 텍스트 리스트
    top_k : int
        상위 몇 개까지만 반환할지 (기본값 5)

    Returns
    -------
    List[Dict[str, Any]]
        예시:
        [
          {"text": "...", "score": 0.91, "index": 3},
          {"text": "...", "score": 0.87, "index": 0},
          ...
        ]

        - text  : 원문 문서 텍스트
        - score : Cohere rerank 점수 (float)
        - index : 원래 docs 리스트에서의 인덱스
    """
    if not docs:
        return []

    client = _get_client()
    if client is None:
        # 클라이언트 사용 불가한 경우 → 점수 없이 원본 순서 그대로 반환
        print("[reranker] ⚠ Cohere 클라이언트 없음. 원본 순서로 반환합니다.")
        return [
            {"text": d, "score": None, "index": i}
            for i, d in enumerate(docs[:top_k])
        ]

    try:
        # Cohere Rerank 호출
        response = client.rerank(
            model=COHERE_RERANK_MODEL,
            query=query,
            documents=docs,
            top_n=min(top_k, len(docs)),  # 🔹 여기서 상위 top_k만 받아옴
        )
    except Exception as e:
        print(f"[reranker] ❌ Cohere rerank 호출 중 오류: {e}")
        # 실패 시에도 서비스 전체가 죽지 않도록, 원본 순서 그대로 반환
        return [
            {"text": d, "score": None, "index": i}
            for i, d in enumerate(docs[:top_k])
        ]

    results: List[Dict[str, Any]] = []
    for r in response.results:
        # cohere.responses.rerank.RerankDocument 와 유사한 구조를 가정
        idx = getattr(r, "index", None)
        score = getattr(r, "relevance_score", None)
        text = docs[idx] if idx is not None and 0 <= idx < len(docs) else None
        if text is None:
            continue

        results.append(
            {
                "text": text,
                "score": float(score) if isinstance(score, (float, int)) else None,
                "index": idx,
            }
        )

    return results
