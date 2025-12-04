from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from crud.prescription_crud import (
    create_prescription,
    update_prescription,
    delete_prescription,
    list_prescriptions,
    list_prescriptions_by_visit,
)
from schemas.prescription_schemas import PrescriptionCreate, PrescriptionUpdate, PrescriptionOut

# 인증 스위치
USE_FAKE_AUTH = True
FAKE_USER_ID = 1

def get_current_user_id():
    if USE_FAKE_AUTH:
        return FAKE_USER_ID
    raise NotImplementedError


router = APIRouter(prefix="/prescription", tags=["Prescription"])


# ================================
# GET /prescription  (내 모든 처방 목록)
# ================================
@router.get("/", response_model=list[PrescriptionOut])
def get_my_prescriptions(db: Session = Depends(get_db)):
    user_id = get_current_user_id()
    return list_prescriptions(db, user_id)


# ================================
# GET /prescription/visit/{visit_id}
# ================================
@router.get("/visit/{visit_id}", response_model=list[PrescriptionOut])
def get_prescriptions_for_visit(visit_id: int, db: Session = Depends(get_db)):
    user_id = get_current_user_id()
    return list_prescriptions_by_visit(db, user_id, visit_id)


# ================================
# POST /prescription/visit/{visit_id}
# ================================
@router.post("/visit/{visit_id}", response_model=PrescriptionOut, status_code=201)
def create_new_prescription(visit_id: int, payload: PrescriptionCreate, db: Session = Depends(get_db)):
    user_id = get_current_user_id()
    return create_prescription(db, user_id, visit_id, payload)



# ================================
# PATCH /prescription/{prescription_id}
# ================================
@router.patch("/{prescription_id}", response_model=PrescriptionOut)
def modify_prescription(prescription_id: int, payload: PrescriptionUpdate, db: Session = Depends(get_db)):
    user_id = get_current_user_id()
    updated = update_prescription(db, prescription_id, user_id, payload)

    if not updated:
        raise HTTPException(status_code=404, detail="해당 처방을 찾을 수 없습니다.")

    return updated


# ================================
# DELETE /prescription/{prescription_id}
# ================================
@router.delete("/{prescription_id}")
def remove_prescription(prescription_id: int, db: Session = Depends(get_db)):
    user_id = get_current_user_id()
    ok = delete_prescription(db, prescription_id, user_id)

    if not ok:
        raise HTTPException(status_code=404, detail="해당 처방 없음")

    return {"message": "처방이 삭제되었습니다"}
