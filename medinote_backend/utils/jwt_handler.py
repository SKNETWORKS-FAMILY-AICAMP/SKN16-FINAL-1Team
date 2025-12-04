# utils/jwt_handler.py
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
from jose import JWTError, jwt


# ⚠️ 실제 서비스에서는 환경 변수로 분리하기 (.env)
ACCESS_SECRET_KEY = "CHANGE_ME_ACCESS_SECRET"
REFRESH_SECRET_KEY = "CHANGE_ME_REFRESH_SECRET"
ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_DAYS = 7


# ---------------------------
# 공통: UTC now
# ---------------------------
def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------
# Access Token 생성
# ---------------------------
def create_access_token(
    user_id: int,
    expires_delta: Optional[timedelta] = None
) -> str:
    expire = _utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))

    to_encode = {
        "sub": str(user_id),        # 표준 claim (subject)
        "user_id": user_id,         # ⭐ 핵심: 직접 사용하기 위해 추가
        "type": "access",
        "iat": _utcnow(),
        "exp": expire
    }

    encoded_jwt = jwt.encode(
        to_encode,
        ACCESS_SECRET_KEY,
        algorithm=ALGORITHM,
    )
    return encoded_jwt


# ---------------------------
# Refresh Token 생성
# ---------------------------
def create_refresh_token(
    user_id: int,
    expires_delta: Optional[timedelta] = None
) -> str:
    expire = _utcnow() + (expires_delta or timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))

    to_encode = {
        "sub": str(user_id),
        "user_id": user_id,         # ⭐ refresh에도 넣어야 재발급 시 문제 없음
        "type": "refresh",
        "iat": _utcnow(),
        "exp": expire
    }

    encoded_jwt = jwt.encode(
        to_encode,
        REFRESH_SECRET_KEY,
        algorithm=ALGORITHM,
    )
    return encoded_jwt


# ---------------------------
# Access Token 검증
# ---------------------------
def decode_access_token(token: str) -> Dict[str, Any]:
    try:
        payload = jwt.decode(
            token,
            ACCESS_SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        # access token이 맞는지 확인
        if payload.get("type") != "access":
            raise JWTError("Invalid token type")

        # user_id 없는 경우 → 명확한 에러 메시지
        if "user_id" not in payload:
            raise JWTError("Token missing user_id")

        return payload

    except JWTError as e:
        raise e


# ---------------------------
# Refresh Token 검증
# ---------------------------
def decode_refresh_token(token: str) -> Dict[str, Any]:
    try:
        payload = jwt.decode(
            token,
            REFRESH_SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        if payload.get("type") != "refresh":
            raise JWTError("Invalid token type")

        if "user_id" not in payload:
            raise JWTError("Token missing user_id")

        return payload

    except JWTError as e:
        raise e


# ---------------------------
# FastAPI Depend (선택적 사용)
# ---------------------------
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    FastAPI Dependency 예시
    (원하면 health_router 등에서 바로 Depends로 사용 가능)
    """
    try:
        payload = decode_access_token(token)   # ⭐ 통일
        user_id = payload.get("user_id")

        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")

        return {"user_id": user_id}

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
