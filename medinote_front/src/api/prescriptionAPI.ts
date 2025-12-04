// src/api/prescriptionAPI.ts
// Prescription endpoints client using shared apiClient.

import { apiClient } from "./axios";

// ==============================
// Types
// ==============================

// ✅ 백엔드 응답(JSON) 그대로 맞춘 타입 (snake_case)
export interface PrescriptionItem {
  prescription_id: number;
  med_name: string;
  dosage_form: string;
  dose: string;
  unit: string;
  schedule: string[];
  custom_schedule: string | null;
  start_date: string; // "YYYY-MM-DD"
  end_date: string;   // "YYYY-MM-DD"
  visit_id: number;
}

export type GetPrescriptionsResponse = PrescriptionItem[];
export type GetPrescriptionsByVisitResponse = PrescriptionItem[];

// ✅ POST /prescription/visit/{visit_id} 요청 바디 (camelCase 필드 주의)
//   FastAPI PrescriptionCreate 와 정확히 일치해야 함
export interface CreatePrescriptionRequest {
  med_name: string;
  dosageForm: string;
  dose: string;
  unit: string;
  schedule: string[];
  customSchedule?: string | null;
  startDate: string; // "YYYY-MM-DD"
  endDate: string;   // "YYYY-MM-DD"
}

export type CreatePrescriptionResponse = PrescriptionItem;

// ✅ PATCH /prescription/{prescription_id} 요청 바디 (모두 optional)
//   FastAPI PrescriptionUpdate 와 필드명 1:1 매칭
export interface UpdatePrescriptionRequest {
  med_name?: string;
  dosageForm?: string;
  dose?: string;
  unit?: string;
  schedule?: string[];
  customSchedule?: string | null;
  startDate?: string; // "YYYY-MM-DD"
  endDate?: string;   // "YYYY-MM-DD"
}

export type UpdatePrescriptionResponse = PrescriptionItem;

export type DeletePrescriptionResponse = string;

// ==============================
// API Functions
// ==============================

// GET /prescription/
// 전체 처방 목록 조회
export async function getPrescriptions(): Promise<GetPrescriptionsResponse> {
  const res = await apiClient.get<GetPrescriptionsResponse>("/prescription/");
  return res.data;
}

// GET /prescription/visit/{visit_id}
// 특정 진료(visit)에 대한 처방 목록 조회
export async function getPrescriptionsByVisit(
  visitId: number
): Promise<GetPrescriptionsByVisitResponse> {
  const res = await apiClient.get<GetPrescriptionsByVisitResponse>(
    `/prescription/visit/${visitId}`
  );
  return res.data;
}

// POST /prescription/visit/{visit_id}
// 특정 진료(visit)에 처방 추가
export async function createPrescription(
  visitId: number,
  payload: CreatePrescriptionRequest
): Promise<CreatePrescriptionResponse> {
  const res = await apiClient.post<CreatePrescriptionResponse>(
    `/prescription/visit/${visitId}`,
    payload
  );
  return res.data;
}

// PATCH /prescription/{prescription_id}
// 처방 일부 수정 (부분 업데이트)
export async function updatePrescription(
  prescriptionId: number,
  payload: UpdatePrescriptionRequest
): Promise<UpdatePrescriptionResponse> {
  const res = await apiClient.patch<UpdatePrescriptionResponse>(
    `/prescription/${prescriptionId}`,
    payload
  );
  return res.data;
}

// DELETE /prescription/{prescription_id}
// 처방 삭제
export async function deletePrescription(
  prescriptionId: number
): Promise<DeletePrescriptionResponse> {
  const res = await apiClient.delete<DeletePrescriptionResponse>(
    `/prescription/${prescriptionId}`
  );
  return res.data;
}
