FROM node:20-alpine

WORKDIR /app

# 🔧 Vite용 API URL (build 시에 주입)
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
ENV NODE_ENV=production

# 패키지 설치
COPY package*.json ./
RUN npm ci

# 소스 복사 및 빌드
COPY . .
RUN npm run build

# Vite preview 서버 포트 (기본 4173)
EXPOSE 4173

# 🔥 빌드된 정적 파일을 Vite preview 서버로 서빙
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4173"]