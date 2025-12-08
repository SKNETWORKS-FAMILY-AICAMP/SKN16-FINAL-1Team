// src/utils/config.ts

export const API_BASE_URL = import.meta.env.VITE_API_URL as string;          // 백엔드
export const CHATBOT_API_BASE_URL = import.meta.env.VITE_CHATBOT_API_URL as string; // 챗봇 서버
// 🔹 OCR 전용 베이스 URL (AI_service_ocr 서버, uvicorn 8003)
export const OCR_API_BASE_URL =
  import.meta.env.VITE_OCR_API_URL ?? "http://localhost:8003";