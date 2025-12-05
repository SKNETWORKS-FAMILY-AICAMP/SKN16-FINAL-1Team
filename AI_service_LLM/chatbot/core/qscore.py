# AI_service_LLM/chatbot/core/qscore.py

from __future__ import annotations

from typing import List, Dict, Any


def compute_qscore(ranked_docs: List[Dict[str, Any]], query: str = "") -> float:
    """
    Cohere rerank 결과 기반 Q-score 계산함수.

    ranked_docs 구조 예:
    [
      {"text": "...", "score": 0.91, "index": 3},
      {"text": "...", "score": 0.87, "index": 0},
      ...
    ]

    계산 방법:
      - score=None 문서는 제외
      - 상위 3개 문서의 평균 사용
    """
    if not ranked_docs:
        return 0.0

    # score가 있는 문서만 추림
    scores = [d.get("score") for d in ranked_docs if isinstance(d.get("score"), (int, float))]
    if not scores:
        return 0.0

    # 상위 3개 평균 점수
    top_scores = scores[:3]
    avg_score = sum(top_scores) / len(top_scores)

    # avg_score(0~1)를 그대로 Q-score로 사용
    q = float(avg_score)

    # 안전한 범위로 clip
    if q < 0:
        q = 0.0
    if q > 1:
        q = 1.0

    return q
