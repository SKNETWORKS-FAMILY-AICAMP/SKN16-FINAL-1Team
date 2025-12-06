from pydantic import BaseModel, ConfigDict
from datetime import date, datetime
from typing import Optional


class ChronicBase(BaseModel):
    disease_name: str
    note: Optional[str] = None


# Create
#  - user_id 는 JWT에서 채움
class ChronicCreate(ChronicBase):
    user_id: Optional[int] = None


class ChronicUpdate(BaseModel):
    disease_name: Optional[str] = None
    note: Optional[str] = None


class ChronicOut(ChronicBase):
    chronic_id: int
    user_id: int

    class Config:
        from_attributes = True
        model_config = ConfigDict(from_attributes=True)

