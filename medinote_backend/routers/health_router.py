# routers/health_router.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db

# 공통 user_id 추출 (FAKE + JWT 통합)
from utils.auth_deps import get_current_user_id  

router = APIRouter(prefix="/health", tags=["Health"])


# =====================================================
#               HEALTH PROFILE API (기본 정보)
# =====================================================
from crud.health_crud import (
    create_health,
    get_health_by_user,
    update_health,
)
from schemas.health_schemas import HealthCreate, HealthOut, HealthUpdate


@router.post("/", response_model=HealthOut)
def add_health(
    payload: HealthCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    return create_health(db, payload, user_id)


@router.get("/", response_model=HealthOut)
def read_my_health(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    return get_health_by_user(db, user_id)


@router.put("/", response_model=HealthOut)
def modify_my_health(
    payload: HealthUpdate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    return update_health(db, user_id, payload)


# =====================================================
#                     ALLERGY
# =====================================================
from crud.allergy_crud import (
    create_allergy,
    get_allergy_by_user,
    delete_allergy,
    update_allergy,
)
from schemas.allergy_schemas import AllergyCreate, AllergyUpdate, AllergyOut


@router.post("/allergy", response_model=AllergyOut)
def add_allergy(
    payload: AllergyCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    payload.user_id = user_id
    return create_allergy(db, payload)


@router.get("/allergy", response_model=list[AllergyOut])
def read_allergies(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    return get_allergy_by_user(db, user_id)


@router.put("/allergy/{allergy_id}", response_model=AllergyOut)
def edit_allergy(
    allergy_id: int,
    payload: AllergyUpdate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    return update_allergy(db, allergy_id, payload, user_id)


@router.delete("/allergy/{allergy_id}")
def remove_allergy(
    allergy_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    return delete_allergy(db, allergy_id, user_id)


# =====================================================
#               CHRONIC DISEASE
# =====================================================
from crud.chronic_crud import (
    create_chronic,
    get_chronic_by_user,
    delete_chronic,
    update_chronic,
)
from schemas.chronic_schemas import ChronicCreate, ChronicUpdate, ChronicOut


@router.post("/chronic", response_model=ChronicOut)
def add_chronic(
    payload: ChronicCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    payload.user_id = user_id
    return create_chronic(db, payload)


@router.get("/chronic", response_model=list[ChronicOut])
def read_chronic(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    return get_chronic_by_user(db, user_id)


@router.put("/chronic/{chronic_id}", response_model=ChronicOut)
def edit_chronic(
    chronic_id: int,
    payload: ChronicUpdate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    return update_chronic(db, chronic_id, payload, user_id)


@router.delete("/chronic/{chronic_id}")
def remove_chronic(
    chronic_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    return delete_chronic(db, chronic_id, user_id)


# =====================================================
#                  ACUTE DISEASE
# =====================================================
from crud.acute_crud import (
    create_acute,
    get_acute_by_user,
    delete_acute,
    update_acute,
)
from schemas.acute_schemas import AcuteCreate, AcuteUpdate, AcuteOut


@router.post("/acute", response_model=AcuteOut)
def add_acute(
    payload: AcuteCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    payload.user_id = user_id
    return create_acute(db, payload)


@router.get("/acute", response_model=list[AcuteOut])
def read_acute(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    return get_acute_by_user(db, user_id)


@router.put("/acute/{acute_id}", response_model=AcuteOut)
def edit_acute(
    acute_id: int,
    payload: AcuteUpdate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    return update_acute(db, acute_id, payload, user_id)


@router.delete("/acute/{acute_id}")
def remove_acute(
    acute_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    return delete_acute(db, acute_id, user_id)
