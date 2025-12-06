from sqlalchemy.orm import Session
from models import Schedule
from schemas.schedule_schemas import ScheduleCreate, ScheduleUpdate
from datetime import date


# ---------------------------------------------------
# CREATE
# ---------------------------------------------------
def create_schedule(db: Session, user_id: int, data: ScheduleCreate):
    item = Schedule(
        user_id=user_id,
        title=data.title,
        type=data.type,
        date=data.date,
        time=data.time,
        location=data.location,
        memo=data.memo,
        status="pending"
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


# ---------------------------------------------------
# GET LIST
# ---------------------------------------------------
def list_schedules(db: Session, user_id: int, from_date=None, to_date=None, type=None, page=1, size=20):
    query = db.query(Schedule).filter(Schedule.user_id == user_id)

    if from_date:
        query = query.filter(Schedule.date >= from_date)
    if to_date:
        query = query.filter(Schedule.date <= to_date)
    if type:
        query = query.filter(Schedule.type == type)

    total = query.count()

    schedules = (
        query.order_by(Schedule.date.asc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )

    return schedules, total


# ---------------------------------------------------
# MONTHLY CALENDAR (약 제거)
# ---------------------------------------------------
def calendar_month(db: Session, user_id: int, year: int, month: int):
    start_date = date(year, month, 1)
    end_date = date(year, month + 1, 1) if month < 12 else date(year + 1, 1, 1)

    items = (
        db.query(Schedule)
        .filter(
            Schedule.user_id == user_id,
            Schedule.date >= start_date,
            Schedule.date < end_date
        )
        .order_by(Schedule.date.asc())
        .all()
    )

    days = sorted({item.date.isoformat() for item in items})

    events = []
    for s in items:
        events.append({
            "id": f"sch_{s.schedule_id}",
            "title": s.title,
            "date": s.date.isoformat(),
            "type": s.type,
            # drug 정보 완전 제거
        })

    return {"days": days, "events": events}


# ---------------------------------------------------
# DETAIL
# ---------------------------------------------------
def get_schedule(db: Session, user_id: int, schedule_id: int):
    return (
        db.query(Schedule)
        .filter(Schedule.schedule_id == schedule_id, Schedule.user_id == user_id)
        .first()
    )


# ---------------------------------------------------
# UPDATE
# ---------------------------------------------------
def update_schedule(db: Session, user_id: int, schedule_id: int, data: ScheduleUpdate):
    item = db.query(Schedule).filter(
        Schedule.schedule_id == schedule_id,
        Schedule.user_id == user_id
    ).first()

    if not item:
        return None

    update_data = data.dict(exclude_none=True)
    for k, v in update_data.items():
        setattr(item, k, v)

    db.commit()
    db.refresh(item)
    return item


# ---------------------------------------------------
# DELETE
# ---------------------------------------------------
def delete_schedule(db: Session, user_id: int, schedule_id: int):
    item = db.query(Schedule).filter(
        Schedule.schedule_id == schedule_id,
        Schedule.user_id == user_id
    ).first()

    if not item:
        return False

    db.delete(item)
    db.commit()
    return True
