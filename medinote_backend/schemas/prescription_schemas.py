from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import date


# =====================================================================
# CREATE (요청 바디) - 프론트에서 보내는 형식 그대로 CamelCase 유지
# =====================================================================
class PrescriptionCreate(BaseModel):
    med_name: str
    dosageForm: str                  # 정제/캡슐 등
    dose: str                        # 용량
    unit: str                        # mg, g, ml 등
    schedule: List[str]              # ["아침", "저녁"]
    customSchedule: Optional[str] = None
    startDate: date
    endDate: date

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
    )


# =====================================================================
# UPDATE (부분 수정)
# =====================================================================
class PrescriptionUpdate(BaseModel):
    med_name: Optional[str] = None
    dosageForm: Optional[str] = None
    dose: Optional[str] = None
    unit: Optional[str] = None
    schedule: Optional[List[str]] = None
    customSchedule: Optional[str] = None
    startDate: Optional[date] = None
    endDate: Optional[date] = None

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
    )


# =====================================================================
# OUT (응답용) - 프론트에서 보기 좋게 CamelCase로 반환
# =====================================================================
class PrescriptionOut(BaseModel):
    prescription_id: int
    med_name: str

    # snake_case(DB) → camelCase(응답) 자동 변환
    dosageForm: str = Field(alias="dosage_form")
    dose: str
    unit: str
    schedule: List[str]
    customSchedule: Optional[str] = Field(default=None, alias="custom_schedule")
    startDate: date = Field(alias="start_date")
    endDate: date = Field(alias="end_date")

    # visit_id는 응답에는 남겨두지만, 원하면 제거 가능
    visit_id: Optional[int] = None

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
    )
