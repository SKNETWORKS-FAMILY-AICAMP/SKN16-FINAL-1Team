# crud/visit_crud.py
from sqlalchemy.orm import Session
from models import Visit
from schemas.visit_schemas import VisitCreate, VisitUpdate


# ================================
# Visit 생성
# ================================
def create_visit(db: Session, user_id: int, data: VisitCreate):
    """
    프론트 폼 ↔ DB 컬럼 매핑

    프론트 필드(요청 Body 기준, VisitCreate) 예시:
      - hospital      -> 병원명
      - date          -> 진료일
      - dept          -> 진료과
      - diagnosis_code-> 진단코드
      - title         -> 진단명           -> Visit.diagnosis_name
      - doctor        -> 담당의           -> Visit.doctor_name
      - symptoms      -> 증상             -> Visit.symptom
      - notes         -> 담당의 소견      -> Visit.opinion
      - memo          -> (기존 메모 필드) -> Visit.opinion (백업용)

    프론트에서 title/doctor/symptoms/notes 를 안 보낼 수도 있으니 전부 Optional 가정.
    """

    # notes가 있으면 최우선으로 opinion에 사용,
    # 없으면 예전 스펙인 memo 값을 opinion에 사용
    opinion_value = None
    if hasattr(data, "notes") and data.notes is not None:
        opinion_value = data.notes
    elif hasattr(data, "memo") and data.memo is not None:
        opinion_value = data.memo

    db_item = Visit(
        user_id=user_id,
        hospital=data.hospital,
        date=data.date,
        dept=data.dept,
        diagnosis_code=data.diagnosis_code,
        # 🔥 프론트 추가 필드 매핑
        diagnosis_name=getattr(data, "title", None),
        doctor_name=getattr(data, "doctor", None),
        symptom=getattr(data, "symptoms", None),
        opinion=opinion_value,
    )

    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


# ================================
# Visit 목록 조회
# ================================
def list_visits(db: Session, user_id: int):
    return (
        db.query(Visit)
        .filter(Visit.user_id == user_id)
        .order_by(Visit.date.desc())
        .all()
    )


# ================================
# Visit 상세조회
# ================================
def get_visit(db: Session, visit_id: int, user_id: int):
    return (
        db.query(Visit)
        .filter(Visit.visit_id == visit_id, Visit.user_id == user_id)
        .first()
    )


# ================================
# Visit 수정 (PATCH)
# ================================
def update_visit(db: Session, visit_id: int, user_id: int, data: VisitUpdate):
    visit = (
        db.query(Visit)
        .filter(Visit.visit_id == visit_id, Visit.user_id == user_id)
        .first()
    )

    if visit is None:
        return None

    # 요청 중 None 아닌 필드만 추출
    update_data = data.dict(exclude_none=True)

    # ✅ 프론트 쪽 필드명을 DB 컬럼으로 매핑
    # title -> diagnosis_name
    if "title" in update_data:
        visit.diagnosis_name = update_data.pop("title")

    # doctor -> doctor_name
    if "doctor" in update_data:
        visit.doctor_name = update_data.pop("doctor")

    # symptoms -> symptom
    if "symptoms" in update_data:
        visit.symptom = update_data.pop("symptoms")

    # notes -> opinion
    if "notes" in update_data:
        visit.opinion = update_data.pop("notes")

    # (이전 스펙) memo -> opinion
    if "memo" in update_data:
        visit.opinion = update_data.pop("memo")

    # 나머지 필드(hospital, dept, diagnosis_code, date 등)는 이름 그대로 Visit에 세팅
    for field, value in update_data.items():
        setattr(visit, field, value)

    db.commit()
    db.refresh(visit)
    return visit


# ================================
# Visit 삭제
# ================================
def delete_visit(db: Session, visit_id: int, user_id: int):
    visit = (
        db.query(Visit)
        .filter(Visit.visit_id == visit_id, Visit.user_id == user_id)
        .first()
    )

    if visit is None:
        return False

    db.delete(visit)
    db.commit()
    return True
