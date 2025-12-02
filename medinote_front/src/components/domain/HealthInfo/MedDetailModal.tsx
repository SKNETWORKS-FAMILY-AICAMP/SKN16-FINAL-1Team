// src/components/domain/HealthInfo/MedDetailModal.tsx

import React, { useState, type ChangeEvent, type FormEvent } from "react";
import { HiOutlineX } from "react-icons/hi";
import useHealthDataStore, { type Medication } from "../../../store/useHealthDataStore";
import { toast } from "react-toastify";

// 영양제(drug) API
import { updateDrug, deleteDrug, type DrugItem } from "../../../api/drugAPI";
// 처방약(prescription) API
import { updatePrescription, deletePrescription, type PrescriptionItem } from "../../../api/prescriptionAPI"; // ← 파일명이 prescription.ts이면 여기만 '.../prescription' 으로 수정

type Props = {
  med: Medication;
  onClose: () => void;
};

const STANDARD_OPTIONS = ["아침", "점심", "저녁", "취침전", "증상시"];

export default function MedDetailModal({ med, onClose }: Props) {
  const [editing, setEditing] = useState(false);
  const updateMedication = useHealthDataStore((s) => s.updateMedication);
  const deleteMedication = useHealthDataStore((s) => s.deleteMedication);

  const initialSched = parseSchedule(med.schedule);
  const [form, setForm] = useState({
    name: med.name,
    dosageForm: med.dosageForm,
    dose: med.dose,
    unit: med.unit,
    startDate: med.startDate,
    endDate: med.endDate,
  });
  const [scheduleList, setScheduleList] = useState<string[]>(initialSched.list);
  const [customSchedule, setCustomSchedule] = useState<string>(initialSched.custom);

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleScheduleToggle = (option: string) => {
    setScheduleList((prev) => {
      const isActive = prev.includes(option);
      return isActive ? prev.filter((item) => item !== option) : [...prev, option];
    });
  };

  const startEditing = () => {
    const sched = parseSchedule(med.schedule);
    setForm({
      name: med.name,
      dosageForm: med.dosageForm,
      dose: med.dose,
      unit: med.unit,
      startDate: med.startDate,
      endDate: med.endDate,
    });
    setScheduleList(sched.list);
    setCustomSchedule(sched.custom);
    setEditing(true);
  };

  const onSave = async (e: FormEvent) => {
    e.preventDefault();

    const selectedOptions = scheduleList.filter((s) => s !== "기타");
    const custom = scheduleList.includes("기타") ? customSchedule.trim() : "";
    if (scheduleList.includes("기타") && !custom) {
      toast.error("기타 복용 시간을 입력해주세요.");
      return;
    }

    try {
      if (med.type === "supplement") {
        // ==========================
        // 영양제(Drug) 업데이트
        // ==========================
        const updated = await updateDrug(Number(med.id), {
          med_name: form.name,
          dosage_form: form.dosageForm,
          dose: form.dose,
          unit: form.unit,
          schedule: selectedOptions,
          custom_schedule: custom,
          start_date: form.startDate,
          end_date: form.endDate,
        });

        const mapped = mapDrugToMedication(updated, med.type);
        updateMedication(med.id, {
          name: mapped.name,
          type: mapped.type,
          dosageForm: mapped.dosageForm,
          dose: mapped.dose,
          unit: mapped.unit,
          schedule: mapped.schedule,
          startDate: mapped.startDate,
          endDate: mapped.endDate,
        });
      } else {
        // ==========================
        // 처방약(Prescription) 업데이트
        // ==========================
        const updated = await updatePrescription(Number(med.id), {
          med_name: form.name,
          dosageForm: form.dosageForm,
          dose: form.dose,
          unit: form.unit,
          schedule: selectedOptions,
          customSchedule: custom || null,
          startDate: form.startDate,
          endDate: form.endDate,
        });

        const mapped = mapPrescriptionToMedication(updated);
        updateMedication(med.id, {
          name: mapped.name,
          type: mapped.type,
          dosageForm: mapped.dosageForm,
          dose: mapped.dose,
          unit: mapped.unit,
          schedule: mapped.schedule,
          startDate: mapped.startDate,
          endDate: mapped.endDate,
        });
      }

      toast.success("수정되었습니다.");
      onClose();
    } catch (err) {
      console.error("약 수정 실패:", err);
      toast.error("약 수정에 실패했습니다.");
    }
  };

  const onDelete = async () => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      if (med.type === "supplement") {
        await deleteDrug(Number(med.id));
      } else {
        await deletePrescription(Number(med.id));
      }

      deleteMedication(med.id);
      toast.success("삭제되었습니다.");
      onClose();
    } catch (err) {
      console.error("약 삭제 실패:", err);
      toast.error("약 삭제에 실패했습니다.");
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-lg shadow-popup p-6 z-50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold text-dark-gray">복용 정보 상세</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-dark-gray text-2xl"
          >
            <HiOutlineX />
          </button>
        </div>

        {!editing ? (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">약 이름</span>
              <div className="text-dark-gray font-semibold">{med.name}</div>
            </div>
            <div>
              <span className="text-gray-500">용량</span>
              <div className="text-dark-gray font-semibold">
                {med.dose}
                {med.unit}
              </div>
            </div>
            <div>
              <span className="text-gray-500">분류</span>
              <div className="text-dark-gray font-semibold">
                {med.type === "prescription" ? "처방약" : "영양제"}
              </div>
            </div>
            <div>
              <span className="text-gray-500">제형</span>
              <div className="text-dark-gray font-semibold">{med.dosageForm}</div>
            </div>
            <div>
              <span className="text-gray-500">복용 시간</span>
              <div className="text-dark-gray font-semibold">{med.schedule}</div>
            </div>
            <div className="col-span-1">
              <span className="text-gray-500">복용 기간</span>
              <div className="text-dark-gray font-semibold">
                {med.startDate} ~ {med.endDate}
              </div>
            </div>
          </div>
        ) : (
          <form className="grid grid-cols-2 gap-4" onSubmit={onSave}>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                약 이름
              </label>
              <input
                name="name"
                value={form.name}
                onChange={onChange}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mint"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                제형
              </label>
              <select
                name="dosageForm"
                value={form.dosageForm}
                onChange={onChange}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mint bg-white"
              >
                <option value="캡슐">캡슐</option>
                <option value="정제">정제</option>
                <option value="시럽">시럽</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                용량
              </label>
              <input
                name="dose"
                value={form.dose}
                onChange={onChange}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mint"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                단위
              </label>
              <select
                name="unit"
                value={form.unit}
                onChange={onChange}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mint bg-white"
              >
                <option value="mg">mg</option>
                <option value="mcg">mcg</option>
                <option value="g">g</option>
                <option value="mL">mL</option>
                <option value="%">%</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                복용 시간
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {[...STANDARD_OPTIONS, "기타"].map((option) => {
                  const isActive = scheduleList.includes(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleScheduleToggle(option)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                        isActive
                          ? "bg-mint text-white border-mint shadow-sm"
                          : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>

              {scheduleList.includes("기타") && (
                <input
                  type="text"
                  value={customSchedule}
                  onChange={(e) => setCustomSchedule(e.target.value)}
                  placeholder="예: 점심 후 30분"
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mint animate-fadeIn"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                시작일
              </label>
              <input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={onChange}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mint"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                종료일
              </label>
              <input
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={onChange}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mint"
              />
            </div>
            <div className="col-span-2 flex gap-3 mt-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="flex-1 py-3 border rounded-lg hover:bg-gray-100 text-gray-700"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 bg-mint hover:bg-mint-dark text-white font-bold py-3 px-4 rounded-lg"
              >
                저장
              </button>
            </div>
          </form>
        )}

        {!editing && (
          <div className="flex gap-3 mt-6">
            <button
              onClick={startEditing}
              className="flex-1 bg-mint hover:bg-mint-dark text-white font-bold py-3 px-4 rounded-lg"
            >
              수정
            </button>
            <button
              onClick={onDelete}
              className="flex-1 border border-red-300 text-red-500 hover:bg-red-50 font-bold py-3 px-4 rounded-lg"
            >
              삭제
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function parseSchedule(scheduleText: string) {
  if (!scheduleText) return { list: [], custom: "" };
  const parts = scheduleText.split(",").map((p) => p.trim());
  const list = parts.filter((p) => STANDARD_OPTIONS.includes(p));
  const customParts = parts.filter((p) => !STANDARD_OPTIONS.includes(p));
  if (customParts.length > 0) list.push("기타");
  return { list, custom: customParts.join(", ") };
}

function mapDrugToMedication(item: DrugItem, type: Medication["type"]): Medication {
  const parts = [...item.schedule];
  if (item.custom_schedule) parts.push(item.custom_schedule);
  return {
    id: String(item.drug_id),
    name: item.med_name,
    type,
    dosageForm: item.dosage_form,
    dose: item.dose,
    unit: item.unit,
    schedule: parts.join(", "),
    startDate: item.start_date,
    endDate: item.end_date,
  };
}

function mapPrescriptionToMedication(item: PrescriptionItem): Medication {
  const parts = [...item.schedule];
  if (item.custom_schedule) parts.push(item.custom_schedule);
  return {
    id: String(item.prescription_id),
    name: item.med_name,
    type: "prescription",
    dosageForm: item.dosage_form,
    dose: item.dose,
    unit: item.unit,
    schedule: parts.join(", "),
    startDate: item.start_date,
    endDate: item.end_date,
  };
}
