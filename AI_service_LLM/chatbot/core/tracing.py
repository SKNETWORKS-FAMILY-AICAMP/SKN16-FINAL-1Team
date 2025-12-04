# AI_service_LLM/chatbot/core/tracing.py
from __future__ import annotations

import os
from typing import Any, Callable, TypeVar

T = TypeVar("T", bound=Callable[..., Any])

LANGSMITH_API_KEY = os.getenv("LANGSMITH_API_KEY")
LANGSMITH_PROJECT = os.getenv("LANGSMITH_PROJECT", "medinote-chatbot")

try:
    # 🔹 최신 버전 기준: Client, traceable 을 여기서 바로 import
    from langsmith import Client, traceable as _ls_traceable  # type: ignore

    # 🔹 Client 는 더 이상 project 인자를 받지 않음
    #     - 프로젝트 이름은 LANGSMITH_PROJECT 환경변수로 전달
    _client: Client | None = Client(
        api_key=LANGSMITH_API_KEY
    ) if LANGSMITH_API_KEY else None

    def get_langsmith_client() -> Client | None:
        """
        LangSmith Client 인스턴스를 반환.
        LANGSMITH_API_KEY 가 없으면 None.
        """
        return _client

    def traceable(_func: T | None = None, **kwargs: Any) -> T:
        """
        langsmith.traceable 을 그대로 래핑.

        사용 예:
            @traceable
            def my_fn(...):
                ...

            @traceable(name="my_span")
            def my_fn(...):
                ...
        """
        if _func is None:
            # @traceable(name="...") 같은 형태
            return _ls_traceable(**kwargs)  # type: ignore[return-value]
        # @traceable 바로 데코레이팅하는 형태
        return _ls_traceable(_func, **kwargs)  # type: ignore[return-value]

except Exception:
    # LangSmith 가 설치되어 있지 않거나, import 에러가 난 경우: no-op 버전

    def get_langsmith_client() -> None:
        """
        LangSmith 미사용 환경에서 항상 None 반환.
        """
        return None

    def traceable(_func: T | None = None, **kwargs: Any) -> T:
        """
        LangSmith 미사용 환경에서의 no-op decorator.

        LangSmith 가 없어도 기존 코드에서 @traceable 을 그대로 달아둘 수 있게 한다.
        """

        def decorator(func: T) -> T:
            return func

        if _func is None:
            # @traceable() 처럼 쓰인 경우
            return decorator  # type: ignore[return-value]
        # @traceable 바로 데코레이팅된 경우
        return _func
