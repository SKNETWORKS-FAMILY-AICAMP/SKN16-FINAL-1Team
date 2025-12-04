# ============================================================
# STT ROUTER (테스트용: user_id = 1 고정)
# ============================================================

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db

from crud.stt_crud import (
    create_stt_job,
    get_stt_job,
    update_stt_result,
    create_visit_from_stt
)

from schemas.stt_schemas import (
    STTAnalyzeResponse,
    STTStatusResponse,
    STTResultInput,
    STTCreateVisitRequest,
    STTCreateVisitResponse
)

router = APIRouter(prefix="/stt", tags=["STT"])

# 테스트용 FAKE USER
FAKE_USER_ID = 1


# ------------------------------------------------------------
# 1) STT 분석 시작 (stt_id 발급 + pending)
# ------------------------------------------------------------
@router.post("/analyze", response_model=STTAnalyzeResponse)
async def analyze_stt(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    음성 파일을 받아 STT 작업(stt_id)을 생성하고
    상태를 pending으로 두는 엔드포인트.
    지금은 테스트이므로 user_id = 1로 고정.
    Whisper 실행/연동은 STT 담당자가 별도 처리.
    """

    user_id = FAKE_USER_ID

    # STTJob 생성
    stt_item = create_stt_job(db, user_id=user_id)

    # (주의) 파일 자체 저장/처리는 추후 단계에서 구현
    return STTAnalyzeResponse(
        user_id=user_id,
        stt_id=stt_item.stt_id,
        status=stt_item.status,
    )


# ------------------------------------------------------------
# 2) STT 상태 조회 (프론트 폴링)
# ------------------------------------------------------------
@router.get("/{stt_id}/status", response_model=STTStatusResponse)
def get_status(
    stt_id: str,
    db: Session = Depends(get_db),
):
    """
    STTJob의 현재 상태 및 결과를 조회.
    프론트에서 주기적으로 호출해서
    status가 done이 되면 diagnosis/symptoms/notes/date를 사용.
    """

    job = get_stt_job(db, stt_id)
    if not job:
        raise HTTPException(status_code=404, detail="STT job not found")

    return job


# ------------------------------------------------------------
# 3) Whisper 결과 저장 (STT 담당자 → 백엔드)
# ------------------------------------------------------------
@router.post("/{stt_id}/result")
async def receive_stt_result(
    stt_id: str,
    result: STTResultInput,
    db: Session = Depends(get_db),
):
    """
    STT 담당자가 Whisper 실행 후,
    stt_id 기준으로 결과를 백엔드에 넘기는 엔드포인트.
    STTJob 테이블에 변환 결과 저장.
    """

    updated = update_stt_result(db, stt_id, result.dict())
    if not updated:
        raise HTTPException(status_code=404, detail="STT job not found")

    return {"message": "result saved", "stt_id": stt_id}


# ------------------------------------------------------------
# 4) STT 결과 기반 → VISIT 생성 (사용자가 '저장' 버튼 클릭)
# ------------------------------------------------------------
@router.post("/{stt_id}/visit", response_model=STTCreateVisitResponse)
def create_visit_from_stt_api(
    stt_id: str,
    payload: STTCreateVisitRequest,
    db: Session = Depends(get_db),
):
    """
    STTJob에 저장된 diagnosis/symptoms/notes/date 값을 기반으로
    Visit 레코드를 생성한다.
    병원, 진료과, 진단코드는 프론트에서 입력.
    """

    user_id = FAKE_USER_ID

    visit = create_visit_from_stt(db, stt_id, user_id, payload)
    if visit is None:
        raise HTTPException(status_code=404, detail="STT job not found")

    return STTCreateVisitResponse(
        message="Visit created successfully",
        visit_id=visit.visit_id
    )
