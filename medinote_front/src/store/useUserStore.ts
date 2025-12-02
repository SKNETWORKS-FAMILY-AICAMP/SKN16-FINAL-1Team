// src/store/useUserStore.ts

import { create } from "zustand";
import {
  refreshAccessToken as requestTokenRefresh,
  logout as requestLogout,
} from "../api/tokenAPI";

export type UserRole = "admin" | "user";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  expires_in: number; // 초 단위
}

interface StoredAuth {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // ms (Date.now() + expires_in * 1000)
}

interface UserState {
  // --- 인증 상태 ---
  isLoggedIn: boolean;
  user: AuthUser | null;

  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null; // access token 만료 시각 (ms)

  // --- UI 용 모니터링 ---
  isRefreshing: boolean;

  // --- 액션 ---
  setAuth: (user: AuthUser, tokens: AuthTokens) => void;
  clearAuth: () => void;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
  loadAuthFromStorage: () => void;
}

// 🔔 만료 전에 미리 refresh 예약용 타이머
let refreshTimeoutId: ReturnType<typeof setTimeout> | null = null;

const AUTH_STORAGE_KEY = "medinote_auth";

const useUserStore = create<UserState>((set, get) => ({
  // ============================
  // 초기 상태
  // ============================
  isLoggedIn: false,
  user: null,
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
  isRefreshing: false,

  // ============================
  // 인증 정보 설정 (로그인 성공 시)
  // ============================
  setAuth: (user, tokens) => {
    const expiresAt = Date.now() + tokens.expires_in * 1000;

    // 로컬스토리지에 저장
    const stored: StoredAuth = {
      user,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt,
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(stored));

    // 기존 타이머 제거
    if (refreshTimeoutId) {
      clearTimeout(refreshTimeoutId);
      refreshTimeoutId = null;
    }

    // 만료 1분 전에 미리 refresh 시도 (여유 60초)
    const msUntilRefresh = tokens.expires_in * 1000 - 60_000;
    if (msUntilRefresh > 0) {
      refreshTimeoutId = setTimeout(() => {
        // 실패해도 여기선 조용히 처리 (401 인터셉터 쪽이 메인 방어선)
        get()
          .refreshAccessToken()
          .catch((err) => console.error("자동 토큰 재발급 실패:", err));
      }, msUntilRefresh);
    }

    set({
      isLoggedIn: true,
      user,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt,
    });
  },

  // ============================
  // 인증 정보 초기화 (로그아웃 / 실패 시)
  // ============================
  clearAuth: () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    if (refreshTimeoutId) {
      clearTimeout(refreshTimeoutId);
      refreshTimeoutId = null;
    }

    set({
      isLoggedIn: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      isRefreshing: false,
    });
  },

  // ============================
  // Logout (invalidate refresh token + clear local state)
  // ============================
  logout: async () => {
    const refreshToken = get().refreshToken;

    try {
      if (refreshToken) {
        await requestLogout({ refresh_token: refreshToken });
      }
    } catch (err) {
      console.error("Failed to logout:", err);
    } finally {
      get().clearAuth();
    }
  },

  // ============================
  // 앱 시작 시 LocalStorage → 메모리 복원
  // (이제 스토어가 로드될 때 자동으로도 돌게 함)
  // ============================
  loadAuthFromStorage: () => {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return;

      const parsed: StoredAuth = JSON.parse(raw);

      // 만료됐으면 바로 삭제
      if (!parsed.expiresAt || parsed.expiresAt <= Date.now()) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        return;
      }

      // 남은 시간 계산해서 타이머 다시 세팅
      if (refreshTimeoutId) {
        clearTimeout(refreshTimeoutId);
        refreshTimeoutId = null;
      }
      const msUntilRefresh = parsed.expiresAt - Date.now() - 60_000;
      if (msUntilRefresh > 0) {
        refreshTimeoutId = setTimeout(() => {
          get()
            .refreshAccessToken()
            .catch((err) => console.error("자동 토큰 재발급 실패:", err));
        }, msUntilRefresh);
      }

      set({
        isLoggedIn: true,
        user: parsed.user,
        accessToken: parsed.accessToken,
        refreshToken: parsed.refreshToken,
        expiresAt: parsed.expiresAt,
      });
    } catch (err) {
      console.error("auth 복원 실패:", err);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  },

  // ============================
  // Refresh Token으로 Access Token 재발급
  // ============================
  refreshAccessToken: async () => {
    const { refreshToken, isRefreshing } = get();

    // 이미 다른 곳에서 refresh 중이면 중복 요청 방지
    if (isRefreshing) {
      return get().accessToken;
    }

    if (!refreshToken) {
      console.warn("refresh token 없음 → 재발급 불가");
      get().clearAuth();
      return null;
    }

    try {
      set({ isRefreshing: true });

      const { access_token, expires_in } = await requestTokenRefresh({
        refresh_token: refreshToken,
      });

      const expiresAt = Date.now() + expires_in * 1000;

      // 로컬스토리지 갱신
      const currentUser = get().user;
      if (currentUser) {
        const stored: StoredAuth = {
          user: currentUser,
          accessToken: access_token,
          refreshToken,
          expiresAt,
        };
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(stored));
      }

      // 기존 타이머 제거 후 새로 세팅
      if (refreshTimeoutId) {
        clearTimeout(refreshTimeoutId);
        refreshTimeoutId = null;
      }
      const msUntilRefresh = expires_in * 1000 - 60_000;
      if (msUntilRefresh > 0) {
        refreshTimeoutId = setTimeout(() => {
          get()
            .refreshAccessToken()
            .catch((err) => console.error("자동 토큰 재발급 실패:", err));
        }, msUntilRefresh);
      }

      set({
        accessToken: access_token,
        expiresAt,
        isRefreshing: false,
      });

      console.log("🔄 Access Token 재발급 완료");
      return access_token;
    } catch (err) {
      console.error("❌ 토큰 재발급 실패:", err);
      get().clearAuth();
      return null;
    } finally {
      set({ isRefreshing: false });
    }
  },
}));

// ✅ 스토어가 최초로 import 될 때, 한 번 로컬스토리지에서 복원 실행
useUserStore.getState().loadAuthFromStorage();

export default useUserStore;
