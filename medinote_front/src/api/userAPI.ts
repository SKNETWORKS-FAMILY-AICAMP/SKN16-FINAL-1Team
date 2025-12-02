// src/api/userAPI.ts
// Typed API client for User endpoints based on the provided backend spec.

import { apiClient } from "./axios";

// =========
// Types
// =========

export interface UserDto {
  email: string;
  name: string;
  role: string;
  user_id: number;
  avatar: string;
}

export type GetUsersResponse = UserDto[];

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role: "user";
}

export type CreateUserResponse = UserDto;

export type GetMeResponse = UserDto;

export interface UpdateMeRequest {
  name: string;
  avatar: string;
}

export type UpdateMeResponse = UserDto;

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export type ChangePasswordResponse = string;

export type DeleteMeResponse = string;

// =========
// API calls (axios)
// =========

export async function getUsers(): Promise<GetUsersResponse> {
  const res = await apiClient.get<GetUsersResponse>("/users");
  return res.data;
}

export async function createUser(
  payload: CreateUserRequest
): Promise<CreateUserResponse> {
  const res = await apiClient.post<CreateUserResponse>("/users", payload);
  return res.data;
}

export async function getMe(): Promise<GetMeResponse> {
  const res = await apiClient.get<GetMeResponse>("/user/me");
  return res.data;
}

export async function updateMe(
  payload: UpdateMeRequest
): Promise<UpdateMeResponse> {
  const res = await apiClient.patch<UpdateMeResponse>("/user/me", payload);
  return res.data;
}

export async function deleteMe(): Promise<DeleteMeResponse> {
  const res = await apiClient.delete<DeleteMeResponse>("/user/me");
  return res.data;
}

export async function changeMyPassword(
  payload: ChangePasswordRequest
): Promise<ChangePasswordResponse> {
  const res = await apiClient.patch<ChangePasswordResponse>(
    "/user/me/password",
    payload
  );
  return res.data;
}

/*
// =========
// React Query examples (optional)
// Requires: npm install @tanstack/react-query
// =========
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
//
// export const useUsersQuery = () =>
//   useQuery({ queryKey: ["users"], queryFn: getUsers });
//
// export const useCreateUserMutation = () => {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: createUser,
//     onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
//   });
// };
//
// export const useMeQuery = () =>
//   useQuery({ queryKey: ["me"], queryFn: getMe, staleTime: 5 * 60 * 1000 });
*/
