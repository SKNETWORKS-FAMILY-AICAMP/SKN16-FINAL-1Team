// src/api/tokenAPI.ts

import axios from "axios";
import { API_BASE_URL } from "../utils/config";

export interface RefreshTokenPayload {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  expires_in: number;
}

export interface LogoutPayload {
  refresh_token: string;
}

export interface LogoutResponse {
  message: string;
}

/**
 * Requests a new access token using the refresh token that was issued at login.
 */
export async function refreshAccessToken(
  payload: RefreshTokenPayload
): Promise<RefreshTokenResponse> {
  const response = await axios.post<RefreshTokenResponse>(
    `${API_BASE_URL}/auth/token/refresh`,
    payload
  );

  return response.data;
}

/**
 * Invalidates the refresh token on the server to complete logout.
 */
export async function logout(
  payload: LogoutPayload
): Promise<LogoutResponse> {
  const response = await axios.post<LogoutResponse>(
    `${API_BASE_URL}/auth/logout`,
    payload
  );

  return response.data;
}
