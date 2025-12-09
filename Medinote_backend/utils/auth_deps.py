# utils/auth_deps.py
from fastapi import Header, HTTPException
from jose import JWTError
from utils.jwt_handler import decode_access_token

# ================================
# 인증 토글 스위치
# True  → 개발용 (FAKE_USER_ID)
# False → 실제 JWT 사용
# ================================
USE_FAKE_AUTH = False

FAKE_USER_ID = 1  # 개발용 고정 유저


def get_current_user_id(authorization: str = Header(None)) -> int:
    """
    공통으로 user_id를 얻는 함수.
    - 개발 중: FAKE_USER_ID 반환
    - 실서비스: JWT Access Token 검증 후 user_id 반환
    """
    # 1) 개발용: 무조건 user_id=1
    if USE_FAKE_AUTH:
        return FAKE_USER_ID

    # 2) 실서비스용: JWT 검증
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid Authorization header")

    token = authorization.replace("Bearer ", "").strip()

    try:
        payload = decode_access_token(token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = payload.get("user_id")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Token missing user_id")

    return user_id
