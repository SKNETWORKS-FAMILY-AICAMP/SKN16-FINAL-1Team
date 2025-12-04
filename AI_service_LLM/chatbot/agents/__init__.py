# AI_service_LLM/chatbot/agents/__init__.py

"""
각 도메인 에이전트의 run 함수를 한 곳에서 import 해서
graph.py에서 쉽게 사용할 수 있도록 정리하는 모듈.
"""

from .chit_agent import run as chit_agent_run
from .db_agent import run as db_agent_run
from .disease_agent import run as disease_agent_run
from .drug_agent import run as drug_agent_run
from .history_agent import run as history_agent_run
from .web_agent import run as web_agent_run

__all__ = [
    "chit_agent_run",
    "db_agent_run",
    "disease_agent_run",
    "drug_agent_run",
    "history_agent_run",
    "web_agent_run",
]
