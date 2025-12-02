// src/components/domain/HealthInfo/AllergyInfoTab.tsx

import React, { useState, useEffect } from "react";
import { HiOutlineExclamationCircle, HiOutlinePlus } from "react-icons/hi";
import AllergyModal from "./AllergyModal";
import AllergyDetailModal from "./AllergyDetailModal";
import useHealthDataStore, { type Allergy } from "../../../store/useHealthDataStore";
import useUserStore from "../../../store/useUserStore";
import { toast } from "react-toastify";
import {
  getAllergies,
  createAllergy,
  updateAllergy as updateAllergyApi,
  deleteAllergy as deleteAllergyApi,
} from "../../../api/healthAPI";

export default function AllergyInfoTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState<Allergy | null>(null);
  const allergies = useHealthDataStore((state) => state.allergies);
  const userId = useUserStore((s) => s.user?.id);

  useEffect(() => {
    const fetchAllergies = async () => {
      try {
        const data = await getAllergies();
        const mapped: Allergy[] = data.map((item) => ({
          id: String(item.allergy_id),
          name: item.allergy_name,
        }));
        useHealthDataStore.setState({ allergies: mapped });
      } catch (err) {
        console.error("알레르기 목록 불러오기 실패:", err);
        toast.error("알레르기 정보를 불러오지 못했습니다.");
      }
    };
    fetchAllergies();
  }, []);

  useEffect(() => {
    const addAllergy = async (allergy: Omit<Allergy, "id">) => {
      if (!userId) {
        toast.error("로그인이 필요합니다.");
        return;
      }
      try {
        const res = await createAllergy({
          allergy_name: allergy.name,
          user_id: userId,
        });
        const mapped: Allergy = { id: String(res.allergy_id), name: res.allergy_name };
        useHealthDataStore.setState((state) => ({
          allergies: [...state.allergies, mapped],
        }));
        toast.success("알레르기가 추가되었습니다.");
      } catch (err) {
        console.error("알레르기 추가 실패:", err);
        toast.error("알레르기 추가에 실패했습니다.");
      }
    };

    const updateAllergy = async (id: string, patch: Partial<Omit<Allergy, "id">>) => {
      const current = useHealthDataStore.getState().allergies.find((a) => a.id === id);
      const nextName = patch.name ?? current?.name;
      if (!nextName) {
        toast.error("알레르기명이 없습니다.");
        return;
      }
      try {
        await updateAllergyApi(Number(id), { allergy_name: nextName });
        useHealthDataStore.setState((state) => ({
          allergies: state.allergies.map((a) => (a.id === id ? { ...a, name: nextName } : a)),
        }));
        toast.success("알레르기가 수정되었습니다.");
      } catch (err) {
        console.error("알레르기 수정 실패:", err);
        toast.error("알레르기 수정에 실패했습니다.");
      }
    };

    const deleteAllergy = async (id: string) => {
      try {
        await deleteAllergyApi(Number(id));
        useHealthDataStore.setState((state) => ({
          allergies: state.allergies.filter((a) => a.id !== id),
        }));
        toast.success("알레르기가 삭제되었습니다.");
      } catch (err) {
        console.error("알레르기 삭제 실패:", err);
        toast.error("알레르기 삭제에 실패했습니다.");
      }
    };

    useHealthDataStore.setState((state) => ({
      ...state,
      addAllergy,
      updateAllergy,
      deleteAllergy,
    }));
  }, [userId]);

  return (
    <>
      <div className="w-full bg-white rounded-lg shadow-lg">
        <div className="flex items-center gap-2 p-4">
          <HiOutlineExclamationCircle className="text-alert-icon text-2xl" />
          <div>
            <h3 className="text-lg font-bold text-dark-gray">알러지 정보</h3>
            <p className="text-sm text-gray-500">주의해야 할 알러지를 기록해요</p>
          </div>
        </div>

        <div className="space-y-3 p-4 pt-0">
          {allergies.length > 0 ? (
            allergies.map((allergy) => (
              <AllergyItem key={allergy.id} name={allergy.name} onClick={() => setSelected(allergy)} />
            ))
          ) : (
            <p className="text-sm text-gray-400 text-center p-2">추가된 알러지 정보가 없습니다.</p>
          )}
        </div>
      </div>

      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full flex items-center justify-center gap-2 p-4 mt-6 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-mint hover:text-mint transition-all"
      >
        <HiOutlinePlus /> 알러지 추가하기
      </button>

      {isModalOpen && <AllergyModal onClose={() => setIsModalOpen(false)} />}
      {selected && <AllergyDetailModal allergy={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

type ItemProps = { name: string; onClick?: () => void };
function AllergyItem({ name, onClick }: ItemProps) {
  return (
    <div className="flex items-center gap-3 bg-alert-bg p-3 rounded-md cursor-pointer hover:bg-red-50" onClick={onClick}>
      <HiOutlineExclamationCircle className="text-alert-icon text-xl flex-shrink-0" />
      <span className="font-semibold text-dark-gray">{name}</span>
    </div>
  );
}
