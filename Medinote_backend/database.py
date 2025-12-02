import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# 🔹 .env 파일 로드 (로컬 개발용)
#   - uvicorn 실행 위치 기준으로 .env 찾을 수 있게 경로만 잘 맞으면 됨
load_dotenv()

# 🔹 반드시 환경변수에서만 DATABASE_URL 읽기
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")
if not SQLALCHEMY_DATABASE_URL:
    # 로컬/EC2 어디서든 DATABASE_URL 없으면 바로 에러 내고 죽이기
    raise RuntimeError(
        "DATABASE_URL is not set. "
        "Medinote_backend/.env 또는 Docker 환경변수를 확인하세요."
    )

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
