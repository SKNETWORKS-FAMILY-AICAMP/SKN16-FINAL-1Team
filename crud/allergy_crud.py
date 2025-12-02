from sqlalchemy.orm import Session
from models import Allergy
from schemas.allergy_schemas import AllergyCreate, AllergyUpdate


# ==========================
# Create
# ==========================
def create_allergy(db: Session, payload: AllergyCreate):
    db_obj = Allergy(
        allergy_name=payload.allergy_name,
        user_id=payload.user_id
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


# ==========================
# Read by user
# ==========================
def get_allergy_by_user(db: Session, user_id: int):
    return db.query(Allergy).filter(Allergy.user_id == user_id).all()


# ==========================
# Update (user validation 포함)
# ==========================
def update_allergy(db: Session, allergy_id: int, payload: AllergyUpdate, user_id: int):
    obj = db.query(Allergy).filter(
        Allergy.allergy_id == allergy_id,
        Allergy.user_id == user_id
    ).first()

    if not obj:
        return None

    if payload.allergy_name is not None:
        obj.allergy_name = payload.allergy_name

    db.commit()
    db.refresh(obj)
    return obj


# ==========================
# Delete (user validation 포함)
# ==========================
def delete_allergy(db: Session, allergy_id: int, user_id: int):
    obj = db.query(Allergy).filter(
        Allergy.allergy_id == allergy_id,
        Allergy.user_id == user_id
    ).first()

    if not obj:
        return None

    db.delete(obj)
    db.commit()
    return True
