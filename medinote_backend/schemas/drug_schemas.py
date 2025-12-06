from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import date

# ================================
# CREATE  (요청: snake_case)
# ================================
class DrugCreate(BaseModel):
    med_name: str
    dosage_form: str
    dose: str
    unit: str
    schedule: List[str]
    custom_schedule: Optional[str] = None
    start_date: date
    end_date: date


# ================================
# UPDATE  (부분 수정)
# ================================
class DrugUpdate(BaseModel):
    med_name: Optional[str] = None
    dosage_form: Optional[str] = None
    dose: Optional[str] = None
    unit: Optional[str] = None
    schedule: Optional[List[str]] = None
    custom_schedule: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


# ================================
# OUT (응답: camelCase)
# ================================
class DrugOut(BaseModel):
    drug_id: int
    med_name: str

    dosageForm: str = Field(alias="dosage_form")
    dose: str
    unit: str
    schedule: List[str]

    customSchedule: Optional[str] = Field(alias="custom_schedule")

    startDate: date = Field(alias="start_date")
    endDate: date = Field(alias="end_date")

    # 🔥 Pydantic v2 전용 설정 (from_orm 사용 가능하게)
    model_config = ConfigDict(
        from_attributes=True,         # ORM 객체에서 읽기
        populate_by_name=True         # field 이름/alias 둘 다 허용
    )
