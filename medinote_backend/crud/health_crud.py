from sqlalchemy.orm import Session
from models import HealthProfile
from schemas.health_schemas import HealthCreate, HealthUpdate


# =====================================================
# HealthProfile 생성
# - 이미 있는 경우 업데이트처럼 동작 (중복 방지)
# =====================================================
def create_health(db: Session, data: HealthCreate, user_id: int):
    # 기존 존재 여부 확인
    db_item = (
        db.query(HealthProfile)
        .filter(HealthProfile.user_id == user_id)
        .first()
    )

    if db_item:
        # 이미 존재 -> 업데이트처럼 동작
        update_data = data.dict(exclude_none=True)
        for field, value in update_data.items():
            setattr(db_item, field, value)
    else:
        # 존재하지 않으면 생성
        db_item = HealthProfile(**data.dict(), user_id=user_id)
        db.add(db_item)

    db.commit()
    db.refresh(db_item)
    return db_item


# =====================================================
# HealthProfile 조회
# - ⭐ 핵심: 없으면 자동 생성하여 null 반환 방지
# =====================================================
def get_health_by_user(db: Session, user_id: int):
    db_item = (
        db.query(HealthProfile)
        .filter(HealthProfile.user_id == user_id)
        .first()
    )

    if not db_item:
        # 👉 최초 접속 시 자동 생성 (프론트 null 에러 방지)
        db_item = HealthProfile(user_id=user_id)
        db.add(db_item)
        db.commit()
        db.refresh(db_item)

    return db_item


# =====================================================
# HealthProfile 업데이트
# - 없으면 자동 생성
# =====================================================
def update_health(db: Session, user_id: int, data: HealthUpdate):
    db_item = (
        db.query(HealthProfile)
        .filter(HealthProfile.user_id == user_id)
        .first()
    )

    update_data = data.dict(exclude_none=True)

    if not db_item:
        # 없으면 자동 생성 후 업데이트
        db_item = HealthProfile(**update_data, user_id=user_id)
        db.add(db_item)
    else:
        # 업데이트
        for field, value in update_data.items():
            setattr(db_item, field, value)

    db.commit()
    db.refresh(db_item)
    return db_item
