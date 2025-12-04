// src/components/domain/HealthInfo/AddMedModal.tsx

import React, { useState, type ChangeEvent, type FormEvent } from "react";
import {
  HiOutlineX,
  HiOutlineClipboardCheck,
  HiOutlineSparkles,
  HiOutlineArrowLeft,
  HiOutlineCamera,
  HiOutlinePhotograph,
  HiOutlineCheckCircle,
} from "react-icons/hi";
import useHealthDataStore, {
  type Medication,
} from "../../../store/useHealthDataStore";
import { toast } from "react-toastify";

// 영양제(drug) API
import { createDrug, type DrugItem } from "../../../api/drugAPI";
// 처방약(prescription) API
import {
  createPrescription,
  type PrescriptionItem,
} from "../../../api/prescriptionAPI";

type Step = "selectType" | "fillForm";
type MedType = "prescription" | "supplement";
type OcrStep = "idle" | "selectMethod" | "preview" | "scanning" | "complete";

type MedForm = {
  name: string;
  dosageForm: "캡슐" | "정제" | "시럽";
  dose: string;
  unit: "mg" | "mcg" | "g" | "mL" | "%";
  schedule: string[];
  customSchedule: string;
  startDate: string;
  endDate: string;
};

type ModalProps = {
  onClose: () => void;
  initialType?: MedType;
  startStep?: Step;
};

const SCHEDULE_OPTIONS = ["아침", "점심", "저녁", "취침전", "증상시", "기타"];

