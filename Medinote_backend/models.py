from sqlalchemy import (
    Column, Integer, String, DateTime, Float, ForeignKey,
    Text, Date
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.types import JSON
from database import Base
from datetime import datetime


# ============================================================
# USER
# ============================================================
class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    name = Column(String(50), nullable=False)
    role = Column(String(20), nullable=False, default="user")
    avatar = Column(String(255), nullable=True)        # 프로필 이미지
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    health_profile = relationship("HealthProfile", back_populates="user")
    refresh_tokens = relationship("RefreshToken", back_populates="user")
    drugs = relationship("Drug", back_populates="user")
    visits = relationship("Visit", back_populates="user")
    prescriptions = relationship("Prescription", back_populates="user")
    allergies = relationship("Allergy", back_populates="user")
    chronic_diseases = relationship("ChronicDisease", back_populates="user")
    acute_diseases = relationship("AcuteDisease", back_populates="user")


# ============================================================
# REFRESH TOKEN
# ============================================================
class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    token = Column(String(255), nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="refresh_tokens")


# ============================================================
# HEALTH PROFILE (유저당 1개)
# ============================================================
class HealthProfile(Base):
    __tablename__ = "health_profile"

    profile_id = Column(Integer, primary_key=True, autoincrement=True)

    user_id = Column(
        Integer,
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        unique=True                      # 유저당 하나만 생성
    )

    birth = Column(Date)
    gender = Column(String(10))
    blood_type = Column(String(5))
    height = Column(Float)
    weight = Column(Float)
    drinking = Column(String(10))
    smoking = Column(String(10))

    user = relationship("User", back_populates="health_profile")


# ==========================
# DRUG
# ==========================
from sqlalchemy.types import JSON

class Drug(Base):
    __tablename__ = "drug"

    drug_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)

    med_name = Column(String(100), nullable=False)
    dosage_form = Column(String(50), nullable=False)
    dose = Column(String(50), nullable=False)
    unit = Column(String(20), nullable=False)

    # 🔥 핵심! ARRAY → JSON으로 변경
    schedule = Column(JSON, nullable=False)

    custom_schedule = Column(String(100), nullable=True)

    start_date = Column(Date)
    end_date = Column(Date)

    user = relationship("User", back_populates="drugs")




# ============================================================
# VISIT — 진료 기록
# ============================================================
class Visit(Base):
    __tablename__ = "visit"

    visit_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)

    hospital = Column(String(100), nullable=False)
    dept = Column(String(50), nullable=False)
    diagnosis_code = Column(String(20), nullable=False)

    diagnosis_name = Column(String(100))     # 프론트: title
    doctor_name = Column(String(50))         # 프론트: doctor
    symptom = Column(Text)                   # 프론트: symptoms
    opinion = Column(Text)                   # 프론트: notes(memo)
    date = Column(Date, nullable=False)

    user = relationship("User", back_populates="visits")

    # 핵심: Visit → Prescription (정상적인 1:N)
    prescriptions = relationship(
        "Prescription",
        back_populates="visit",
        cascade="all, delete"
    )


# ============================================================
# PRESCRIPTION — 처방
# ============================================================
class Prescription(Base):
    __tablename__ = "prescription"

    prescription_id = Column(Integer, primary_key=True, autoincrement=True)

    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    visit_id = Column(Integer, ForeignKey("visit.visit_id"), nullable=False)

    med_name = Column(String(100), nullable=False)            # 약 이름
    dosage_form = Column(String(50), nullable=False)          # 정제/캡슐 등
    dose = Column(String(50), nullable=False)                 # 용량 숫자
    unit = Column(String(20), nullable=False)                 # mg, g, ml …

    schedule = Column(JSON, nullable=False)                   # ["아침", "저녁"]
    custom_schedule = Column(String(100), nullable=True)      # 기타 직접 입력

    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)

    # 관계 연결
    user = relationship("User", back_populates="prescriptions")
    visit = relationship("Visit", back_populates="prescriptions")


# ============================================================
# ALLERGY
# ============================================================
class Allergy(Base):
    __tablename__ = "allergy"

    allergy_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)

    allergy_name = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="allergies")


# ============================================================
# CHRONIC DISEASE
# ============================================================
class ChronicDisease(Base):
    __tablename__ = "chronic_disease"

    chronic_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)

    disease_name = Column(String(100), nullable=False)
    note = Column(Text)

    user = relationship("User", back_populates="chronic_diseases")


# ============================================================
# ACUTE DISEASE
# ============================================================
class AcuteDisease(Base):
    __tablename__ = "acute_disease"

    acute_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)

    disease_name = Column(String(100), nullable=False)
    note = Column(Text)

    user = relationship("User", back_populates="acute_diseases")

# ======================
# SCHEDULE (약 정보 제거 버전)
# ======================
from sqlalchemy import Time

class Schedule(Base):
    __tablename__ = "schedule"

    schedule_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)

    title = Column(String(100), nullable=False)
    type = Column(String(20), nullable=False)     # "진료", "검진", "기타"
    date = Column(Date, nullable=False)
    time = Column(String, nullable=True)
    location = Column(String(100), nullable=True)
    memo = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, server_default="pending")


    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User")

# ============================================================
# CHATBOT SESSION
# ============================================================
class ChatSession(Base):
    __tablename__ = "chat_session"

    session_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, index=True)
    title = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # 관계 설정
    logs = relationship(
        "ChatLog",
        back_populates="session",
        cascade="all, delete-orphan"
    )


# ============================================================
# CHATBOT LOG (대화 기록)
# ============================================================
class ChatLog(Base):
    __tablename__ = "chat_log"

    chat_id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(Integer, ForeignKey("chat_session.session_id"), nullable=False)
    user_id = Column(Integer, nullable=False)

    query = Column(Text, nullable=True)      # user 메시지
    answer = Column(Text, nullable=True)     # assistant 메시지
    created_at = Column(DateTime, default=datetime.utcnow)

    # 관계 설정
    session = relationship("ChatSession", back_populates="logs")


# ============================================================
# STT JOB (음성→텍스트 변환 작업)
# ============================================================
class STTJob(Base):
    __tablename__ = "stt_job"

    stt_id = Column(String(50), primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    status = Column(String(20), nullable=False, default="pending")  # pending, done, error

    diagnosis = Column(String(200), nullable=True)
    symptoms = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    date = Column(String(20), nullable=True)


