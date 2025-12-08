<div align="center">

# 🏥 MediNote

### AI 기반 개인 건강 관리 및 의료 상담 플랫폼

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)

<br/>

**MediNote**는 사용자의 건강 정보를 통합 관리하고,
AI 챗봇 상담 · 음성 인식(STT) 진료 기록 · OCR 처방전 인식 기능을 제공하는 헬스케어 서비스입니다.

[데모 보기](#) · [버그 리포트](../../issues) · [기능 요청](../../issues)

</div>

<br/>

---

## 📑 목차

- [주요 기능](#-주요-기능)
- [시스템 아키텍처](#-시스템-아키텍처)
- [기술 스택](#-기술-스택)
- [프로젝트 구조](#-프로젝트-구조)
- [시작하기](#-시작하기)
- [API 문서](#-api-문서)
- [화면 구성](#-화면-구성)
- [팀원](#-팀원)

---

## ✨ 주요 기능

<table>
<tr>
<td width="50%">

### 🤖 AI 챗봇 상담
LangGraph 기반 멀티 에이전트 의료 챗봇
- 6개 전문 에이전트 (질병/약물/웹검색 등)
- RAG 기반 정확한 의료 정보 제공
- Cohere Reranker로 검색 품질 향상

</td>
<td width="50%">

### 🎤 음성 인식 (STT)
OpenAI Whisper 기반 진료 상담 기록
- 실시간 음성 → 텍스트 변환
- GPT-4o-mini로 진료 내용 자동 요약
- 진료 기록 자동 저장

</td>
</tr>
<tr>
<td width="50%">

### 📄 OCR 처방전 인식
PaddleOCR 기반 문서 인식
- 처방전/진료기록 이미지 텍스트 추출
- 약 정보 자동 파싱
- 진료 기록 자동 등록

</td>
<td width="50%">

### 📊 건강 분석 리포트
사용자 데이터 기반 AI 분석
- BMI, 복용약, 질환 종합 분석
- 의사 전달용 요약 리포트
- 개인화된 건강 인사이트

</td>
</tr>
<tr>
<td width="50%">

### 📋 건강 정보 관리
통합 건강 데이터 관리
- 건강 프로필 (키/몸무게/혈액형)
- 복용 약물, 알레르기 관리
- 만성/급성 질환 기록

</td>
<td width="50%">

### 📅 일정 관리
진료 및 복약 일정 관리
- 진료 예약 알림
- 검진 일정 관리
- 약 복용 리마인더

</td>
</tr>
</table>

---

## 🏗 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                      │
│                          Port: 4173                              │
└────────────────┬──────────────────────────────┬─────────────────┘
                 │                              │
           [REST API]                     [REST API]
                 │                              │
                 v                              v
┌──────────────────────────┐      ┌───────────────────────────────┐
│   Backend (FastAPI)      │      │     LLM Service (FastAPI)     │
│       Port: 8000         │      │         Port: 8001            │
│                          │      │                               │
│  • 사용자 인증 (JWT)     │◄────►│  • LangGraph 멀티에이전트     │
│  • 건강 데이터 CRUD      │      │  • RAG (Chroma VectorDB)      │
│  • 일정 관리             │      │  • 웹 검색 (Tavily)           │
│  • 챗봇 세션 관리        │      │  • Cohere Reranker            │
└────────────┬─────────────┘      └───────────────────────────────┘
             │
             v
┌──────────────────────────┐      ┌───────────────────────────────┐
│  STT Service (FastAPI)   │      │    OCR Service (FastAPI)      │
│       Port: 8002         │      │        Port: 8003             │
│                          │      │                               │
│  • OpenAI Whisper        │      │  • PaddleOCR                  │
│  • GPT-4o-mini 요약      │      │  • 처방전/진료기록 인식       │
└──────────────────────────┘      └───────────────────────────────┘
             │                                  │
             └──────────────┬───────────────────┘
                            v
              ┌─────────────────────────────┐
              │    PostgreSQL Database      │
              │        Port: 5432           │
              │                             │
              │  • 사용자, 건강 프로필      │
              │  • 진료 기록, 처방          │
              │  • 챗봇 세션, 작업 로그     │
              └─────────────────────────────┘
```

---

## 🛠 기술 스택

### Frontend
![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-433E38?style=flat-square&logo=react&logoColor=white)

### Backend
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python_3.11-3776AB?style=flat-square&logo=python&logoColor=white)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-D71F00?style=flat-square&logo=sqlalchemy&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)

### AI/ML
![OpenAI](https://img.shields.io/badge/OpenAI_GPT--4-412991?style=flat-square&logo=openai&logoColor=white)
![LangChain](https://img.shields.io/badge/LangGraph-1C3C3C?style=flat-square&logo=langchain&logoColor=white)
![Whisper](https://img.shields.io/badge/Whisper-74AA9C?style=flat-square&logo=openai&logoColor=white)
![ChromaDB](https://img.shields.io/badge/ChromaDB-FF6F61?style=flat-square&logo=databricks&logoColor=white)

### DevOps
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)
![Docker Compose](https://img.shields.io/badge/Docker_Compose-2496ED?style=flat-square&logo=docker&logoColor=white)

---

## 📁 프로젝트 구조

```
SKN16-FINAL-1Team/
│
├── 📂 Medinote_backend/          # 메인 백엔드 API
│   ├── routers/                  # API 엔드포인트
│   ├── crud/                     # DB 작업
│   ├── schemas/                  # Pydantic 모델
│   └── models.py                 # SQLAlchemy 모델
│
├── 📂 AI_service_LLM/            # AI 챗봇 서비스
│   ├── chatbot/
│   │   ├── agents/               # 6개 전문 에이전트
│   │   ├── core/                 # 상태관리, LLM, RAG
│   │   └── tools/                # 검색, 리랭커
│   └── app.py
│
├── 📂 AI_service_stt/            # 음성 인식 서비스
│   ├── core/                     # Whisper 엔진
│   └── app.py
│
├── 📂 AI_service_ocr/            # OCR 서비스
│   └── app.py                    # PaddleOCR
│
├── 📂 medinote_front/            # React 프론트엔드
│   ├── src/
│   │   ├── pages/                # 페이지 컴포넌트
│   │   ├── components/           # 공용 컴포넌트
│   │   ├── store/                # Zustand 스토어
│   │   └── api/                  # API 클라이언트
│   └── package.json
│
├── 📄 docker-compose.yml         # 서비스 오케스트레이션
└── 📄 .env                       # 환경 변수
```

---

## 🚀 시작하기

### 사전 요구사항

- **Docker** & **Docker Compose** (권장)
- Node.js 18+
- Python 3.11+

### 환경 변수 설정

```bash
# .env 파일 생성
cp .env.example .env
```

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/medinote

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Tavily (웹 검색)
TAVILY_API_KEY=your_tavily_api_key

# Cohere (Reranker)
COHERE_API_KEY=your_cohere_api_key
```

### Docker로 실행 (권장)

```bash
# 전체 서비스 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f
```

### 개발 모드 실행

```bash
# Backend (Port 8000)
cd Medinote_backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# LLM Service (Port 8001)
cd AI_service_LLM
pip install -r requirements.txt
uvicorn app:app --reload --port 8001

# STT Service (Port 8002)
cd AI_service_stt
pip install -r requirements.txt
uvicorn app:app --reload --port 8002

# OCR Service (Port 8003)
cd AI_service_ocr
pip install -r requirements.txt
uvicorn app:app --reload --port 8003

# Frontend (Port 5173)
cd medinote_front
npm install && npm run dev
```

---

## 📚 API 문서

서비스 실행 후 Swagger UI에서 API 문서 확인:

| 서비스 | Swagger URL |
|--------|-------------|
| Backend | http://localhost:8000/docs |
| LLM Service | http://localhost:8001/docs |
| STT Service | http://localhost:8002/docs |
| OCR Service | http://localhost:8003/docs |

### 주요 API

<details>
<summary><b>Backend (Port 8000)</b></summary>

| Method | Endpoint | 설명 |
|--------|----------|------|
| `POST` | `/auth/login` | 로그인 |
| `POST` | `/auth/signup` | 회원가입 |
| `GET` | `/users/me` | 내 정보 조회 |
| `GET/POST` | `/health-profile/` | 건강 프로필 |
| `GET/POST` | `/drugs/` | 약물 정보 |
| `GET/POST` | `/visits/` | 진료 기록 |
| `GET/POST` | `/schedules/` | 일정 관리 |

</details>

<details>
<summary><b>LLM Service (Port 8001)</b></summary>

| Method | Endpoint | 설명 |
|--------|----------|------|
| `POST` | `/chatbot/query` | AI 챗봇 질의 |
| `POST` | `/chatbot/analysis` | 건강 분석 리포트 |
| `GET` | `/chatbot/sessions` | 대화 세션 목록 |
| `GET` | `/chatbot/sessions/{id}` | 세션 상세 |
| `DELETE` | `/chatbot/sessions/{id}` | 세션 삭제 |

</details>

<details>
<summary><b>STT Service (Port 8002)</b></summary>

| Method | Endpoint | 설명 |
|--------|----------|------|
| `POST` | `/stt/process` | 음성 파일 처리 |
| `GET` | `/health` | 헬스 체크 |

</details>

<details>
<summary><b>OCR Service (Port 8003)</b></summary>

| Method | Endpoint | 설명 |
|--------|----------|------|
| `POST` | `/ocr/process` | 이미지 OCR 처리 |
| `GET` | `/health` | 헬스 체크 |

</details>

---

## 🖥 화면 구성

| 페이지 | 경로 | 설명 |
|--------|------|------|
| 🏠 랜딩 | `/` | 서비스 소개 |
| 🔐 로그인 | `/login` | 사용자 로그인 |
| 📝 회원가입 | `/signup` | 신규 가입 |
| 📊 대시보드 | `/dashboard` | 메인 홈 |
| 💊 건강정보 | `/health-info` | 건강 프로필 관리 |
| 📋 의료기록 | `/history` | 진료/처방 기록 |
| 📈 건강분석 | `/analysis` | AI 건강 분석 |
| 📅 일정관리 | `/schedule` | 진료/복용 일정 |
| 🤖 AI 챗봇 | `/chatbot` | 건강 상담 |
| ⚙️ 설정 | `/settings` | 계정 설정 |

---

## 👥 팀원

<table>
<tr>
<td align="center" width="150px">
<img src="https://via.placeholder.com/100" width="100px" alt=""/>
<br />
<sub><b>팀원 1</b></sub>
<br />
<sub>Backend</sub>
</td>
<td align="center" width="150px">
<img src="https://via.placeholder.com/100" width="100px" alt=""/>
<br />
<sub><b>팀원 2</b></sub>
<br />
<sub>Frontend</sub>
</td>
<td align="center" width="150px">
<img src="https://via.placeholder.com/100" width="100px" alt=""/>
<br />
<sub><b>팀원 3</b></sub>
<br />
<sub>AI/ML</sub>
</td>
<td align="center" width="150px">
<img src="https://via.placeholder.com/100" width="100px" alt=""/>
<br />
<sub><b>팀원 4</b></sub>
<br />
<sub>DevOps</sub>
</td>
</tr>
</table>

---

## 📄 라이선스

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Made with ❤️ by **MediNote Team**

</div>
