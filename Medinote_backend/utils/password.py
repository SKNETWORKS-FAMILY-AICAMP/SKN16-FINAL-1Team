# utils/password.py

from argon2 import PasswordHasher

pwd_context = PasswordHasher()


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        pwd_context.verify(hashed_password, plain_password)
        return True
    except:
        return False
