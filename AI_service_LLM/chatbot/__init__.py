# AI_service_LLM/chatbot/__init__.py

"""
MediNote Chatbot 패키지 엔트리 포인트.

FastAPI 쪽에서:

    from chatbot import chatbot_graph

처럼 불러서 사용하도록 graph 객체를 export 한다.
"""

from .graph import chatbot_graph

__all__ = ["chatbot_graph"]
