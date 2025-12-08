// src/components/domain/HealthInfo/MedInfoTab.tsx

import React, { useEffect, useState } from "react";
import { HiOutlinePlus } from "react-icons/hi";
import { TbPill } from "react-icons/tb";
import AddMedModal from "./AddMedModal";
import MedDetailModal from "./MedDetailModal";
import useHealthDataStore, { type Medication } from "../../../store/useHealthDataStore";
import { getDrugs, type DrugItem } from "../../../api/drugAPI";
import { toast } from "react-toastify";

// 처방약 API
import {
  getPrescriptions,
  type PrescriptionItem,
} from "../../../api/prescriptionAPI"; // ← 파일명이 prescription.ts면 여기만 '.../prescription' 으로 변경

type Filter = "all" | "prescription" | "supplement";
const PAGE_SIZE = 4;

export default function MedInfoTab() {
  const [filter, setFilter] = useState<Filter>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState<Medication | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const medications = useHealthDataStore((state) => state.medications);

  useEffect(() => {
    const fetchMeds = async () => {
      try {
        // 처방약 + 영양제 한 번에 불러오기
        const [prescriptionData, drugData] = await Promise.all([
          getPrescriptions(),
          getDrugs(),
        ]);

        const mappedPrescriptions = prescriptionData.map(mapPrescriptionToMedication);
        const mappedDrugs = drugData.map(mapDrugToMedication);

        useHealthDataStore.setState({
          medications: [...mappedPrescriptions, ...mappedDrugs],
        });
      } catch (err) {
        console.error("약 목록 불러오기 실패:", err);
        toast.error("약 정보를 불러오지 못했습니다.");
      }
    };
    fetchMeds();
  }, []);

  const filtered = medications.filter(
    (med) => filter === "all" || filter === med.type,
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const displayed = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // 필터 변경 시 페이지 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

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
            text="처방약"
            isActive={filter === "prescription"}
            onClick={() => setFilter("prescription")}
          />
          <FilterButton
            text="영양제"
            isActive={filter === "supplement"}
            onClick={() => setFilter("supplement")}
          />
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1 bg-mint hover:bg-mint-dark text-white font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <HiOutlinePlus /> 추가
        </button>
      </div>

      <div className="space-y-3">
        {displayed.map((med) => (
          <MedItem
            key={med.id}
            icon={
              <TbPill
                className={
                  med.type === "prescription"
                    ? "text-prescription"
                    : "text-supplement"
                }
              />
            }
            name={`${med.name} (${med.dosageForm})`}
            dose={`${med.dose}${med.unit}`}
            schedule={med.schedule}
            period={`${med.startDate} ~ ${med.endDate}`}
            tag={med.type === "prescription" ? "처방약" : "영양제"}
            tagColor={med.type === "prescription" ? "blue" : "green"}
            onClick={() => setSelected(med)}
          />
        ))}

        {filtered.length === 0 && (
          <p className="text-sm text-gray-400 text-center p-4">
            추가된 복약 정보가 없습니다.
          </p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            이전
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-8 h-8 rounded-lg ${currentPage === page ? "bg-mint text-white" : "bg-gray-100 hover:bg-gray-200"}`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            다음
          </button>
        </div>
      )}

      {isModalOpen && <AddMedModal onClose={() => setIsModalOpen(false)} />}
      {selected && (
        <MedDetailModal med={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

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

type MedItemProps = {
  icon: React.ReactNode;
  name: string;
  dose: string;
  schedule: string;
  period: string;
  tag: string;
  tagColor: "blue" | "green";
  onClick?: () => void;
};

function MedItem({
  icon,
  name,
  dose,
  schedule,
  period,
  tag,
  tagColor,
  onClick,
}: MedItemProps) {
  const tagClass =
    tagColor === "blue"
      ? "bg-prescription/10 text-prescription"
      : "bg-supplement/10 text-supplement";
  return (
    <div
      className="bg-white p-4 rounded-lg shadow-lg flex gap-4 items-start cursor-pointer hover:bg-gray-50"
      onClick={onClick}
    >
      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
        {icon}
      </div>

      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-lg font-bold text-dark-gray">{name}</h3>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tagClass}`}>
            {tag}
          </span>
        </div>
        <p className="text-sm text-gray-600">{dose}</p>
        <p className="text-sm text-gray-600 mt-1">{schedule}</p>
        <p className="text-xs text-gray-400 mt-2">{period}</p>
      </div>
    </div>
  );
}

// ==============================
// Mapper helpers
// ==============================

// 영양제(drug) → Medication
function mapDrugToMedication(item: DrugItem): Medication {
  const scheduleParts = [...item.schedule];
  if (item.custom_schedule) scheduleParts.push(item.custom_schedule);

  return {
    id: String(item.drug_id),
    name: item.med_name,
    type: "supplement", // ✅ 영양제
    dosageForm: item.dosage_form,
    dose: item.dose,
    unit: item.unit,
    schedule: scheduleParts.join(", "),
    startDate: item.start_date,
    endDate: item.end_date,
  };
}

// 처방약(prescription) → Medication
function mapPrescriptionToMedication(item: PrescriptionItem): Medication {
  const scheduleParts = [...item.schedule];
  if (item.custom_schedule) scheduleParts.push(item.custom_schedule);

  return {
    id: String(item.prescription_id),
    name: item.med_name,
    type: "prescription",
    dosageForm: item.dosage_form,
    dose: item.dose,
    unit: item.unit,
    schedule: scheduleParts.join(", "),
    startDate: item.start_date,
    endDate: item.end_date,
  };
}
