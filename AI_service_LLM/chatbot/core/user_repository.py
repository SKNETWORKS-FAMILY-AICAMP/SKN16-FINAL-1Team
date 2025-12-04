# AI_service_LLM/chatbot/core/user_repository.py

from __future__ import annotations

from typing import Any, Dict, List, Optional
import os
import requests

# 📌 백엔드 Base URL (Medinote_backend)
# 예: http://localhost:8000  또는  http://backend:8000
BACKEND_BASE_URL = os.getenv("BACKEND_BASE_URL", "http://localhost:8000")


def _get(url: str) -> Any:
    """
    간단한 GET 래퍼.
    나중에 여기서 Authorization 헤더(JWT)도 같이 넣으면 됨.
    """
    resp = requests.get(url, timeout=5)
    resp.raise_for_status()
    return resp.json()


# =========================================
# ① 건강 프로필 /health
# =========================================
def get_user_profile(user_id: int | str | None = None) -> Optional[Dict[str, Any]]:
    """
    현재 백엔드는 JWT로 user_id를 구하므로
    여기서는 user_id를 실제로 쓰지 않음.
    """
    url = f"{BACKEND_BASE_URL}/health"
    try:
        data = _get(url)
        return data
    except Exception:
        return None


# =========================================
# ② 알레르기 /health/allergy
# =========================================
def get_allergies(user_id: int | str | None = None) -> List[Dict[str, Any]]:
    url = f"{BACKEND_BASE_URL}/health/allergy"
    try:
        data = _get(url)
        if isinstance(data, list):
            return data
        return []
    except Exception:
        return []


# =========================================
# ③ 만성 질환 /health/chronic
# =========================================
def get_chronic_diseases(user_id: int | str | None = None) -> List[Dict[str, Any]]:
    url = f"{BACKEND_BASE_URL}/health/chronic"
    try:
        data = _get(url)
        if isinstance(data, list):
            return data
        return []
    except Exception:
        return []


# =========================================
# ④ 급성 질환 /health/acute
# =========================================
def get_acute_diseases(user_id: int | str | None = None) -> List[Dict[str, Any]]:
    url = f"{BACKEND_BASE_URL}/health/acute"
    try:
        data = _get(url)
        if isinstance(data, list):
            return data
        return []
    except Exception:
        return []


# =========================================
# ⑤ 약 목록 /drug
# =========================================
def get_drugs(user_id: int | str | None = None) -> List[Dict[str, Any]]:
    url = f"{BACKEND_BASE_URL}/drug"
    try:
        data = _get(url)
        if isinstance(data, list):
            return data
        return []
    except Exception:
        return []


# =========================================
# ⑥ 처방전 /prescription
# =========================================
def get_prescriptions(user_id: int | str | None = None) -> List[Dict[str, Any]]:
    url = f"{BACKEND_BASE_URL}/prescription"
    try:
        data = _get(url)
        if isinstance(data, list):
            return data
        return []
    except Exception:
        return []


# =========================================
# ⑦ 진료 기록 /visits
# =========================================
def get_visits(user_id: int | str | None = None) -> List[Dict[str, Any]]:
    url = f"{BACKEND_BASE_URL}/visits"
    try:
        data = _get(url)
        if isinstance(data, list):
            return data
        return []
    except Exception:
        return []
