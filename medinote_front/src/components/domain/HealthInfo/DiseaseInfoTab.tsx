// src/components/domain/HealthInfo/DiseaseInfoTab.tsx

import React, { useState, useEffect } from "react";
import {
  HiOutlinePlus,
  HiOutlineFire,
  HiOutlineLightningBolt,
} from "react-icons/hi";
import DiseaseModal from "./DiseaseModal";
import DiseaseDetailModal from "./DiseaseDetailModal";
import useHealthDataStore, { type Disease } from "../../../store/useHealthDataStore";
import useUserStore from "../../../store/useUserStore";
import { toast } from "react-toastify";
import {
  getChronics,
  getAcutes,
  createChronic,
  createAcute,
  updateChronic,
  updateAcute,
  deleteChronic,
  deleteAcute,
  type ChronicResponse,
  type AcuteResponse,
} from "../../../api/healthAPI";

type Filter = "all" | "chronic" | "simple";
type ModalState = {
  isOpen: boolean;
  defaultType: "chronic" | "simple";
};

export default function DiseaseInfoTab() {
  const [filter, setFilter] = useState<Filter>("all");
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    defaultType: "chronic",
  });
  const [selected, setSelected] = useState<Disease | null>(null);

  const diseases = useHealthDataStore((state) => state.diseases);
  const userId = useUserStore((s) => s.user?.id);

  // ============================
  // 초기 로드: 만성 + 급성 불러오기
  // ============================
  useEffect(() => {
    const fetchDiseases = async () => {
      try {
        const [chronics, acutes] = await Promise.all([
          getChronics(),
          getAcutes(),
        ]);

        const mapped: Disease[] = [
          ...chronics.map(mapChronicToDisease),
          ...acutes.map(mapAcuteToDisease),
        ];

        useHealthDataStore.setState({ diseases: mapped });
      } catch (err) {
        console.error("질환 목록 불러오기 실패:", err);
        toast.error("질환 정보를 불러오지 못했습니다.");
      }
    };
    fetchDiseases();
  }, []);

  // ============================
  // 스토어 액션을 API 기반으로 교체
  // ============================
  useEffect(() => {
    // ---- 추가 ----
    const addDisease = async (disease: Omit<Disease, "id">) => {
      if (!userId) {
        toast.error("로그인이 필요합니다.");
        return;
      }

      try {
        const mapped =
          disease.type === "chronic"
            ? mapChronicToDisease(
                await createChronic({
                  disease_name: disease.name,
                  note: disease.meds,
                  user_id: userId,
                }),
              )
            : mapAcuteToDisease(
                await createAcute({
                  disease_name: disease.name,
                  note: disease.meds,
                  user_id: userId,
                }),
              );

        useHealthDataStore.setState((state) => ({
          diseases: [...state.diseases, mapped],
        }));
        toast.success("질환이 추가되었습니다.");
      } catch (err) {
        console.error("질환 추가 실패:", err);
        toast.error("질환 추가에 실패했습니다.");
      }
    };

    // ---- 수정 ----
    const updateDisease = async (
      id: string,
      patch: Partial<Omit<Disease, "id">>,
    ) => {
      const current = useHealthDataStore
        .getState()
        .diseases.find((d) => d.id === id);
      if (!current) return;

      const nextType = patch.type ?? current.type;
      const nextName = patch.name ?? current.name;
      const nextMeds = patch.meds ?? current.meds;

      // prefix 제거해서 숫자 ID 추출
      const numericId = Number(id.split("_")[1]);

      try {
        // 타입이 바뀌는 경우: 기존 삭제 + 새로 생성
        if (nextType !== current.type) {
          if (!userId) {
            toast.error("로그인이 필요합니다.");
            return;
          }

          if (current.type === "chronic") {
            await deleteChronic(numericId);
          } else {
            await deleteAcute(numericId);
          }

          const recreated =
            nextType === "chronic"
              ? mapChronicToDisease(
                  await createChronic({
                    disease_name: nextName,
                    note: nextMeds,
                    user_id: userId,
                  }),
                )
              : mapAcuteToDisease(
                  await createAcute({
                    disease_name: nextName,
                    note: nextMeds,
                    user_id: userId,
                  }),
                );

          useHealthDataStore.setState((state) => ({
            diseases: state.diseases.map((d) =>
              d.id === id ? recreated : d,
            ),
          }));
        } else if (nextType === "chronic") {
          // 타입 안 바뀜 + 만성
          await updateChronic(numericId, {
            disease_name: nextName,
            note: nextMeds,
          });
          useHealthDataStore.setState((state) => ({
            diseases: state.diseases.map((d) =>
              d.id === id
                ? { ...d, name: nextName, meds: nextMeds, type: nextType }
                : d,
            ),
          }));
        } else {
          // 타입 안 바뀜 + 급성
          await updateAcute(numericId, {
            disease_name: nextName,
            note: nextMeds,
          });
          useHealthDataStore.setState((state) => ({
            diseases: state.diseases.map((d) =>
              d.id === id
                ? { ...d, name: nextName, meds: nextMeds, type: nextType }
                : d,
            ),
          }));
        }

        toast.success("질환이 수정되었습니다.");
      } catch (err) {
        console.error("질환 수정 실패:", err);
        toast.error("질환 수정에 실패했습니다.");
      }
    };

    // ---- 삭제 ----
    const deleteDisease = async (id: string) => {
      const current = useHealthDataStore
        .getState()
        .diseases.find((d) => d.id === id);
      if (!current) return;

      const numericId = Number(id.split("_")[1]);

      try {
        if (current.type === "chronic") {
          await deleteChronic(numericId);
        } else {
          await deleteAcute(numericId);
        }

        useHealthDataStore.setState((state) => ({
          diseases: state.diseases.filter((d) => d.id !== id),
        }));
        toast.success("질환이 삭제되었습니다.");
      } catch (err) {
        console.error("질환 삭제 실패:", err);
        toast.error("질환 삭제에 실패했습니다.");
      }
    };

    // 스토어에 교체 주입
    useHealthDataStore.setState((state) => ({
      ...state,
      addDisease,
      updateDisease,
      deleteDisease,
    }));
  }, [userId]);

  const openModal = () =>
    setModalState({ isOpen: true, defaultType: "chronic" });
  const closeModal = () =>
    setModalState({ isOpen: false, defaultType: "chronic" });

  const filteredDiseases = diseases.filter(
    (d) => filter === "all" || filter === d.type,
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <FilterButton
            text="전체"
            isActive={filter === "all"}
            onClick={() => setFilter("all")}
          />
          <FilterButton
            text="만성질환"
            isActive={filter === "chronic"}
            onClick={() => setFilter("chronic")}
          />
          <FilterButton
            text="급성질병"
            isActive={filter === "simple"}
            onClick={() => setFilter("simple")}
          />
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-1 bg-mint hover:bg-mint-dark text-white font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <HiOutlinePlus /> 추가
        </button>
      </div>

      <div className="space-y-3">
        {filteredDiseases.length > 0 ? (
          filteredDiseases.map((d) => (
            <DiseaseItem
              key={d.id}
              name={d.name}
              meds={d.meds}
              tag={d.type === "chronic" ? "만성질환" : "급성질병"}
              tagColor={d.type === "chronic" ? "orange" : "blue"}
              onClick={() => setSelected(d)}
            />
          ))
        ) : (
          <p className="text-sm text-gray-400 text-center p-4">
            {filter === "all"
              ? "추가된 질환 정보가 없습니다."
              : "해당 유형의 질환 정보가 없습니다."}
          </p>
        )}
      </div>

      {modalState.isOpen && (
        <DiseaseModal
          onClose={closeModal}
          defaultType={modalState.defaultType}
        />
      )}
      {selected && (
        <DiseaseDetailModal
          disease={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

// ============================
// 서브 컴포넌트
// ============================

type FilterButtonProps = {
  text: string;
  isActive: boolean;
  onClick: () => void;
};

function FilterButton({ text, isActive, onClick }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-sm font-semibold rounded-full ${
        isActive
          ? "bg-mint text-white"
          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
      }`}
    >
      {text}
    </button>
  );
}

type ItemProps = {
  name: string;
  meds: string;
  tag: string;
  tagColor: "orange" | "blue";
  onClick?: () => void;
};

function DiseaseItem({ name, meds, tag, tagColor, onClick }: ItemProps) {
  const tagClass =
    tagColor === "orange"
      ? "bg-orange-100 text-orange-600"
      : "bg-blue-100 text-blue-600";

  const medList = meds
    ? meds
        .split(",")
        .map((m) => m.trim())
        .filter((m) => m.length > 0)
    : [];

  const iconData =
    tagColor === "orange"
      ? { icon: <HiOutlineFire />, color: "text-orange-500" }
      : { icon: <HiOutlineLightningBolt />, color: "text-blue-500" };

  return (
    <div
      className="flex gap-4 items-start bg-white p-3 rounded-md shadow-sm cursor-pointer hover:bg-gray-50"
      onClick={onClick}
    >
      <div
        className={`w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl flex-shrink-0 ${iconData.color}`}
      >
        {iconData.icon}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <h4 className="font-bold text-dark-gray">{name}</h4>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tagClass} ml-2 flex-shrink-0`}
          >
            {tag}
          </span>
        </div>

        {medList.length > 0 && (
          <div className="flex items-center flex-wrap gap-2 mt-2">
            {medList.map((med, index) => (
              <span
                key={index}
                className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
              >
                {med}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================
// 백엔드 → 스토어 매퍼
// ============================

function mapChronicToDisease(item: ChronicResponse): Disease {
  return {
    id: `chronic_${item.chronic_id}`, // 🔑 prefix 로 ID 충돌 방지
    name: item.disease_name,
    type: "chronic",
    meds: item.note,
  };
}

function mapAcuteToDisease(item: AcuteResponse): Disease {
  return {
    id: `acute_${item.acute_id}`, // 🔑 prefix 로 ID 충돌 방지
    name: item.disease_name,
    type: "simple",
    meds: item.note,
  };
}
