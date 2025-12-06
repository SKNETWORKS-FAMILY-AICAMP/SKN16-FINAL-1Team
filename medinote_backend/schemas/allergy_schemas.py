from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

# ==========================
# Base
# ==========================
class AllergyBase(BaseModel):
    allergy_name: str


# ==========================
# Create
#  - user_id 는 요청에서 안 보내도 됨 (Optional)
#  - router에서 JWT로 채워 넣을 예정
# ==========================
class AllergyCreate(AllergyBase):
    user_id: Optional[int] = None


# ==========================
# Update (부분 수정 가능)
# ==========================
class AllergyUpdate(BaseModel):
    allergy_name: Optional[str] = None


# ==========================
# Output
# ==========================
class AllergyOut(AllergyBase):
    allergy_id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True  # pydantic v2
        model_config = ConfigDict(from_attributes=True)

