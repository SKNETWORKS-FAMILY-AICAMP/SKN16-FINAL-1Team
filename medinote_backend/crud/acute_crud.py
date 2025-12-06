from sqlalchemy.orm import Session
from models import AcuteDisease
from schemas.acute_schemas import AcuteCreate, AcuteUpdate


# ==========================
# Create
# ==========================
def create_acute(db: Session, payload: AcuteCreate):
    db_obj = AcuteDisease(
        disease_name=payload.disease_name,
        note=payload.note,
        user_id=payload.user_id
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


# ==========================
# Read by user
# ==========================
def get_acute_by_user(db: Session, user_id: int):
    return db.query(AcuteDisease).filter(AcuteDisease.user_id == user_id).all()


# ==========================
# Update (user validation 포함)
# ==========================
def update_acute(db: Session, acute_id: int, payload: AcuteUpdate, user_id: int):
    obj = db.query(AcuteDisease).filter(
        AcuteDisease.acute_id == acute_id,
        AcuteDisease.user_id == user_id
    ).first()

    if not obj:
        return None

    if payload.disease_name is not None:
        obj.disease_name = payload.disease_name

    if payload.note is not None:
        obj.note = payload.note

    db.commit()
    db.refresh(obj)
    return obj


# ==========================
# Delete (user validation 포함)
# ==========================
def delete_acute(db: Session, acute_id: int, user_id: int):
    obj = db.query(AcuteDisease).filter(
        AcuteDisease.acute_id == acute_id,
        AcuteDisease.user_id == user_id
    ).first()

    if not obj:
        return None

    db.delete(obj)
    db.commit()
    return True
