# AI_service_LLM/chatbot/core/qscore.py

from __future__ import annotations

from typing import List, Any


def compute_qscore(docs: List[Any], query: str) -> float:
    """
    간단한 Q-score 계산 함수 (임시 버전).

    실제로는
    - 벡터 유사도 점수 (cosine)
    - 상위 문서들 간의 score margin
    - 검색된 문서 수, 토픽 커버리지
    등을 종합해서 계산하는 것이 좋다.

    여기서는:
    - 검색 결과가 없으면 0.0
    - 1개 이상 있으면 0.6 ~ 0.9 사이의 값으로 간단히 설정

    나중에 평가 파이프라인이 정리되면 이 부분만 교체하면 된다.
    """
    if not docs:
        return 0.0

    n = len(docs)
    if n == 1:
        return 0.6
    if n == 2:
        return 0.7
    if n == 3:
        return 0.8
    return 0.9
