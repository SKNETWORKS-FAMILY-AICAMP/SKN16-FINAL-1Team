// src/api/schedule.ts
// Schedule endpoints client using shared apiClient.

import { apiClient } from "./axios";

export interface ScheduleResponse {
  id: string; // 백엔드는 "sch_12" 같은 문자열을 주지만
  title: string;
  type: string;
  date: string; // YYYY-MM-DD
  time: string;
  location: string;
  memo: string;
  created_at: string;
}

export interface CreateScheduleRequest {
  title: string;
  type: string;
  date: string;
  time: string;
  location: string;
  memo: string;
}

export type CreateScheduleResponse = ScheduleResponse;

export interface UpdateScheduleRequest {
  title?: string;
  date?: string;
  time?: string;
  location?: string;
  memo?: string;
}

export type UpdateScheduleResponse = ScheduleResponse;

export type GetSchedulesResponse = ScheduleResponse[];

// 🔥 여기서 "sch_12" → 12 로 변환
function toSchedulePathId(id: string | number): number | string {
  if (typeof id === "number") return id;

  // 예: "sch_12" → "12"
  const match = id.match(/\d+$/);
  if (match) {
    return Number(match[0]);
  }

  // 혹시 패턴이 다르면 그냥 원본 반환 (디버깅용)
  return id;
}

export async function getSchedules(): Promise<GetSchedulesResponse> {
  const res = await apiClient.get<GetSchedulesResponse>("/schedule/");
  return res.data;
}

export async function getSchedule(
  scheduleId: string | number
): Promise<ScheduleResponse> {
  const pathId = toSchedulePathId(scheduleId);
  const res = await apiClient.get<ScheduleResponse>(`/schedule/${pathId}`);
  return res.data;
}

export async function createSchedule(
  payload: CreateScheduleRequest
): Promise<CreateScheduleResponse> {
  const res = await apiClient.post<CreateScheduleResponse>("/schedule/", payload);
  return res.data;
}

export async function updateSchedule(
  scheduleId: string | number,
  payload: UpdateScheduleRequest
): Promise<UpdateScheduleResponse> {
  const pathId = toSchedulePathId(scheduleId);
  const res = await apiClient.patch<UpdateScheduleResponse>(
    `/schedule/${pathId}`,
    payload
  );
  return res.data;
}

export async function deleteSchedule(
  scheduleId: string | number
): Promise<string> {
  const pathId = toSchedulePathId(scheduleId);
  const res = await apiClient.delete<string>(`/schedule/${pathId}`);
  return res.data;
}
