from sqlalchemy.orm import Session
from models import User
from schemas.user_schemas import UserCreate, UserUpdate, PasswordUpdate
from fastapi import HTTPException
from utils.password import verify_password, hash_password


def create_user(db: Session, payload: UserCreate):
    user = User(
        email=payload.email,
        password=hash_password(payload.password),
        name=payload.name,
        role=payload.role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_users(db: Session):
    return db.query(User).all()


def get_user_by_id(db: Session, user_id: int):
    return db.query(User).filter(User.user_id == user_id).first()


def update_user_profile(db: Session, user_id: int, payload: UserUpdate):
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(404, "User not found")

    update_data = payload.dict(exclude_none=True)
    for k, v in update_data.items():
        setattr(user, k, v)

    db.commit()
    db.refresh(user)
    return user


def change_user_password(db: Session, user_id: int, payload: PasswordUpdate):
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(payload.current_password, user.password):
        raise HTTPException(400, "Current password incorrect")

    user.password = hash_password(payload.new_password)
    db.commit()
    db.refresh(user)
    return {"message": "Password updated successfully"}


def delete_user(db: Session, user_id: int):
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(404, "User not found")

    db.delete(user)
    db.commit()
    return {"message": "User deleted"}
