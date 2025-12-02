from sqlalchemy.orm import Session
from models import ChronicDisease
from schemas.chronic_schemas import ChronicCreate, ChronicUpdate


# ==========================
# Create
# ==========================
def create_chronic(db: Session, payload: ChronicCreate):
    db_obj = ChronicDisease(
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
def get_chronic_by_user(db: Session, user_id: int):
    return db.query(ChronicDisease).filter(ChronicDisease.user_id == user_id).all()


# ==========================
# Update (user validation 포함)
# ==========================
def update_chronic(db: Session, chronic_id: int, payload: ChronicUpdate, user_id: int):
    obj = db.query(ChronicDisease).filter(
        ChronicDisease.chronic_id == chronic_id,
        ChronicDisease.user_id == user_id
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
def delete_chronic(db: Session, chronic_id: int, user_id: int):
    obj = db.query(ChronicDisease).filter(
        ChronicDisease.chronic_id == chronic_id,
        ChronicDisease.user_id == user_id
    ).first()

    if not obj:
        return None

    db.delete(obj)
    db.commit()
    return True
