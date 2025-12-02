from pydantic import BaseModel, ConfigDict
from datetime import date
from typing import Optional


class AcuteBase(BaseModel):
    disease_name: str
    note: Optional[str] = None


# Create
#  - user_id 는 JWT에서 채움
class AcuteCreate(AcuteBase):
    user_id: Optional[int] = None


class AcuteUpdate(BaseModel):
    disease_name: Optional[str] = None
    note: Optional[str] = None


class AcuteOut(AcuteBase):
    acute_id: int
    user_id: int

    class Config:
        from_attributes = True
        model_config = ConfigDict(from_attributes=True)

