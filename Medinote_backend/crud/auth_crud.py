# crud/auth_crud.py
from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime, timedelta

from models import User, RefreshToken
from utils.password import hash_password, verify_password
from utils.jwt_handler import (
    create_access_token,
    create_refresh_token,
)
from schemas.auth_schemas import SignupRequest, LoginRequest


# ====================================
# Refresh Token 저장
# ====================================
def save_refresh_token(db: Session, user_id: int, token: str, expires_at: datetime):
    refresh = RefreshToken(
        user_id=user_id,
        token=token,
        expires_at=expires_at
    )
    db.add(refresh)
    db.commit()
    db.refresh(refresh)
    return refresh


# ====================================
# Refresh Token 삭제 (로그아웃)
# ====================================
def delete_refresh_token(db: Session, token: str):
    db.query(RefreshToken).filter(RefreshToken.token == token).delete()
    db.commit()


# ====================================
# Refresh Token → Access Token 재발급
# ====================================
def refresh_access_token(db: Session, refresh_token: str):
    db_token = db.query(RefreshToken).filter(
        RefreshToken.token == refresh_token
    ).first()

    if not db_token:
        raise HTTPException(status_code=401, detail="유효하지 않은 refresh token 입니다.")

    # 새 access token 발급
    new_access_token = create_access_token(int(db_token.user_id))

    return {
        "access_token": new_access_token,
        "expires_in": 3600
    }


# ====================================
# 회원가입
# ====================================
def signup_user(db: Session, payload: SignupRequest):
    # 이메일 중복 검사
    exists = db.query(User).filter(User.email == payload.email).first()
    if exists:
        raise HTTPException(status_code=400, detail="이미 가입된 이메일입니다.")

    # 비밀번호 해싱
    hashed_pw = hash_password(payload.password)

    # 유저 생성
    new_user = User(
        email=payload.email,
        password=hashed_pw,
        name=payload.name,
        role="user",
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Access / Refresh Token 생성
    access_token = create_access_token(new_user.user_id)
    refresh_token = create_refresh_token(new_user.user_id)

    # RefreshToken DB 저장
    expires_at = datetime.utcnow() + timedelta(days=7)
    save_refresh_token(db, new_user.user_id, refresh_token, expires_at)

    return {
        "user": {
            "id": new_user.user_id,
            "email": new_user.email,
            "name": new_user.name,
            "role": new_user.role,
        },
        "tokens": {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "Bearer",
            "expires_in": 3600,
        },
        "created_at": new_user.created_at,
    }


# ====================================
# 로그인
# ====================================
def login_user(db: Session, payload: LoginRequest):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=400, detail="존재하지 않는 이메일입니다.")

    # 비밀번호 체크
    if not verify_password(payload.password, user.password):
        raise HTTPException(status_code=400, detail="비밀번호가 일치하지 않습니다.")

    # 토큰 발급
    access_token = create_access_token(user.user_id)
    refresh_token = create_refresh_token(user.user_id)

    # RefreshToken DB 저장
    expires_at = datetime.utcnow() + timedelta(days=7)
    save_refresh_token(db, user.user_id, refresh_token, expires_at)

    return {
        "user": {
            "id": user.user_id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
        },
        "tokens": {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "Bearer",
            "expires_in": 3600,
        }
    }
