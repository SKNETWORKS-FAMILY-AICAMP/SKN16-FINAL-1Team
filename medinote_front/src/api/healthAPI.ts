// src/api/healthAPI.ts
// Health endpoints client based on provided spec. Uses shared apiClient.

import { apiClient } from "./axios";

// ============================
// Health Profile
// ============================
export interface HealthProfileRequest {
  birth: string;
  gender: string;
  blood_type: string;
  height: number;
  weight: number;
  drinking: string;
  smoking: string;
}

export interface HealthProfileResponse {
  birth: string;
  gender: string;
  blood_type: string;
  height: number;
  weight: number;
  drinking: string;
  smoking: string;
  profile_id: number;
  user_id: number;
}

export async function getHealthProfile(): Promise<HealthProfileResponse> {
  const res = await apiClient.get<HealthProfileResponse>("/health");
  return res.data;
}

export async function createHealthProfile(
  payload: HealthProfileRequest
): Promise<HealthProfileResponse> {
  const res = await apiClient.post<HealthProfileResponse>("/health", payload);
  return res.data;
}

export async function updateHealthProfile(
  payload: HealthProfileRequest
): Promise<HealthProfileResponse> {
  const res = await apiClient.put<HealthProfileResponse>("/health", payload);
  return res.data;
}

// ============================
// Allergy
// ============================
export interface AllergyCreateRequest {
  allergy_name: string;
  user_id: number;
}

export interface AllergyResponse {
  allergy_name: string;
  allergy_id: number;
  user_id: number;
  created_at: string;
}

export interface AllergyUpdateRequest {
  allergy_name: string;
}

export async function getAllergies(): Promise<AllergyResponse[]> {
  const res = await apiClient.get<AllergyResponse[]>("/health/allergy");
  return res.data;
}

export async function createAllergy(
  payload: AllergyCreateRequest
): Promise<AllergyResponse> {
  const res = await apiClient.post<AllergyResponse>(
    "/health/allergy",
    payload
  );
  return res.data;
}

export async function updateAllergy(
  allergyId: number,
  payload: AllergyUpdateRequest
): Promise<AllergyResponse> {
  const res = await apiClient.put<AllergyResponse>(
    `/health/allergy/${allergyId}`,
    payload
  );
  return res.data;
}

export async function deleteAllergy(allergyId: number): Promise<string> {
  const res = await apiClient.delete<string>(`/health/allergy/${allergyId}`);
  return res.data;
}

// ============================
// Chronic Disease
// ============================
export interface ChronicCreateRequest {
  disease_name: string;
  note: string;
  user_id: number;
}

export interface ChronicResponse {
  disease_name: string;
  note: string;
  chronic_id: number;
  user_id: number;
}

export interface ChronicUpdateRequest {
  disease_name: string;
  note: string;
}

export async function getChronics(): Promise<ChronicResponse[]> {
  const res = await apiClient.get<ChronicResponse[]>("/health/chronic");
  return res.data;
}

export async function createChronic(
  payload: ChronicCreateRequest
): Promise<ChronicResponse> {
  const res = await apiClient.post<ChronicResponse>(
    "/health/chronic",
    payload
  );
  return res.data;
}

export async function updateChronic(
  chronicId: number,
  payload: ChronicUpdateRequest
): Promise<ChronicResponse> {
  const res = await apiClient.put<ChronicResponse>(
    `/health/chronic/${chronicId}`,
    payload
  );
  return res.data;
}

export async function deleteChronic(chronicId: number): Promise<string> {
  const res = await apiClient.delete<string>(`/health/chronic/${chronicId}`);
  return res.data;
}

// ============================
// Acute Disease
// ============================
export interface AcuteCreateRequest {
  disease_name: string;
  note: string;
  user_id: number;
}

export interface AcuteResponse {
  disease_name: string;
  note: string;
  acute_id: number;
  user_id: number;
}

export interface AcuteUpdateRequest {
  disease_name: string;
  note: string;
}

export async function getAcutes(): Promise<AcuteResponse[]> {
  const res = await apiClient.get<AcuteResponse[]>("/health/acute");
  return res.data;
}

export async function createAcute(
  payload: AcuteCreateRequest
): Promise<AcuteResponse> {
  const res = await apiClient.post<AcuteResponse>("/health/acute", payload);
  return res.data;
}

export async function updateAcute(
  acuteId: number,
  payload: AcuteUpdateRequest
): Promise<AcuteResponse> {
  const res = await apiClient.put<AcuteResponse>(
    `/health/acute/${acuteId}`,
    payload
  );
  return res.data;
}

export async function deleteAcute(acuteId: number): Promise<string> {
  const res = await apiClient.delete<string>(`/health/acute/${acuteId}`);
  return res.data;
}
