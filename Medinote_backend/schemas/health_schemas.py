from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date


# ===============================
# Base Schema (공통 필드)
# ===============================
class HealthBase(BaseModel):
    birth: Optional[date] = None
    gender: Optional[str] = None
    blood_type: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    drinking: Optional[str] = None
    smoking: Optional[str] = None


# ===============================
# Create Schema (POST)
# - user_id는 서버에서 JWT로 자동 주입
# ===============================
class HealthCreate(HealthBase):
    pass


# ===============================
# Update Schema (PUT)
# - 부분 수정이므로 Base와 동일
# ===============================
class HealthUpdate(HealthBase):
    pass


# ===============================
# Response Schema (GET)
# ===============================
class HealthOut(HealthBase):
    profile_id: int
    user_id: int

    class Config:
        from_attributes = True  # Pydantic v2
        model_config = ConfigDict(from_attributes=True)