export default function AddMedModal({
  onClose,
  initialType = "prescription",
  startStep = "selectType",
}: ModalProps) {
  const [step, setStep] = useState<Step>(startStep);
  const [medType, setMedType] = useState<MedType>(initialType);
  const [ocrStep, setOcrStep] = useState<OcrStep>("idle");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState<MedForm>({
    name: "",
    dosageForm: "정제",
    dose: "",
    unit: "mg",
    schedule: [],
    customSchedule: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleScheduleToggle = (option: string) => {
    setFormData((prev) => {
      const isActive = prev.schedule.includes(option);
      const next = isActive
        ? prev.schedule.filter((item) => item !== option)
        : [...prev.schedule, option];
      return { ...prev, schedule: next };
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("약 이름을 입력해주세요.");
      return;
    }

    const selectedOptions = formData.schedule.filter((s) => s !== "기타");
    const custom = formData.schedule.includes("기타")
      ? formData.customSchedule.trim()
      : "";

    if (formData.schedule.includes("기타") && !custom) {
      toast.error("기타 복용 시간을 입력해주세요.");
      return;
    }

    try {
      let newMed: Medication;

      if (medType === "supplement") {
        // ==========================
        // 영양제 → POST /drug/
        // ==========================
        const res = await createDrug({
          med_name: formData.name,
          dosage_form: formData.dosageForm,
          dose: formData.dose,
          unit: formData.unit,
          schedule: selectedOptions,
          custom_schedule: custom,
          start_date: formData.startDate,
          end_date: formData.endDate,
        });

        newMed = mapDrugToMedication(res, "supplement");
      } else {
        // ==========================
        // 처방약 → POST /prescription/visit/{visit_id}
        // ==========================
        // ⚠️ visitId는 진료내역 연동 전까지는 임시 값 사용
        const visitId = 1;

        const res = await createPrescription(visitId, {
          med_name: formData.name,
          dosageForm: formData.dosageForm,
          dose: formData.dose,
          unit: formData.unit,
          schedule: selectedOptions,
          customSchedule: custom || null,
          startDate: formData.startDate,
          endDate: formData.endDate,
        });

        newMed = mapPrescriptionToMedication(res);
      }

      // Zustand store에 추가
      useHealthDataStore.setState((state) => ({
        medications: [...state.medications, newMed],
      }));

      toast.success("복약 정보가 추가되었습니다.");
      onClose();
    } catch (err) {
      console.error("약 추가 실패:", err);
      toast.error("약 추가에 실패했습니다.");
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    toast.info("이미지를 선택했습니다.");
    setImagePreview(url);
    setOcrStep("preview");
    e.target.value = "";
  };

  const handleScanStart = () => {
    setOcrStep("scanning");
    setTimeout(() => {
      setFormData({
        name: "예시약품",
        dosageForm: "캡슐",
        dose: "40",
        unit: "mg",
        schedule: ["아침", "저녁"],
        customSchedule: "",
        startDate: "2025-11-15",
        endDate: "2025-12-15",
      });
      setOcrStep("complete");
      toast.success("스캔 결과를 적용했습니다.");
    }, 1500);
  };

  const handleScanAgain = () => {
    setOcrStep("selectMethod");
    setImagePreview(null);
  };

  if (step === "selectType") {
    return (
      <ModalWrapper onClose={onClose}>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold text-dark-gray">약 추가</h2>
          <CloseButton onClick={onClose} />
        </div>
        <p className="text-sm text-gray-500 mb-6">
          추가하려는 약의 종류를 선택하세요
        </p>
        <div className="flex gap-4">
          <TypeCard
            icon={<HiOutlineClipboardCheck />}
            title="처방약"
            description="병원에서 처방받은 약"
            onClick={() => {
              setMedType("prescription");
              setStep("fillForm");
            }}
          />
          <TypeCard
            icon={<HiOutlineSparkles />}
            title="영양제"
            description="건강보조/비처방"
            onClick={() => {
              setMedType("supplement");
              setStep("fillForm");
            }}
          />
        </div>
        <button
          onClick={onClose}
          className="mt-6 w-full py-3 border rounded-lg hover:bg-gray-100 text-gray-700"
        >
          닫기
        </button>
      </ModalWrapper>
    );
  }

  return (
    <ModalWrapper onClose={onClose} wide>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold text-dark-gray">
          {medType === "prescription" ? "처방약 추가" : "영양제 추가"}
        </h2>
        <CloseButton onClick={onClose} />
      </div>
      <p className="text-sm text-gray-500 mb-6">
        {medType === "prescription"
          ? "OCR 스캔 또는 직접 입력하세요."
          : "제품 정보를 입력하세요."}
      </p>

      {medType === "prescription" && (
        <div className="mb-5 p-4 border-2 border-dashed border-mint/50 rounded-lg bg-mint/5 text-center">
          {ocrStep === "idle" && (
            <>
              <HiOutlineCamera className="text-3xl text-mint mx-auto mb-2" />
              <h3 className="font-semibold text-dark-gray mb-1">
                처방전을 스캔할까요?
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                OCR 스캔으로 약 정보를 자동으로 입력합니다.
              </p>
              <button
                type="button"
                onClick={() => setOcrStep("selectMethod")}
                className="bg-mint text-white px-4 py-2 rounded-lg font-semibold hover:bg-mint-dark"
              >
                OCR 스캔하기
              </button>
            </>
          )}

          {ocrStep === "selectMethod" && (
            <div>
              <h3 className="font-semibold text-dark-gray mb-3">이미지 선택</h3>
              <input
                type="file"
                id="camera-input"
                accept="image/*"
                capture
                className="hidden"
                onChange={handleImageSelect}
              />
              <input
                type="file"
                id="album-input"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />

              <div className="flex gap-4 justify-center">
                <label
                  htmlFor="camera-input"
                  className="flex-1 flex flex-col items-center p-4 border rounded-lg hover:bg-white cursor-pointer"
                >
                  <HiOutlineCamera className="text-3xl text-mint" />
                  <span className="text-sm font-semibold mt-1">
                    카메라 촬영
                  </span>
                </label>

                <label
                  htmlFor="album-input"
                  className="flex-1 flex flex-col items-center p-4 border rounded-lg hover:bg-white cursor-pointer"
                >
                  <HiOutlinePhotograph className="text-3xl text-mint" />
                  <span className="text-sm font-semibold mt-1">
                    앨범에서 선택
                  </span>
                </label>
              </div>
            </div>
          )}

          {ocrStep === "preview" && imagePreview && (
            <div>
              <h3 className="font-semibold text-dark-gray mb-3">
                이미지 미리보기
              </h3>
              <img
                src={imagePreview}
                alt="Prescription Preview"
                className="rounded-lg mb-3"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleScanAgain}
                  className="flex-1 py-2 border rounded-lg hover:bg-gray-100 text-gray-700"
                >
                  다시 선택
                </button>
                <button
                  type="button"
                  onClick={handleScanStart}
                  className="flex-1 bg-mint text-white font-semibold rounded-lg hover:bg-mint-dark"
                >
                  스캔 시작
                </button>
              </div>
            </div>
          )}

          {ocrStep === "scanning" && (
            <div className="h-24 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-4 border-mint border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm text-dark-gray font-semibold">
                스캔 중입니다...
              </p>
            </div>
          )}

          {ocrStep === "complete" && (
            <div className="h-24 flex flex-col items-center justify-center">
              <HiOutlineCheckCircle className="text-4xl text-green-500 mb-3" />
              <p className="text-sm text-dark-gray font-semibold">
                스캔 완료! 내용을 확인해주세요.
              </p>
              <button
                type="button"
                onClick={handleScanAgain}
                className="text-xs text-mint hover:underline mt-1"
              >
                다시 스캔하기
              </button>
            </div>
          )}
        </div>
      )}

      <h3 className="text-lg font-bold text-dark-gray mb-4">
        {ocrStep === "complete" ? "스캔 결과 (수정 가능)" : "정보 입력"}
      </h3>

      <form className="grid grid-cols-2 gap-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            약 이름
          </label>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="예: 아스피린"
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mint"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            제형
          </label>
          <select
            name="dosageForm"
            value={formData.dosageForm}
            onChange={handleChange}
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
            value={formData.dose}
            onChange={handleChange}
            placeholder="예: 100"
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mint"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            단위
          </label>
          <select
            name="unit"
            value={formData.unit}
            onChange={handleChange}
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
            {SCHEDULE_OPTIONS.map((option) => {
              const isActive = formData.schedule.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleScheduleToggle(option)}
                  className={`px-3 py-3 rounded-lg text-sm font-medium border transition-all ${
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
          {formData.schedule.includes("기타") && (
            <input
              type="text"
              name="customSchedule"
              value={formData.customSchedule}
              onChange={handleChange}
              placeholder="예: 점심 후 30분"
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mint bg-gray-50 animate-fadeIn"
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
            value={formData.startDate}
            onChange={handleChange}
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
            value={formData.endDate}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mint"
          />
        </div>

        <div className="col-span-2 flex gap-3 mt-6">
          {startStep !== "fillForm" && (
            <button
              type="button"
              onClick={() => {
                setStep("selectType");
                setOcrStep("idle");
              }}
              className="flex-1 py-3 border rounded-lg hover:bg-gray-100 text-gray-700 flex items-center justify-center gap-1"
            >
              <HiOutlineArrowLeft /> 이전
            </button>
          )}
          <button
            type="submit"
            className="flex-1 bg-mint hover:bg-mint-dark text-white font-bold py-3 px-4 rounded-lg"
          >
            추가
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}

const ModalWrapper: React.FC<{
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}> = ({ onClose, children, wide = false }) => (
  <div
    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    onClick={onClose}
  >
    <div
      className={`w-full ${
        wide ? "max-w-2xl" : "max-w-md"
      } bg-white rounded-lg shadow-popup p-6 z-50`}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  </div>
);

const CloseButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="text-gray-400 hover:text-dark-gray text-2xl"
  >
    <HiOutlineX />
  </button>
);

const TypeCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}> = ({ icon, title, description, onClick }) => (
  <button
    onClick={onClick}
    className="flex-1 p-6 border rounded-lg text-center hover:bg-mint/10 hover:border-mint transition-all"
  >
    <div className="text-4xl text-mint mx-auto mb-3">{icon}</div>
    <h3 className="font-bold text-lg text-dark-gray">{title}</h3>
    <p className="text-sm text-gray-500">{description}</p>
  </button>
);

// ==============================
// 매핑 유틸
// ==============================
function mapDrugToMedication(
  item: DrugItem,
  type: "prescription" | "supplement"
): Medication {
  const parts = [...item.schedule];
  if (item.custom_schedule) parts.push(item.custom_schedule);
  return {
    id: String(item.drug_id),
    name: item.med_name,
    type,
    dosageForm: item.dosage_form as Medication["dosageForm"],
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
    dosageForm: item.dosage_form as Medication["dosageForm"],
    dose: item.dose,
    unit: item.unit,
    schedule: parts.join(", "),
    startDate: item.start_date,
    endDate: item.end_date,
  };
}
