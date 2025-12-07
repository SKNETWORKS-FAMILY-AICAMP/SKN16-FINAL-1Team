// src/api/chatbotAPI.ts
// Chatbot endpoints client using chatbotClient (AI_service_LLM 서버용)

import { chatbotClient } from "./chatbotAxios";

/* ==============================
 * 타입 정의
 * ============================== */

export interface ChatQueryRequest {
  session_id: number; // 0이면 새 세션, 0이 아니면 기존 세션에 이어서 질문
  query: string;
}

export interface ChatQueryResponse {
  session_id: number;
  answer: string;
}

export interface SessionItem {
  session_id: number;
  title: string;
  created_at: string;
}

export interface SessionsResponse {
  sessions: SessionItem[];
}

export interface SessionMessage {
  role: string;       // "user" | "assistant" 예상
  content: string;
  created_at: string;
}

export interface SessionDetailResponse {
  session_id: number;
  messages: SessionMessage[];
}

// DELETE /chatbot/sessions, DELETE /chatbot/sessions/{session_id} 는
// 200 "string" 형태라고 했으니 string으로 받자.
export type DeleteAllSessionsResponse = string;
export type DeleteOneSessionResponse = string;

/* ==============================
 * API 함수들
 * ============================== */

/**
 * POST /chatbot/query
 * 요청: { session_id, query }
 * 응답: { session_id, answer }
 */
export async function postChatbotQuery(
  payload: ChatQueryRequest
): Promise<ChatQueryResponse> {
  const res = await chatbotClient.post<ChatQueryResponse>("/chatbot/query", payload);
  return res.data;
}

/**
 * GET /chatbot/sessions
 * 응답: { sessions: [ { session_id, title, created_at } ] }
 */
export async function getChatbotSessions(): Promise<SessionsResponse> {
  const res = await chatbotClient.get<SessionsResponse>("/chatbot/sessions");
  return res.data;
}

/**
 * DELETE /chatbot/sessions
 * 응답: 200 "string"
 */
export async function deleteAllChatbotSessions(): Promise<DeleteAllSessionsResponse> {
  const res = await chatbotClient.delete<DeleteAllSessionsResponse>("/chatbot/sessions");
  return res.data;
}

/**
 * GET /chatbot/sessions/{session_id}
 * 응답: { session_id, messages: [ { role, content, created_at } ] }
 */
export async function getChatbotSessionDetail(
  sessionId: number
): Promise<SessionDetailResponse> {
  const res = await chatbotClient.get<SessionDetailResponse>(
    `/chatbot/sessions/${sessionId}`
  );
  return res.data;
}

/**
 * DELETE /chatbot/sessions/{session_id}
 * 응답: 200 "string"
 */
export async function deleteOneChatbotSession(
  sessionId: number
): Promise<DeleteOneSessionResponse> {
  const res = await chatbotClient.delete<DeleteOneSessionResponse>(
    `/chatbot/sessions/${sessionId}`
  );
  return res.data;
}

/* ==============================
 * 건강 분석 API (챗봇 이력 저장 X)
 * ============================== */

export interface HealthAnalysisResponse {
  analysis: string;
}

/**
 * POST /chatbot/analysis
 * 건강 분석 리포트 요청 (대화 이력 저장 안 함)
 * 응답: { analysis: string }
 */
export async function postHealthAnalysis(): Promise<HealthAnalysisResponse> {
  const res = await chatbotClient.post<HealthAnalysisResponse>("/chatbot/analysis");
  return res.data;
}
