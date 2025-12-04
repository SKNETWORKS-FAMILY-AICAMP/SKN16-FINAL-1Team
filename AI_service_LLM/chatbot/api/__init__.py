# AI_service_LLM/chatbot/api/__init__.py

"""
chatbot.api 패키지

FastAPI 메인 앱에서 사용할 라우터(router)를 외부로 노출한다.

예:
    from chatbot.api import router
    app.include_router(router)
"""

from .router import router

__all__ = ["router"]
