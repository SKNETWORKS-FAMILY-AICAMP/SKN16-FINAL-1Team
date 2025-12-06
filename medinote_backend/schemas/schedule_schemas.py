from __future__ import annotations
from datetime import date as Date, datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


# ================================
# CREATE (POST /schedule)
# ================================
class ScheduleCreate(BaseModel):
    title: str = Field(..., example="치과 방문")
    type: str = Field(..., example="진료")   # "진료", "검진", "기타"
    date: Date = Field(..., example="2025-12-01")  # ✅ date 필드 예시 추가
    time: Optional[str] = Field(None, example="10:30")
    location: Optional[str] = Field(None, example="서울대병원")
    memo: Optional[str] = Field(None, example="주의사항 기록")

    model_config = ConfigDict(from_attributes=True)


# ================================
# UPDATE (PATCH /schedule/{id})
# ================================
class ScheduleUpdate(BaseModel):
    title: Optional[str] = Field(None, example="치과 방문")
    date: Optional[Date] = Field(None, example="2025-12-01")
    time: Optional[str] = Field(None, example="11:00")
    location: Optional[str] = Field(None, example="서울대병원 3층")
    memo: Optional[str] = Field(None, example="주의사항 기록 수정")

    model_config = ConfigDict(from_attributes=True, extra="ignore")


# ================================
# OUT (GET 응답)
# ================================
class ScheduleOut(BaseModel):
    id: str = Field(..., example="sch_12")
    type: Optional[str] = Field(None, example="진료")
    title: str = Field(..., example="치과 방문")
    type: str = Field(..., example="진료")
    date: Date = Field(..., example="2025-12-01")
    time: Optional[str] = Field(None, example="10:30")
    location: Optional[str] = Field(None, example="서울대병원")
    memo: Optional[str] = Field(None, example="메모 내용")
    created_at: datetime = Field(
        ..., example="2025-12-01T09:24:17.065Z"
    )

    model_config = ConfigDict(from_attributes=True)
