// src/api/authAPI.ts

import { apiClient } from "./axios";
import type { AuthUser } from "../store/useUserStore";

export interface SignupPayload {
  email: string;
  password: string;
  name: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: AuthUser;
  tokens: {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
  };
}

export interface RefreshResponse {
  access_token: string;
  expires_in: number;
}

// ============================
// 회원가입
// ============================
export async function signup(payload: SignupPayload): Promise<void> {
  await apiClient.post("/auth/signup", payload);
}

// ============================
// 로그인
// ============================
export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const res = await apiClient.post<LoginResponse>("/auth/login", payload);
  return res.data;
}

// ============================
// (선택) 토큰 재발급 래퍼
// useUserStore.refreshAccessToken에서 직접 axios를 쓰고 있어서
// 지금은 필수는 아니지만, 필요하면 이렇게도 쓸 수 있음.
// ============================
export async function refreshToken(
  refreshToken: string
): Promise<RefreshResponse> {
  const res = await apiClient.post<RefreshResponse>("/auth/token/refresh", {
    refresh_token: refreshToken,
  });
  return res.data;
}
