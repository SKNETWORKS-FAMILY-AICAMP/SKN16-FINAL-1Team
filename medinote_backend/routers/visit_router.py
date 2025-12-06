# routers/visit_router.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from crud.visit_crud import (
    create_visit,
    list_visits,
    get_visit,
    update_visit,
    delete_visit,
)
from schemas.visit_schemas import VisitCreate, VisitUpdate, VisitOut

# 인증 스위치
USE_FAKE_AUTH = True
FAKE_USER_ID = 1

def get_current_user_id():
    if USE_FAKE_AUTH:
        return FAKE_USER_ID
    # 나중에 JWT 붙이면 여기 수정
    raise NotImplementedError

router = APIRouter(prefix="/visits", tags=["Visit"])


# ================================
# POST /visits
# ================================
@router.post("/", response_model=VisitOut, status_code=201)
def create_new_visit(payload: VisitCreate, db: Session = Depends(get_db)):
    user_id = get_current_user_id()
    return create_visit(db, user_id, payload)


# ================================
# GET /visits
# ================================
@router.get("/", response_model=list[VisitOut])
def get_my_visits(db: Session = Depends(get_db)):
    user_id = get_current_user_id()
    return list_visits(db, user_id)


# ================================
# GET /visits/{id}
# ================================
@router.get("/{visit_id}", response_model=VisitOut)
def get_visit_detail(visit_id: int, db: Session = Depends(get_db)):
    user_id = get_current_user_id()
    item = get_visit(db, visit_id, user_id)
    if not item:
        raise HTTPException(status_code=404, detail="진료기록을 찾을 수 없습니다.")
    return item


# ================================
# PATCH /visits/{id}
# ================================
@router.patch("/{visit_id}")
def modify_visit(
    visit_id: int,
    payload: VisitUpdate,
    db: Session = Depends(get_db)
):
    user_id = get_current_user_id()
    updated = update_visit(db, visit_id, user_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="진료기록 없음")

    return {"message": "진료 기록이 수정되었습니다"}


# ================================
# DELETE /visits/{id}
# ================================
@router.delete("/{visit_id}")
def remove_visit(visit_id: int, db: Session = Depends(get_db)):
    user_id = get_current_user_id()
    ok = delete_visit(db, visit_id, user_id)
    if not ok:
        raise HTTPException(status_code=404, detail="기록 없음")
    return {"message": "진료기록이 삭제되었습니다"}
