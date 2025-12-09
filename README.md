# MediNote - AI 기반 개인 건강 관리 서비스

> 음성 녹음, OCR, AI 챗봇을 활용한 스마트 건강 기록 관리 플랫폼

## 프로젝트 소개

MediNote는 바쁜 현대인들이 자신의 건강 정보를 쉽고 편리하게 기록하고 관리할 수 있도록 돕는 AI 기반 헬스케어 서비스입니다.
진료 내용을 음성으로 녹음하면 AI가 자동으로 텍스트로 변환하고 요약해주며, 처방전 사진을 찍으면 OCR로 약 정보를 자동 추출합니다.
또한 RAG 기반 AI 챗봇이 사용자의 건강 정보를 바탕으로 맞춤형 건강 상담을 제공합니다.

## 주요 기능

### 1. 건강 정보 관리
- 질환 정보 (만성질환/급성질병) 등록 및 관리
- 복약 정보 (처방약/영양제) 등록 및 관리
- 알러지 정보 등록 및 관리
- 오늘의 복약 체크리스트

### 2. 진료 기록 관리
- 진료 기록 직접 입력
- **음성 녹음 → STT 변환 → AI 요약** (Whisper + GPT)
- **처방전 OCR** → 약 정보 자동 추출
- **진료내역 OCR** → 진료내역서 내용 추출
 
### 3. AI 건강 챗봇
- RAG 기반 맞춤형 건강 상담
- 사용자 건강 정보 연동 답변
- 약/질병 관련 전문 지식 검색

### 4. 건강 분석
- 복약 현황 시각화
- 건강 데이터 통계


## 기술 스택

### Frontend
| 기술 | 버전 | 설명 |
|------|------|------|
| React | 18.x | UI 라이브러리 |
| TypeScript | 5.x | 타입 안정성 |
| Tailwind CSS | 3.x | 스타일링 |
| Zustand | 4.x | 상태 관리 |
| React Router | 6.x | 라우팅 |
| Axios | 1.x | HTTP 클라이언트 |

### Backend
| 기술 | 버전 | 설명 |
|------|------|------|
| FastAPI | 0.100+ | API 서버 |
| Python | 3.11 | 백엔드 언어 |
| PostgreSQL | 15.x | 메인 데이터베이스 |
| ChromaDB | - | 벡터 데이터베이스 |
| LangChain | - | LLM 오케스트레이션 |

### AI/ML
| 기술 | 설명 |
|------|------|
| OpenAI Whisper | 음성 → 텍스트 변환 (STT) |
| OpenAI GPT-4 | 요약, 챗봇 응답 생성 |
| Sentence Transformers | 문서 임베딩 |

### Infrastructure
| 기술 | 설명 |
|------|------|
| Docker | 컨테이너화 |
| Docker Compose | 멀티 컨테이너 오케스트레이션 |
| AWS EC2 | 서버 호스팅 |

## 시스템 아키텍처

![System Architecture](./docs/architecture.png)

<!-- 이미지 생성: https://mermaid.live 에서 아래 코드로 PNG 생성 후 docs/architecture.png 저장 -->

## 프로젝트 구조

```
SKN16-FINAL-1Team/
├── medinote_front/                  # React 프론트엔드 (웹 UI)
│   ├── src/
│   │   ├── components/              # 재사용 컴포넌트
│   │   ├── pages/                   # 페이지 컴포넌트
│   │   ├── api/                     # API 호출 함수
│   │   ├── store/                   # Zustand 스토어
│   │   └── utils/                   # 유틸리티 함수
│   └── Dockerfile
│
├── AI_service_LLM/                  # LLM 챗봇 서비스
│   ├── chatbot/
│   │   ├── core/                    # 핵심 로직 (orchestrator, state, routing 등)
│   │   └── prompts.py               # 프롬프트 템플릿
│   └── Dockerfile
│
├── AI_service_stt/                  # STT 서비스
│   └── Dockerfile
│
├── AI_service_ocr/                  # 🔥 OCR 서비스 (신규 추가)
│   ├── api/                         # FastAPI OCR 엔드포인트
│   ├── core/                        # PaddleOCR 실행 로직 + GPT 정제 로직
│   ├── models/                      # 결과 스키마 정의
│   ├── utils/                       # 파일 저장/전처리/후처리
│   └── Dockerfile                   # OCR 전용 Docker 환경
│
├── medinote_backend/                # FastAPI 백엔드 (메인 API Gateway)
│   ├── app/
│   │   ├── routers/                 # API 라우터 (STT, OCR, Chatbot 등 연동)
│   │   ├── models/                  # DB 모델
│   │   └── services/                # 비즈니스 로직
│   └── Dockerfile
│
├── docker-compose.yml               # 모든 서비스 컨테이너 선언
└── README.md

```

## 설치 및 실행

### 사전 요구사항
- Docker & Docker Compose
- Node.js 18+ (로컬 개발 시)
- Python 3.11+ (로컬 개발 시)
- OCR은 python 3.10+ (로컬개발시)
### 환경 변수 설정

```bash
# .env 파일 생성
cp .env.example .env

# 필수 환경 변수
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=postgresql://user:password@db:5432/medinote
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
```

### Docker로 실행

```bash
# 전체 서비스 실행
docker-compose up -d --build

# 로그 확인
docker-compose logs -f

# 서비스 중지
docker-compose down
```

### 로컬 개발 (프론트엔드)

```bash
cd medinote_front
npm install
npm run dev
```

