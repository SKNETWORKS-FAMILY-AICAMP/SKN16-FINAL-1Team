// src/store/useHealthDataStore.ts

import { create } from "zustand";
import { persist } from "zustand/middleware";

// 기본정보 타입
interface BasicInfoForm {
  birth: string;
  gender: "남성" | "여성";
  height: string;
  weight: string;
  bloodType: string;
  smoke: string;
  drink: string;
}

// 질환정보 타입
export interface Disease {
  id: string;
  name: string;
  type: "chronic" | "simple";
  meds: string;
}

// 약 정보 타입
export interface Medication {
  // ✅ 백엔드에서 내려오는 id(drug_id, prescription_id)를 문자열로 변환해서 사용
  id: string;
  name: string;
  type: "prescription" | "supplement";
  // 🔧 백엔드/프론트 옵션(캡슐, 정제, 시럽 등)을 모두 수용할 수 있게 string 으로 완화
  dosageForm: string;
  dose: string;
  unit: string;
  schedule: string;   // 예: "아침, 저녁"
  startDate: string;  // YYYY-MM-DD
  endDate: string;    // YYYY-MM-DD
}

// 알러지 타입
export interface Allergy {
  id: string;
  name: string;
}

// 전체 건강 데이터 스토어 타입
interface HealthDataState {
  basicInfo: BasicInfoForm;
  diseases: Disease[];
  medications: Medication[];
  allergies: Allergy[];
  currentDate: string; // 날짜 연동용

  // Actions
  updateBasicInfo: (newInfo: BasicInfoForm) => void;

  addDisease: (disease: Omit<Disease, "id">) => void;
  updateDisease: (id: string, patch: Partial<Omit<Disease, "id">>) => void;
  deleteDisease: (id: string) => void;

  // ✅ 약은 이제 id까지 포함해서 통째로 넘겨 받는다 (백엔드 id 그대로 사용)
  addMedication: (med: Medication) => void;
  updateMedication: (id: string, patch: Partial<Omit<Medication, "id">>) => void;
  deleteMedication: (id: string) => void;

  addAllergy: (allergy: Omit<Allergy, "id">) => void;
  updateAllergy: (id: string, patch: Partial<Omit<Allergy, "id">>) => void;
  deleteAllergy: (id: string) => void;

  updateCurrentDate: (date: string) => void;

  // 전체 리셋 (로그아웃 시 등)
  resetAll: () => void;
}

const today = () => new Date().toISOString().split("T")[0];

const defaultBasicInfo: BasicInfoForm = {
  birth: "",
  gender: "여성",
  height: "",
  weight: "",
  bloodType: "",
  smoke: "",
  drink: "",
};

const useHealthDataStore = create<HealthDataState>()(
  persist(
    (set, get) => ({
      // ✅ 초기 상태 (더미 데이터 제거)
      basicInfo: defaultBasicInfo,
      diseases: [],
      medications: [],
      allergies: [],
      currentDate: today(),

      // ===== 기본 정보 =====
      updateBasicInfo: (newInfo) => set({ basicInfo: newInfo }),

      // ===== 질환 =====
      addDisease: (disease) =>
        set((state) => ({
          diseases: [
            ...state.diseases,
            { id: `d_${Date.now()}`, ...disease },
          ],
        })),

      updateDisease: (id, patch) =>
        set((state) => ({
          diseases: state.diseases.map((d) =>
            d.id === id ? { ...d, ...patch } : d
          ),
        })),

      deleteDisease: (id) =>
        set((state) => ({
          diseases: state.diseases.filter((d) => d.id !== id),
        })),

      // ===== 약 정보 =====
      // ✅ id 는 외부에서 전달된 값을 그대로 사용 (더 이상 여기서 m_... 생성 안 함)
      addMedication: (med) =>
        set((state) => ({
          medications: [...state.medications, med],
        })),

      updateMedication: (id, patch) =>
        set((state) => ({
          medications: state.medications.map((m) =>
            m.id === id ? { ...m, ...patch } : m
          ),
        })),

      deleteMedication: (id) =>
        set((state) => ({
          medications: state.medications.filter((m) => m.id !== id),
        })),

      // ===== 알러지 =====
      addAllergy: (allergy) =>
        set((state) => ({
          allergies: [
            ...state.allergies,
            { id: `a_${Date.now()}`, ...allergy },
          ],
        })),

      updateAllergy: (id, patch) =>
        set((state) => ({
          allergies: state.allergies.map((a) =>
            a.id === id ? { ...a, ...patch } : a
          ),
        })),

      deleteAllergy: (id) =>
        set((state) => ({
          allergies: state.allergies.filter((a) => a.id !== id),
        })),

      // ===== 기타 =====
      updateCurrentDate: (date) => set({ currentDate: date }),

      resetAll: () =>
        set({
          basicInfo: defaultBasicInfo,
          diseases: [],
          medications: [],
          allergies: [],
          currentDate: today(),
        }),
    }),
    {
      name: "medinote_health", // 🔐 localStorage key
      partialize: (state) => ({
        basicInfo: state.basicInfo,
        diseases: state.diseases,
        medications: state.medications,
        allergies: state.allergies,
        currentDate: state.currentDate,
      }),
    }
  )
);

export default useHealthDataStore;
