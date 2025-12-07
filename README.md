# MediNote

AI 기반 개인 건강 관리 및 의료 상담 플랫폼

## 프로젝트 개요

MediNote는 사용자의 건강 정보를 통합 관리하고, AI 챗봇을 통한 의료 상담, 음성 인식(STT) 기반 진료 기록 등을 제공하는 헬스케어 서비스입니다.

### 주요 기능

- **건강 정보 관리**: 건강 프로필, 복용 약물, 알레르기, 만성/급성 질환 등록 및 관리
- **AI 챗봇 상담**: LangGraph 기반 의료 AI 챗봇을 통한 건강 상담
- **음성 인식(STT)**: OpenAI Whisper를 활용한 진료 상담 녹음 → 텍스트 변환 및 요약
- **OCR**: PaddleOCR을 활용한 처방전/진료 기록 이미지 텍스트 추출
- **일정 관리**: 진료 예약, 검진 일정, 약 복용 알림 관리
- **건강 분석**: 사용자 데이터 기반 건강 상태 분석 리포트
- **관리자 대시보드**: 사용자 관리, 피드백 관리

---

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                   │
│                         Port: 4173                           │
└──────────────┬────────────────────────────┬─────────────────┘
               │                            │
         [REST API]                   [REST API]
               │                            │
               v                            v
┌────────────────────────┐      ┌─────────────────────────────┐
│  Backend (FastAPI)     │      │   LLM Service (FastAPI)     │
│      Port: 8000        │      │       Port: 8001            │
│                        │      │                             │
│  - 사용자 인증         │      │  - LangGraph 에이전트       │
│  - 건강 데이터 CRUD    │      │  - RAG (Chroma VectorDB)    │
│  - 일정 관리           │      │  - 웹 검색 (Tavily)         │
│  - 챗봇 세션 관리      │      │  - Cohere Reranker          │
└──────────┬─────────────┘      └─────────────────────────────┘
           │
           v
┌────────────────────────┐      ┌─────────────────────────────┐
│  STT Service (FastAPI) │      │  OCR Service (FastAPI)      │
│      Port: 8002        │      │      Port: 8003             │
│                        │      │                             │
│  - OpenAI Whisper      │      │  - PaddleOCR                │
│  - GPT-4o-mini 요약    │      │  - 처방전/진료기록 인식     │
└────────────────────────┘      └─────────────────────────────┘
           │                                │
           v                                v
        ┌─────────────────────────────────────┐
        │        PostgreSQL Database          │
        │            Port: 5432               │
        │                                     │
        │  - 사용자, 건강 프로필              │
        │  - 진료 기록, 처방                  │
        │  - 챗봇 세션, STT/OCR 작업          │
        └─────────────────────────────────────┘
```

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Zustand |
| **Backend** | FastAPI, SQLAlchemy, PostgreSQL |
| **AI/ML** | LangGraph, OpenAI GPT-4, Whisper, PaddleOCR, Chroma VectorDB |
| **인증** | JWT (python-jose), Argon2 |
| **배포** | Docker, Docker Compose |

---

## 프로젝트 구조

```
SKN16-FINAL-1Team/
├── Medinote_backend/      # 메인 백엔드 API 서버
│   ├── routers/           # API 엔드포인트
│   ├── crud/              # 데이터베이스 작업
│   ├── schemas/           # Pydantic 모델
│   └── models.py          # SQLAlchemy 모델
│
├── AI_service_LLM/        # AI 챗봇 서비스
│   ├── chatbot/           # LangGraph 에이전트
│   └── app.py             # FastAPI 앱
│
├── AI_service_stt/        # 음성 인식 서비스
│   ├── core/              # STT 엔진, 요약
│   └── app.py             # FastAPI 앱
│
├── AI_service_ocr/        # OCR 서비스
│   └── app.py             # FastAPI 앱 (PaddleOCR)
│
├── medinote_front/        # React 프론트엔드
│   ├── src/pages/         # 페이지 컴포넌트
│   ├── src/components/    # 공용 컴포넌트
│   ├── src/store/         # Zustand 상태 관리
│   └── src/api/           # API 클라이언트
│
├── docker-compose.yml     # 서비스 오케스트레이션
└── .env                   # 환경 변수
```

---

## 설치 및 실행

### 사전 요구사항

- Docker & Docker Compose
- Node.js 18+
- Python 3.11+

### 개별 서비스 실행 (개발용)

```bash
# 1. Backend (포트 8000)
cd Medinote_backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 2. LLM Service (포트 8001)
cd AI_service_LLM
pip install -r requirements.txt
uvicorn app:app --reload --host 0.0.0.0 --port 8001

# 3. STT Service (포트 8002)
cd AI_service_stt
pip install -r requirements.txt
uvicorn app:app --reload --host 0.0.0.0 --port 8002

# 4. OCR Service (포트 8003)
cd AI_service_ocr
pip install -r requirements.txt
uvicorn app:app --reload --host 0.0.0.0 --port 8003

# 5. Frontend (포트 4173)
cd medinote_front
npm install
npm run dev
```

---

## API 엔드포인트

### Backend (Port 8000)

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/auth/login` | 로그인 |
| POST | `/auth/signup` | 회원가입 |
| GET | `/users/me` | 내 정보 조회 |
| GET/POST | `/health-profile/` | 건강 프로필 |
| GET/POST | `/drugs/` | 약물 정보 |
| GET/POST | `/visits/` | 진료 기록 |
| GET/POST | `/schedules/` | 일정 관리 |
| POST | `/stt/analyze` | STT 분석 요청 |

### LLM Service (Port 8001)

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/chatbot/query` | AI 챗봇 질의 |
| GET | `/chatbot/sessions` | 대화 세션 목록 |
| GET | `/chatbot/sessions/{id}` | 세션 상세 |
| DELETE | `/chatbot/sessions/{id}` | 세션 삭제 |

### STT Service (Port 8002)

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/stt/process` | 음성 파일 처리 |
| GET | `/health` | 헬스 체크 |

### OCR Service (Port 8003)

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/ocr/process` | 이미지 OCR 처리 |
| GET | `/health` | 헬스 체크 |

---

## 주요 페이지

| 페이지 | 경로 | 설명 |
|--------|------|------|
| 랜딩 | `/` | 서비스 소개 |
| 로그인 | `/login` | 사용자 로그인 |
| 회원가입 | `/signup` | 신규 가입 |
| 대시보드 | `/dashboard` | 메인 홈 |
| 건강정보 | `/health-info` | 건강 프로필 관리 |
| 의료기록 | `/medical-history` | 진료/처방 기록 |
| 건강분석 | `/analysis` | AI 건강 분석 |
| 일정관리 | `/schedule` | 진료/복용 일정 |
| AI 챗봇 | `/chatbot` | 건강 상담 |
| 설정 | `/settings` | 계정 설정 |

---

## 팀원

| 이름 | 역할 |
|------|------|
| - | Backend 개발 |
| - | Frontend 개발 |
| - | AI/ML 개발 |
| - | DevOps |

---

## 라이선스

This project is licensed under the MIT License.
