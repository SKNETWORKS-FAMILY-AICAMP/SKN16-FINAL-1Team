# ============================================================
# STT CRUD
# ============================================================

from sqlalchemy.orm import Session
from models import STTJob, Visit
import uuid


# ------------------------------------------------------------
# STT 작업 생성 (pending 상태)
# ------------------------------------------------------------
def create_stt_job(db: Session, user_id: int) -> STTJob:
    stt_id = f"stt_{uuid.uuid4().hex[:8]}"

    item = STTJob(
        stt_id=stt_id,
        user_id=user_id,
        status="pending"
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


# ------------------------------------------------------------
# STT 결과 업데이트 (Whisper 결과 반영)
# ------------------------------------------------------------
def update_stt_result(db: Session, stt_id: str, result: dict) -> STTJob | None:
    job = db.query(STTJob).filter(STTJob.stt_id == stt_id).first()
    if not job:
        return None

    for key, value in result.items():
        if hasattr(job, key):
            setattr(job, key, value)

    db.commit()
    db.refresh(job)
    return job


# ------------------------------------------------------------
# STT 상태/결과 조회
# ------------------------------------------------------------
def get_stt_job(db: Session, stt_id: str) -> STTJob | None:
    return db.query(STTJob).filter(STTJob.stt_id == stt_id).first()


# ============================================================
# STT 결과 기반 Visit 생성 (사용자 "저장" 눌렀을 때)
# ============================================================
def create_visit_from_stt(db: Session, stt_id: str, user_id: int, data):
    """
    STTJob에 저장된 diagnosis/symptoms/notes/date 값을 기반으로
    Visit 테이블에 신규 레코드를 생성한다.
    병원 / 진료과 / 진단코드는 프론트에서 입력한 값을 사용한다.
    """

    # 1) STT job 조회
    job = db.query(STTJob).filter(
        STTJob.stt_id == stt_id,
        STTJob.user_id == user_id
    ).first()

    if not job:
        return None

    # 2) Visit 생성
    visit = Visit(
        user_id=user_id,
        hospital=data.hospital,
        dept=data.dept,
        diagnosis_code=data.diagnosis_code,
        diagnosis_name=job.diagnosis,
        doctor_name=data.doctor_name,
        symptom=job.symptoms,
        opinion=job.notes,
        date=job.date
    )

    db.add(visit)
    db.commit()
    db.refresh(visit)

    return visit
