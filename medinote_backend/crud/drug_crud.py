from sqlalchemy.orm import Session
from models import Drug
from schemas.drug_schemas import DrugCreate, DrugUpdate

# ================================
# CREATE
# ================================
def create_drug(db: Session, user_id: int, data: DrugCreate):
    item = Drug(
        user_id=user_id,
        med_name=data.med_name,
        dosage_form=data.dosage_form,
        dose=data.dose,
        unit=data.unit,
        schedule=data.schedule,
        custom_schedule=data.custom_schedule,
        start_date=data.start_date,
        end_date=data.end_date
    )

    db.add(item)
    db.commit()
    db.refresh(item)
    return item


# ================================
# LIST
# ================================
def list_drugs(db: Session, user_id: int):
    return (
        db.query(Drug)
        .filter(Drug.user_id == user_id)
        .order_by(Drug.start_date.desc())
        .all()
    )


# ================================
# UPDATE
# ================================
def update_drug(db: Session, drug_id: int, user_id: int, data: DrugUpdate):
    drug = (
        db.query(Drug)
        .filter(Drug.drug_id == drug_id, Drug.user_id == user_id)
        .first()
    )

    if not drug:
        return None

    update_data = data.dict(exclude_none=True)

    # UPDATE 시에도 snake_case 그대로 사용하면 된다.
    for k, v in update_data.items():
        setattr(drug, k, v)

    db.commit()
    db.refresh(drug)
    return drug


# ================================
# DELETE
# ================================
def delete_drug(db: Session, drug_id: int, user_id: int):
    drug = (
        db.query(Drug)
        .filter(Drug.drug_id == drug_id, Drug.user_id == user_id)
        .first()
    )

    if not drug:
        return False

    db.delete(drug)
    db.commit()
    return True
