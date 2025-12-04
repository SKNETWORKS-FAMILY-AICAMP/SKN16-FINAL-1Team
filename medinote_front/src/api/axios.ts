// src/api/axios.ts

import axios, { AxiosError } from "axios";
import type { InternalAxiosRequestConfig } from "axios";  // ✅ 타입으로만 가져오기
import { API_BASE_URL } from "../utils/config";
import useUserStore from "../store/useUserStore";

// AxiosRequestConfig에 커스텀 플래그(_retry) 추가
declare module "axios" {
  export interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}


// 공용 axios 인스턴스
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
});

// ============================
// 요청 인터셉터
// ============================
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const state = useUserStore.getState();
    const token = state.accessToken;

    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// ============================
// 응답 인터셉터 (401 → 토큰 재발급 & 재시도)
// ============================
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalConfig = error.config as InternalAxiosRequestConfig | undefined;

    // config 없거나, 이미 한 번 재시도 했다면 그대로 실패
    if (!originalConfig || originalConfig._retry) {
      return Promise.reject(error);
    }

    const status = error.response?.status;

    if (status === 401) {
      originalConfig._retry = true;

      const { refreshAccessToken } = useUserStore.getState();

      const newAccessToken = await refreshAccessToken();
      if (!newAccessToken) {
        // 재발급 실패 → 최종적으로 실패
        return Promise.reject(error);
      }

      // 새 토큰으로 Authorization 헤더 업데이트 후 재시도
      originalConfig.headers = originalConfig.headers ?? {};
      originalConfig.headers.Authorization = `Bearer ${newAccessToken}`;

      return apiClient(originalConfig);
    }

    return Promise.reject(error);
  }
);
