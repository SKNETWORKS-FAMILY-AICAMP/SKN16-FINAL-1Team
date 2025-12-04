// src/api/visitsAPI.ts
// Visits (진료기록) endpoints using shared apiClient.

import { apiClient } from "./axios";

export interface VisitPayload {
  hospital: string;
  date: string | null;
  dept: string;
  diagnosis_code: string;
  title: string;
  doctor: string;
  symptoms: string;
  notes: string;
  memo: string;
}

export interface VisitResponse {
  visit_id: number;
  hospital: string;
  date: string;
  dept: string;
  diagnosis_code: string;
  diagnosis_name: string;
  doctor_name: string;
  symptom: string;
  opinion: string;
}

export type ListVisitsResponse = VisitResponse[];

export async function createVisit(payload: VisitPayload): Promise<VisitResponse> {
  const res = await apiClient.post<VisitResponse>("/visits/", payload);
  return res.data;
}

export async function getVisits(): Promise<ListVisitsResponse> {
  const res = await apiClient.get<ListVisitsResponse>("/visits/");
  return res.data;
}

export async function getVisit(visitId: number): Promise<VisitResponse> {
  const res = await apiClient.get<VisitResponse>(`/visits/${visitId}`);
  return res.data;
}

export async function updateVisit(
  visitId: number,
  payload: VisitPayload
): Promise<VisitResponse> {
  const res = await apiClient.patch<VisitResponse>(`/visits/${visitId}`, payload);
  return res.data;
}

export async function deleteVisit(visitId: number): Promise<string> {
  const res = await apiClient.delete<string>(`/visits/${visitId}`);
  return res.data;
}
