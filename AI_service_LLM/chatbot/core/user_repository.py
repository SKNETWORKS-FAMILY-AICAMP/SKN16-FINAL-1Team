# AI_service_LLM/chatbot/core/user_repository.py

from __future__ import annotations

from typing import Any, Dict, List, Optional
import os
import requests

# .env 로드 (AI_service_LLM 폴더에 .env 있어야 함)
try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    # python-dotenv 없거나 해도 치명적이진 않으니 무시
    pass

# 📌 백엔드 Base URL (Medinote_backend)
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000").rstrip("/")


def _get(path: str) -> Any:
    """
    간단한 GET 래퍼.
    나중에 여기서 Authorization 헤더(JWT)도 같이 넣으면 됨.
    path 는 "/health" 처럼 상대 경로이거나,
    "http://..." 로 시작하는 절대 URL 둘 다 허용.
    """
    # 절대 URL vs 상대 경로 처리
    if path.startswith("http://") or path.startswith("https://"):
        full_url = path
    else:
        if not path.startswith("/"):
            path = "/" + path
        full_url = BACKEND_URL + path

    try:
        # 필요하면 여기서 토큰 붙이면 됨
        # headers = {"Authorization": f"Bearer {token}"} 이런 식으로
        print(f"[USER_REPOSITORY] GET {full_url}")
        resp = requests.get(full_url, timeout=5)
        print(f"[USER_REPOSITORY] -> status {resp.status_code}")
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        # 디버깅용 로그
        print(f"[USER_REPOSITORY] ERROR GET {full_url}: {e}")
        return None


# =========================================
# ① 건강 프로필 /health
# =========================================
def get_user_profile(user_id: int | str | None = None) -> Optional[Dict[str, Any]]:
    """
    현재 백엔드는 JWT로 user_id를 구하므로
    여기서는 user_id를 실제로 쓰지 않음.
    """
    data = _get("/health")
    if isinstance(data, dict):
        return data
    return None


# =========================================
# ② 알레르기 /health/allergy
# =========================================
def get_allergies(user_id: int | str | None = None) -> List[Dict[str, Any]]:
    data = _get("/health/allergy")
    if isinstance(data, list):
        return data
    return []


# =========================================
# ③ 만성 질환 /health/chronic
# =========================================
def get_chronic_diseases(user_id: int | str | None = None) -> List[Dict[str, Any]]:
    data = _get("/health/chronic")
    if isinstance(data, list):
        return data
    return []


# =========================================
# ④ 급성 질환 /health/acute
# =========================================
def get_acute_diseases(user_id: int | str | None = None) -> List[Dict[str, Any]]:
    data = _get("/health/acute")
    if isinstance(data, list):
        return data
    return []


# =========================================
# ⑤ 약 목록 /drug
# =========================================
def get_drugs(user_id: int | str | None = None) -> List[Dict[str, Any]]:
    data = _get("/drug")
    if isinstance(data, list):
        return data
    return []


# =========================================
# ⑥ 처방전 /prescription
# =========================================
def get_prescriptions(user_id: int | str | None = None) -> List[Dict[str, Any]]:
    data = _get("/prescription")
    if isinstance(data, list):
        return data
    return []


# =========================================
# ⑦ 진료 기록 /visits
# =========================================
def get_visits(user_id: int | str | None = None) -> List[Dict[str, Any]]:
    data = _get("/visits")
    if isinstance(data, list):
        return data
    return []
