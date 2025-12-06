from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from crud import user_crud
from schemas.user_schemas import (
    UserCreate, UserOut, UserUpdate, PasswordUpdate
)

router = APIRouter(tags=["Users"])

# =====================================================
#  인증 스위치 (C1)
# =====================================================
USE_FAKE_AUTH = True
FAKE_USER_ID = 1


def get_current_user_id():
    if USE_FAKE_AUTH:
        return FAKE_USER_ID
    # 나중에 JWT 연동할 때 이 부분만 바꾸면 됨
    # return extract_user_id_from_jwt()
    raise NotImplementedError


# =====================================================
#  📌 /users (회원가입 & 전체 조회)
# =====================================================
@router.post("/users", response_model=UserOut)
def create_user_api(payload: UserCreate, db: Session = Depends(get_db)):
    return user_crud.create_user(db, payload)


@router.get("/users", response_model=list[UserOut])
def read_users(db: Session = Depends(get_db)):
    return user_crud.get_users(db)


# =====================================================
#  📌 /user/me (로그인 후 본인 계정 관리)
# =====================================================
@router.get("/user/me", response_model=UserOut)
def get_my_profile(db: Session = Depends(get_db)):
    user_id = get_current_user_id()
    return user_crud.get_user_by_id(db, user_id)


@router.patch("/user/me", response_model=UserOut)
def update_my_profile(payload: UserUpdate, db: Session = Depends(get_db)):
    user_id = get_current_user_id()
    return user_crud.update_user_profile(db, user_id, payload)


@router.patch("/user/me/password")
def change_my_password(payload: PasswordUpdate, db: Session = Depends(get_db)):
    user_id = get_current_user_id()
    return user_crud.change_user_password(db, user_id, payload)


@router.delete("/user/me")
def delete_my_account(db: Session = Depends(get_db)):
    user_id = get_current_user_id()
    return user_crud.delete_user(db, user_id)
