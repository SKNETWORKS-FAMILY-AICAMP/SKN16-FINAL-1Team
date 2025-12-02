from sqlalchemy.orm import Session
from models import Prescription
from schemas.prescription_schemas import PrescriptionCreate, PrescriptionUpdate


# ================================
# CREATE
# ================================
def create_prescription(db: Session, user_id: int, visit_id: int, data: PrescriptionCreate):

    item = Prescription(
        user_id=user_id,
        visit_id=visit_id,
        med_name=data.med_name,
        dosage_form=data.dosageForm,       # camel → snake
        dose=data.dose,
        unit=data.unit,
        schedule=data.schedule,
        custom_schedule=data.customSchedule,
        start_date=data.startDate,
        end_date=data.endDate
    )

    db.add(item)
    db.commit()
    db.refresh(item)
    return item


# ================================
# LIST (내 전체 처방)
# ================================
def list_prescriptions(db: Session, user_id: int):
    return (
        db.query(Prescription)
        .filter(Prescription.user_id == user_id)
        .order_by(Prescription.start_date.desc())
        .all()
    )


# ================================
# LIST (특정 visit의 처방들)
# ================================
def list_prescriptions_by_visit(db: Session, user_id: int, visit_id: int):
    return (
        db.query(Prescription)
        .filter(
            Prescription.user_id == user_id,
            Prescription.visit_id == visit_id
        )
        .order_by(Prescription.start_date.desc())
        .all()
    )


# ================================
# UPDATE
# ================================
def update_prescription(db: Session, pid: int, user_id: int, data: PrescriptionUpdate):
    presc = (
        db.query(Prescription)
        .filter(
            Prescription.prescription_id == pid,
            Prescription.user_id == user_id
        )
        .first()
    )

    if not presc:
        return None

    update_data = data.dict(exclude_none=True)

    # --------------------------
    # CamelCase → snake_case 키 변환
    # --------------------------
    mapping = {
        "dosageForm": "dosage_form",
        "customSchedule": "custom_schedule",
        "startDate": "start_date",
        "endDate": "end_date",
    }

    for k, v in update_data.items():
        setattr(presc, mapping.get(k, k), v)

    db.commit()
    db.refresh(presc)
    return presc


# ================================
# DELETE
# ================================
def delete_prescription(db: Session, pid: int, user_id: int):
    presc = (
        db.query(Prescription)
        .filter(
            Prescription.prescription_id == pid,
            Prescription.user_id == user_id
        )
        .first()
    )

    if not presc:
        return False

    db.delete(presc)
    db.commit()
    return True
