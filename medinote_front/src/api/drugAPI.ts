// src/api/drugAPI.ts
// Drug endpoints client using shared apiClient.

import { apiClient } from "./axios";

export interface DrugItem {
  drug_id: number;
  med_name: string;
  dosage_form: string;
  dose: string;
  unit: string;
  schedule: string[];
  custom_schedule: string;
  start_date: string;
  end_date: string;
}

export type GetDrugsResponse = DrugItem[];

export interface CreateDrugRequest {
  med_name: string;
  dosage_form: string;
  dose: string;
  unit: string;
  schedule: string[];
  custom_schedule: string;
  start_date: string;
  end_date: string;
}

export type CreateDrugResponse = DrugItem;

export interface UpdateDrugRequest {
  med_name: string;
  dosage_form: string;
  dose: string;
  unit: string;
  schedule: string[];
  custom_schedule: string;
  start_date: string;
  end_date: string;
}

export type UpdateDrugResponse = DrugItem;

export type DeleteDrugResponse = string;

export async function getDrugs(): Promise<GetDrugsResponse> {
  const res = await apiClient.get<GetDrugsResponse>("/drug/");
  return res.data;
}

export async function createDrug(
  payload: CreateDrugRequest
): Promise<CreateDrugResponse> {
  const res = await apiClient.post<CreateDrugResponse>("/drug/", payload);
  return res.data;
}

export async function updateDrug(
  drugId: number,
  payload: UpdateDrugRequest
): Promise<UpdateDrugResponse> {
  const res = await apiClient.patch<UpdateDrugResponse>(
    `/drug/${drugId}`,
    payload
  );
  return res.data;
}

export async function deleteDrug(drugId: number): Promise<DeleteDrugResponse> {
  const res = await apiClient.delete<DeleteDrugResponse>(`/drug/${drugId}`);
  return res.data;
}
