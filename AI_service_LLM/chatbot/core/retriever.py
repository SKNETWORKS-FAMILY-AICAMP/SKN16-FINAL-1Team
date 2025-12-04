# AI_service_LLM/chatbot/core/retriever.py

from __future__ import annotations

import os
from functools import lru_cache
from typing import List

import chromadb
from chromadb.api.models import Collection


# ============================================================
# 🔹 ENV / 기본 설정
# ============================================================

CHROMA_DB_DIR = os.getenv(
    "CHROMA_DB_DIR",
    r"C:\Users\playdata\Desktop\chroma_db"
)

# 최종 컬렉션 이름 (3개)
CHROMA_DISEASE_COLLECTION = os.getenv("CHROMA_DISEASE_COLLECTION", "disease")
CHROMA_DRUG_COLLECTION = os.getenv("CHROMA_DRUG_COLLECTION", "drug")
CHROMA_INTERACTION_COLLECTION = os.getenv("CHROMA_INTERACTION_COLLECTION", "interaction")


# ============================================================
# 🔹 Chroma Client (싱글톤)
# ============================================================

@lru_cache(maxsize=1)
def get_chroma_client() -> chromadb.ClientAPI:
    return chromadb.PersistentClient(path=CHROMA_DB_DIR)


def _get_collection(name: str) -> Collection:
    client = get_chroma_client()
    return client.get_collection(name=name)


# ============================================================
# 🔹 단일 컬렉션 검색 함수
# ============================================================

def _query_collection(name: str, query: str, k: int) -> List[str]:
    try:
        col = _get_collection(name)
    except Exception as e:
        print(f"[retriever] ❌ ERROR: 컬렉션 '{name}' 불러오기 실패: {e}")
        return []

    try:
        res = col.query(query_texts=[query], n_results=k)
        docs = res.get("documents", [[]])[0]
        return docs
    except Exception as e:
        print(f"[retriever] ❌ ERROR: 컬렉션 '{name}'에서 검색 중 오류: {e}")
        return []


# ============================================================
# 🔹 여러 컬렉션 검색 → 결과 병합
# ============================================================

def _merge_results(list_of_lists: List[List[str]], max_docs: int) -> List[str]:
    """중복 제거 + 순서 유지 + 최대 max_docs 반환."""
    merged = []
    seen = set()

    for docs in list_of_lists:
        for d in docs:
            if d in seen:
                continue
            seen.add(d)
            merged.append(d)
            if len(merged) >= max_docs:
                return merged

    return merged


# ============================================================
# 🔥 최종 검색 API: 에이전트에서 호출
# ============================================================

def search_disease_docs(query: str, k: int = 5) -> List[str]:
    """
    🔍 질병 관련 검색 수행:
        1) disease 컬렉션
        2) interaction 컬렉션 (주의사항, 증상 연관 등)

    → 두 결과를 합쳐서 k개 반환
    """
    disease_docs = _query_collection(CHROMA_DISEASE_COLLECTION, query, k)
    interaction_docs = _query_collection(CHROMA_INTERACTION_COLLECTION, query, k)

    return _merge_results([disease_docs, interaction_docs], max_docs=k)


def search_drug_docs(query: str, k: int = 8) -> List[str]:
    """
    🔍 약 관련 검색 수행:
        1) drug 컬렉션 (biologic, drug, otc, supplement 모두 포함)
        2) interaction 컬렉션 (약물 상호작용)

    → 두 결과를 합쳐서 k개 반환
    """
    drug_docs = _query_collection(CHROMA_DRUG_COLLECTION, query, k)
    interaction_docs = _query_collection(CHROMA_INTERACTION_COLLECTION, query, k)

    return _merge_results([drug_docs, interaction_docs], max_docs=k)
