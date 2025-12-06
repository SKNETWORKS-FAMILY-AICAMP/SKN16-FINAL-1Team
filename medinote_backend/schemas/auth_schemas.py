# schemas/auth_schemas.py
from datetime import datetime
from pydantic import BaseModel, EmailStr


# =============================
# User 최소 정보 (로그인/회원가입에서 공통)
# =============================
class UserBase(BaseModel):
    id: int
    email: EmailStr
    name: str
    role: str

    class Config:
        orm_mode = True


# =============================
# 토큰 정보 (access + refresh)
# =============================
class AuthTokens(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: int = 3600


# =============================
# SIGNUP
# =============================
class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    auto_login: bool | None = False


class SignupResponse(BaseModel):
    user: UserBase
    tokens: AuthTokens
    created_at: datetime


# =============================
# LOGIN
# =============================
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    user: UserBase
    tokens: AuthTokens


# =============================
# TOKEN REFRESH
# =============================
class TokenRefreshRequest(BaseModel):
    refresh_token: str


class TokenRefreshResponse(BaseModel):
    access_token: str
    expires_in: int = 3600


# =============================
# LOGOUT
# =============================
class LogoutResponse(BaseModel):
    message: str
