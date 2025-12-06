from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from crud.drug_crud import create_drug, update_drug, delete_drug, list_drugs
from schemas.drug_schemas import DrugCreate, DrugUpdate, DrugOut


# ================================
#  Fake Auth (임시)
# ================================
USE_FAKE_AUTH = True
FAKE_USER_ID = 1

def get_current_user_id():
    if USE_FAKE_AUTH:
        return FAKE_USER_ID
    raise NotImplementedError("실제 인증 미구현")


# ================================
#  Router 설정
# ================================
router = APIRouter(prefix="/drug", tags=["Drug"])


# ================================
# GET /drug  : 나의 전체 약 목록 조회
# ================================
@router.get("/", response_model=list[DrugOut])
def get_my_drugs(db: Session = Depends(get_db)):
    user_id = get_current_user_id()
    return list_drugs(db, user_id)


# ================================
# POST /drug  : 새로운 약 추가
# ================================
@router.post("/", response_model=DrugOut, status_code=201)
def create_new_drug(payload: DrugCreate, db: Session = Depends(get_db)):
    user_id = get_current_user_id()
    return create_drug(db, user_id, payload)


# ================================
# PATCH /drug/{drug_id} : 약 수정
# ================================
@router.patch("/{drug_id}", response_model=DrugOut)
def modify_drug(drug_id: int, payload: DrugUpdate, db: Session = Depends(get_db)):
    user_id = get_current_user_id()
    updated = update_drug(db, drug_id, user_id, payload)

    if updated is None:
        raise HTTPException(status_code=404, detail="해당 약 정보를 찾을 수 없습니다.")

    return updated


# ================================
# DELETE /drug/{drug_id} : 약 삭제
# ================================
@router.delete("/{drug_id}")
def remove_drug(drug_id: int, db: Session = Depends(get_db)):
    user_id = get_current_user_id()
    ok = delete_drug(db, drug_id, user_id)

    if not ok:
        raise HTTPException(status_code=404, detail="해당 약 정보 없음")

    return {"message": "약 정보가 삭제되었습니다."}
