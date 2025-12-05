# AI_service_LLM/chatbot/core/retriever.py

from __future__ import annotations

import os
from functools import lru_cache
from typing import List, Dict, Any

import chromadb
from chromadb.api.models import Collection
from openai import OpenAI  # 🔹 임베딩용


# ============================================================
# 🔹 ENV / 기본 설정
# ============================================================

CHROMA_DB_DIR = os.getenv(
    "CHROMA_DB_DIR",
    r"C:\Users\playdata\Desktop\chroma_db",
)

# 컬렉션 이름들
CHROMA_DISEASE_COLLECTION = os.getenv("CHROMA_DISEASE_COLLECTION", "disease")
CHROMA_DRUG_COLLECTION = os.getenv("CHROMA_DRUG_COLLECTION", "drug")
CHROMA_INTERACTION_COLLECTION = os.getenv("CHROMA_INTERACTION_COLLECTION", "interaction")

# 🔹 컬렉션을 만들 때 사용한 임베딩 모델 (3072차원)
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-3-large")


# ============================================================
# 🔹 OpenAI 클라이언트 (임베딩용, 싱글톤)
# ============================================================

_openai_client: OpenAI | None = None


def get_openai_client() -> OpenAI:
    global _openai_client
    if _openai_client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY 환경변수가 설정되지 않았습니다.")
        _openai_client = OpenAI(api_key=api_key)
    return _openai_client


def embed_query(text: str) -> List[float]:
    """
    질의문을 text-embedding-3-large로 임베딩해 벡터를 반환.
    (컬렉션 생성 시 사용한 임베딩과 동일한 모델 사용)
    """
    client = get_openai_client()
    resp = client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=[text],
    )
    return resp.data[0].embedding


# ============================================================
# 🔹 Chroma Client (싱글톤)
# ============================================================

@lru_cache(maxsize=1)
def get_chroma_client() -> chromadb.ClientAPI:
    """
    Chroma PersistentClient 싱글톤.
    """
    return chromadb.PersistentClient(path=CHROMA_DB_DIR)


def _get_collection(name: str) -> Collection:
    client = get_chroma_client()
    return client.get_collection(name=name)


# ============================================================
# 🔹 단일 컬렉션 검색 함수
#   - text + detail_url 메타데이터까지 같이 반환
# ============================================================

def _query_collection(name: str, query: str, k: int) -> List[Dict[str, Any]]:
    """
    지정한 컬렉션에서 query 기준으로 상위 k개의 문서 텍스트와 메타데이터를 가져온다.

    반환 형태:
    [
        {
            "text": "문서 내용 ...",
            "detail_url": "https://...."  # 메타데이터에 detail_url 이 있으면
        },
        ...
    ]
    """
    if k <= 0:
        return []
    if not query.strip():
        return []

    try:
        col = _get_collection(name)
    except Exception as e:
        print(f"[retriever] ❌ ERROR: 컬렉션 '{name}' 불러오기 실패: {e}")
        return []

    # 1) 질의문 임베딩
    try:
        q_emb = embed_query(query)
    except Exception as e:
        print(f"[retriever] ❌ ERROR: 쿼리 임베딩 생성 실패: {e}")
        return []

    # 2) documents + metadatas 함께 조회
    try:
        res = col.query(
            query_embeddings=[q_emb],
            n_results=k,
            include=["documents", "metadatas"],
        )
        docs_list = res.get("documents", [[]])[0]
        metas_list = res.get("metadatas", [[]])[0]

        results: List[Dict[str, Any]] = []
        for doc, meta in zip(docs_list, metas_list):
            meta = meta or {}
            results.append(
                {
                    "text": doc,
                    "detail_url": meta.get("detail_url"),  # 🔥 여기서 끌어옴
                    # 필요하면 다른 메타필드도 추가 가능
                }
            )
        return results
    except Exception as e:
        print(f"[retriever] ❌ ERROR: 컬렉션 '{name}'에서 검색 중 오류: {e}")
        return []


# ============================================================
# 🔹 여러 컬렉션 검색 → 결과 병합
# ============================================================

def _merge_results(list_of_lists: List[List[Dict[str, Any]]], max_docs: int) -> List[Dict[str, Any]]:
    """
    여러 컬렉션에서 가져온 결과를:
      - text 기준으로 중복 제거
      - 순서 유지
      - 최대 max_docs 까지만 자르기
    """
    merged: List[Dict[str, Any]] = []
    seen_texts = set()

    for docs in list_of_lists:
        for item in docs:
            text = (item.get("text") or "").strip()
            if not text:
                continue
            if text in seen_texts:
                continue
            seen_texts.add(text)
            merged.append(item)
            if len(merged) >= max_docs:
                return merged

    return merged


# ============================================================
# 🔥 최종 검색 API: 에이전트(disease / drug)에서 호출
#   - 여기서 "pool size"만 결정하고, 실제 ranking은 reranker가 담당.
#   - 반환: {"text": ..., "detail_url": ...} 리스트
# ============================================================

def search_disease_docs(query: str, pool_size: int = 50) -> List[Dict[str, Any]]:
    """
    🔍 질병/증상/진료과/검사 관련 검색용 Retriever.

    - disease 컬렉션
    - interaction 컬렉션 (주의사항, 연관 정보 등)
    """
    disease_docs = _query_collection(CHROMA_DISEASE_COLLECTION, query, pool_size)
    interaction_docs = _query_collection(CHROMA_INTERACTION_COLLECTION, query, pool_size)

    pooled_docs = _merge_results(
        [disease_docs, interaction_docs],
        max_docs=pool_size,
    )
    return pooled_docs


def search_drug_docs(query: str, pool_size: int = 50) -> List[Dict[str, Any]]:
    """
    🔍 약/영양제/상호작용 관련 검색용 Retriever.

    - drug 컬렉션 (biologic, drug, otc, supplement 등)
    - interaction 컬렉션 (약물 상호작용)
    """
    drug_docs = _query_collection(CHROMA_DRUG_COLLECTION, query, pool_size)
    interaction_docs = _query_collection(CHROMA_INTERACTION_COLLECTION, query, pool_size)

    pooled_docs = _merge_results(
        [drug_docs, interaction_docs],
        max_docs=pool_size,
    )
    return pooled_docs
