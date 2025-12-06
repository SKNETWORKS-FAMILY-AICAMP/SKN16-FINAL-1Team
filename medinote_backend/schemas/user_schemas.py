from pydantic import BaseModel, ConfigDict
from typing import Optional

class UserBase(BaseModel):
    email: str
    name: str
    role: str

class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    role: str = "user"

class UserUpdate(BaseModel):
    name: Optional[str] = None
    avatar: Optional[str] = None  # ⭐ avatar 수정 가능

class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str

class UserOut(UserBase):
    user_id: int
    avatar: Optional[str] = None

    class Config:
        from_attributes = True
        model_config = ConfigDict(from_attributes=True)
