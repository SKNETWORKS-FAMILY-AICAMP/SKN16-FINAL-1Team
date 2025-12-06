# routers/auth_router.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db

# CRUD 로직
from crud.auth_crud import (
    signup_user,
    login_user,
    refresh_access_token,
    delete_refresh_token,
)

# Schemas
from schemas.auth_schemas import (
    SignupRequest,
    SignupResponse,
    LoginRequest,
    LoginResponse,
    TokenRefreshRequest,
    TokenRefreshResponse,
    LogoutResponse,
)

router = APIRouter(prefix="/auth", tags=["auth"])


# ==============================
# 회원가입
# ==============================
@router.post("/signup", response_model=SignupResponse, status_code=201)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    return signup_user(db, payload)


# ==============================
# 로그인
# ==============================
@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    return login_user(db, payload)


# ==============================
# 토큰 재발급 (Refresh → Access)
# ==============================
@router.post("/token/refresh", response_model=TokenRefreshResponse)
def refresh_token(payload: TokenRefreshRequest, db: Session = Depends(get_db)):
    return refresh_access_token(db, payload.refresh_token)


# ==============================
# 로그아웃
# ==============================
@router.post("/logout", response_model=LogoutResponse)
def logout(payload: TokenRefreshRequest, db: Session = Depends(get_db)):
    # DB에서 refresh token 삭제
    delete_refresh_token(db, payload.refresh_token)
    return LogoutResponse(message="로그아웃 성공")
