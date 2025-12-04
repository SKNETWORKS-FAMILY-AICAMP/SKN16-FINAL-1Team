from fastapi import HTTPException
from utils.jwt_handler import decode_access_token

def extract_user_id(authorization: str | None):
    """Authorization 헤더에서 Bearer 토큰을 추출하고 user_id 반환"""

    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token format")

    token = authorization.replace("Bearer ", "")
    payload = decode_access_token(token)

    return payload.get("user_id")
