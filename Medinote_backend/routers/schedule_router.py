from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db

from crud.schedule_crud import (
    create_schedule, list_schedules, get_schedule,
    update_schedule, delete_schedule
)
from schemas.schedule_schemas import (
    ScheduleCreate,
    ScheduleUpdate,
    ScheduleOut
)

# 테스트용 fake user
USE_FAKE_AUTH = True
FAKE_USER_ID = 1

def current_user_id():
    return FAKE_USER_ID if USE_FAKE_AUTH else None


router = APIRouter(prefix="/schedule", tags=["Schedule"])


# ----------------------------------------------------
# CREATE
# ----------------------------------------------------
@router.post("/", response_model=ScheduleOut)
def create_new_schedule(payload: ScheduleCreate, db: Session = Depends(get_db)):
    user_id = current_user_id()
    item = create_schedule(db, user_id, payload)
    return _convert_to_out(item)


# ----------------------------------------------------
# LIST
# ----------------------------------------------------
@router.get("/", response_model=list[ScheduleOut])
def get_schedule_list(
    from_date: str | None = None,
    to_date: str | None = None,
    type: str | None = None,
    page: int = 1,
    size: int = 20,
    db: Session = Depends(get_db),
):
    user_id = current_user_id()

    schedules, total = list_schedules(
        db, user_id, from_date, to_date, type, page, size
    )

    return [_convert_to_out(s) for s in schedules]


# ----------------------------------------------------
# DETAIL
# ----------------------------------------------------
@router.get("/{schedule_id}", response_model=ScheduleOut)
def get_schedule_detail(schedule_id: int, db: Session = Depends(get_db)):
    user_id = current_user_id()
    item = get_schedule(db, user_id, schedule_id)

    if not item:
        raise HTTPException(404, "해당 일정이 없습니다.")

    return _convert_to_out(item)


# ----------------------------------------------------
# UPDATE
# ----------------------------------------------------
@router.patch("/{schedule_id}", response_model=ScheduleOut)
def modify_schedule(schedule_id: int, payload: ScheduleUpdate, db: Session = Depends(get_db)):
    user_id = current_user_id()
    item = update_schedule(db, user_id, schedule_id, payload)

    if not item:
        raise HTTPException(404, "일정을 찾을 수 없습니다.")

    return _convert_to_out(item)


# ----------------------------------------------------
# DELETE
# ----------------------------------------------------
@router.delete("/{schedule_id}")
def remove_schedule(schedule_id: int, db: Session = Depends(get_db)):
    user_id = current_user_id()
    ok = delete_schedule(db, user_id, schedule_id)

    if not ok:
        raise HTTPException(404, "일정을 찾을 수 없습니다.")

    return {"message": "일정이 삭제되었습니다."}


# ----------------------------------------------------
# 내부 변환 함수 (ORM → response_model)
# ----------------------------------------------------
def _convert_to_out(s):
    """
    Schedule ORM 객체를 ScheduleOut 스키마 형태로 변환
    """
    return {
        "id": f"sch_{s.schedule_id}",
        "title": s.title,
        "type": s.type,
        "date": s.date,
        "time": s.time,
        "location": s.location,
        "memo": s.memo,
        "created_at": s.created_at,
    }
