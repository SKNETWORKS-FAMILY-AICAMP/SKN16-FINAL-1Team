# ============================================================
# STT CRUD
# ============================================================

from sqlalchemy.orm import Session
from models import STTJob
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