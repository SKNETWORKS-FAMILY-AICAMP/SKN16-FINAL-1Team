// src/store/useScheduleStore.ts

import { create } from "zustand";

export type ScheduleType = "진료" | "검사";

export type ScheduleItem = {
  id: string;
  date: string;   // YYYY-MM-DD
  time: string;   // HH:MM
  type: ScheduleType;
  title: string;
  location?: string;
  memo?: string;
};

type ScheduleState = {
  schedules: ScheduleItem[];
  addSchedule: (item: Omit<ScheduleItem, "id">) => void;
  updateSchedule: (
    id: string,
    patch: Partial<Omit<ScheduleItem, "id">>
  ) => void;
  deleteSchedule: (id: string) => void;
};

const useScheduleStore = create<ScheduleState>((set) => ({
  // ✅ 더미 데이터 제거, 처음엔 빈 배열
  schedules: [],

  addSchedule: (item) =>
    set((state) => ({
      schedules: [...state.schedules, { id: `s_${Date.now()}`, ...item }],
    })),

  updateSchedule: (id, patch) =>
    set((state) => ({
      schedules: state.schedules.map((s) =>
        s.id === id ? { ...s, ...patch } : s
      ),
    })),

  deleteSchedule: (id) =>
    set((state) => ({
      schedules: state.schedules.filter((s) => s.id !== id),
    })),
}));

export default useScheduleStore;
