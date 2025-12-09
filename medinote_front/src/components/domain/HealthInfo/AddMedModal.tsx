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

import { createDrug, type DrugItem } from "../../../api/drugAPI";
import {
  createPrescription,
  type PrescriptionItem,
} from "../../../api/prescriptionAPI";
import {
  OCR_API_BASE_URL, // 🔹 OCR 서버(8003)
} from "../../../utils/config";

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

// 🔹 서버에서 약 1개를 표현하는 형태 (여러 개가 배열로 옴)
type PrescriptionParsedItem = {
  med_name?: string;
  dosage_form?: string;
  dose?: string;
  unit?: string;
  schedule?: string[];
  custom_schedule?: string | null;
  start_date?: string | null;
  end_date?: string | null;
};

// 🔹 1차 OCR 응답 타입 (백엔드 /prescriptions/{id}/ocr 스펙)
type PrescriptionOcrJobResponse = {
  ocr_id: number;
  file_id: number;
  user_id: number;
  source_type: string;
  status: string;
  text: string;
  visit_id: number | null;
  created_at: string;
  completed_at: string | null;
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
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // 🔹 파싱된 여러 약 목록
  const [parsedMeds, setParsedMeds] = useState<PrescriptionParsedItem[] | null>(
    null
  );
  // 🔹 지금 폼에 표시 중인 약 인덱스
  const [selectedMedIndex, setSelectedMedIndex] = useState<number>(0);
  // 🔹 “선택됨” 상태인 약 인덱스들 (여러 개 가능)
  const [activeMedIndexes, setActiveMedIndexes] = useState<number[]>([]);

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

  const resetOcrSelection = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setOcrFile(null);
    setParsedMeds(null);
    setSelectedMedIndex(0);
    setActiveMedIndexes([]);
  };

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

  // 🔹 여기부터 전체 수정된 handleSubmit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const isMultiOcrMode =
      medType === "prescription" &&
      parsedMeds &&
      parsedMeds.length > 0 &&
      activeMedIndexes.length > 0;

    // 1) OCR 여러 약 모드가 아니면 → 기존 단일 입력 검증
    if (!isMultiOcrMode) {
      if (!formData.name.trim()) {
        toast.error("약 이름을 입력해 주세요.");
        return;
      }

      const selectedOptions = formData.schedule.filter((s) => s !== "기타");
      const custom = formData.schedule.includes("기타")
        ? formData.customSchedule.trim()
        : "";

      if (formData.schedule.includes("기타") && !custom) {
        toast.error("기타 복용 시간의 세부 내용을 입력해 주세요.");
        return;
      }
    }

    try {
      const newMeds: Medication[] = [];

      if (medType === "supplement") {
        // ========================
        // 영양제는 항상 1개만 등록
        // ========================
        const selectedOptions = formData.schedule.filter((s) => s !== "기타");
        const custom = formData.schedule.includes("기타")
          ? formData.customSchedule.trim()
          : "";

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

        newMeds.push(mapDrugToMedication(res, "supplement"));
      } else {
        // ========================
        // 처방약
        // ========================
        const visitId = 1; // TODO: 실제 visitId 로 교체

        if (isMultiOcrMode && parsedMeds) {
          // 🔹 OCR로 인식된 여러 약 중, activeMedIndexes 에 포함된 애들만 등록
          const targets = activeMedIndexes
            .map((i) => parsedMeds[i])
            .filter((p): p is PrescriptionParsedItem => !!p);

          for (const p of targets) {
            // parsed → 폼 형태로 정규화
            const merged = mapParsedToForm(p, formData);

            const selectedOptions = merged.schedule.filter((s) => s !== "기타");
            const custom = merged.schedule.includes("기타")
              ? merged.customSchedule.trim()
              : "";

            const res = await createPrescription(visitId, {
              med_name: merged.name,
              dosageForm: merged.dosageForm,
              dose: merged.dose,
              unit: merged.unit,
              schedule: selectedOptions,
              customSchedule: custom || null,
              startDate: merged.startDate,
              endDate: merged.endDate,
            });

            newMeds.push(mapPrescriptionToMedication(res));
          }
        } else {
          // 🔹 OCR 안 쓰거나, 단일 약만 직접 입력하는 경우 → 기존 로직
          const selectedOptions = formData.schedule.filter((s) => s !== "기타");
          const custom = formData.schedule.includes("기타")
            ? formData.customSchedule.trim()
            : "";

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

          newMeds.push(mapPrescriptionToMedication(res));
        }
      }

      // 🔹 생성된 약들을 한 번에 store 에 추가
      useHealthDataStore.setState((state) => ({
        medications: [...state.medications, ...newMeds],
      }));

      toast.success(
        newMeds.length > 1
          ? `${newMeds.length}개의 약이 추가되었습니다.`
          : "복약 정보가 추가되었습니다."
      );
      onClose();
    } catch (err) {
      console.error("약 추가 실패:", err);
      toast.error("약 추가에 실패했습니다.");
    }
  };
  // 🔹 handleSubmit 끝

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      toast.error("이미지 파일을 선택해 주세요.");
      return;
    }
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setOcrFile(file);
    setImagePreview(URL.createObjectURL(file));
    setOcrStep("preview");
    e.target.value = "";
  };

  const normalizeDosageForm = (
    value?: string | null
  ): MedForm["dosageForm"] => {
    const text = (value || "").toLowerCase();
    if (text.includes("캡슐") || text.includes("capsule")) return "캡슐";
    if (text.includes("시럽") || text.includes("syrup")) return "시럽";
    return "정제";
  };

  const hasParsedValues = (parsed: PrescriptionParsedItem) => {
    const scheduleCount = Array.isArray(parsed.schedule)
      ? parsed.schedule.filter(Boolean).length
      : 0;
    return (
      !!parsed.med_name?.trim() ||
      !!parsed.dosage_form?.trim() ||
      !!parsed.dose?.trim() ||
      !!parsed.unit?.trim() ||
      !!parsed.custom_schedule?.trim() ||
      !!parsed.start_date?.trim() ||
      !!parsed.end_date?.trim() ||
      scheduleCount > 0
    );
  };

  const mapParsedToForm = (
    parsed: PrescriptionParsedItem,
    prev: MedForm
  ): MedForm => {
    const schedule = Array.isArray(parsed.schedule)
      ? parsed.schedule.filter(Boolean)
      : [];
    const customSchedule = (parsed.custom_schedule ?? "").trim();
    const scheduleWithCustom = [...schedule];
    if (customSchedule && !scheduleWithCustom.includes("기타")) {
      scheduleWithCustom.push("기타");
    }

    return {
      ...prev,
      name: parsed.med_name ?? prev.name,
      dosageForm: normalizeDosageForm(parsed.dosage_form) || prev.dosageForm,
      dose: parsed.dose ?? prev.dose,
      unit: parsed.unit ?? prev.unit,
      schedule: scheduleWithCustom.length ? scheduleWithCustom : prev.schedule,
      customSchedule: customSchedule || prev.customSchedule,
      startDate: parsed.start_date || prev.startDate,
      endDate: parsed.end_date || prev.endDate,
    };
  };

  const handleScanStart = async () => {
    if (!ocrFile) {
      toast.error("OCR에 사용할 이미지를 선택해 주세요.");
      return;
    }

    setOcrStep("scanning");

    try {
      const prescriptionId = 1;

      const uploadForm = new FormData();
      uploadForm.append("file", ocrFile);

      const uploadResp = await fetch(
        `${OCR_API_BASE_URL}/prescriptions/${prescriptionId}/ocr`,
        {
          method: "POST",
          body: uploadForm,
        }
      );

      if (!uploadResp.ok) {
        let detail = "";
        try {
          const errBody = await uploadResp.json();
          detail = errBody?.detail ?? "";
        } catch {
          detail = "";
        }
        throw new Error(detail || `처방 OCR 업로드 실패 (${uploadResp.status})`);
      }

      const uploadData =
        (await uploadResp.json()) as PrescriptionOcrJobResponse;

      if (!uploadData.text?.trim()) {
        toast.error("OCR 결과 텍스트가 비어 있습니다. 이미지를 다시 확인해 주세요.");
        setOcrStep("preview");
        return;
      }

      const parseResp = await fetch(
        `${OCR_API_BASE_URL}/prescriptions/${prescriptionId}/ocr/parse`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: uploadData.text }),
        }
      );

      if (!parseResp.ok) {
        let detail = "";
        try {
          const errBody = await parseResp.json();
          detail = errBody?.detail ?? "";
        } catch {
          detail = "";
        }
        throw new Error(detail || `처방 OCR 파싱 실패 (${parseResp.status})`);
      }

      const raw = await parseResp.json();
      const list: PrescriptionParsedItem[] = Array.isArray(raw)
        ? (raw as PrescriptionParsedItem[])
        : [raw as PrescriptionParsedItem];

      const validMeds = list.filter(hasParsedValues);

      if (!validMeds.length) {
        toast.error("인식된 처방 정보가 없습니다. 이미지를 다시 확인해 주세요.");
        setOcrStep("preview");
        return;
      }

      setParsedMeds(validMeds);

      // 🔹 약이 N개라면 0..N-1 전부 “선택된 상태”로 세팅
      const allIndexes = validMeds.map((_, idx) => idx);
      setActiveMedIndexes(allIndexes);

      setSelectedMedIndex(0);
      setFormData((prev) => mapParsedToForm(validMeds[0], prev));
      setOcrStep("complete");
      toast.success(
        validMeds.length > 1
          ? `OCR 결과가 적용되었습니다. (${validMeds.length}개 약 인식)`
          : "OCR 결과가 적용되었습니다."
      );
    } catch (err) {
      console.error("처방 OCR 처리 오류:", err);
      toast.error("OCR 처리 중 오류가 발생했습니다.");
      setOcrStep("preview");
    }
  };

  const handleScanAgain = () => {
    resetOcrSelection();
    setOcrStep("selectMethod");
  };

  const handleSelectParsedMed = (index: number) => {
    if (!parsedMeds || !parsedMeds[index]) return;

    setActiveMedIndexes((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );

    setSelectedMedIndex(index);
    setFormData((prev) => mapParsedToForm(parsedMeds[index], prev));
  };

  if (step === "selectType") {
    return (
      <ModalWrapper onClose={onClose}>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold text-dark-gray">약 추가</h2>
          <CloseButton onClick={onClose} />
        </div>
        <p className="text-sm text-gray-500 mb-6">
          추가하려는 약의 종류를 선택하세요.
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
          ? "OCR 스캔 후 직접 입력하세요."
          : "제품 정보를 입력해 주세요."}
      </p>

      {medType === "prescription" && (
        <div className="mb-5 p-4 border-2 border-dashed border-mint/50 rounded-lg bg-mint/5 text-center">
          {ocrStep === "idle" && (
            <>
              <HiOutlineCamera className="text-3xl text-mint mx-auto mb-2" />
              <button
                type="button"
                onClick={() => setOcrStep("selectMethod")}
                className="bg-mint text-white px-4 py-2 rounded-lg font-semibold hover:bg-mint-dark"
              >
                처방전 스캔하기
              </button>
              <p className="text-sm text-gray-600 mb-3">
                약 정보를 자동 입력합니다.
              </p>              
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
            <div className="h-auto flex flex-col items-center justify-center">
              <HiOutlineCheckCircle className="text-4xl text-green-500 mb-3" />
              <p className="text-sm text-dark-gray font-semibold mb-2">
                스캔 완료! 내용을 확인해 주세요.
              </p>

              {parsedMeds && parsedMeds.length > 0 && (
                <div className="w-full mt-2">
                  <p className="text-xs text-gray-600 mb-1">
                    인식된 약을 선택하면 아래 폼에 자동으로 채워집니다.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {parsedMeds.map((m, idx) => {
                      const label = m.med_name?.trim() || `약 ${idx + 1}`;
                      const isActive = activeMedIndexes.includes(idx);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectParsedMed(idx)}
                          className={`px-3 py-1 rounded-full text-xs border ${
                            isActive
                              ? "bg-mint text-white border-mint"
                              : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleScanAgain}
                className="text-xs text-mint hover:underline mt-2"
              >
                다시 스캔하기
              </button>
            </div>
          )}
        </div>
      )}

      <h3 className="text-lg font-bold text-dark-gray mb-4">
        {ocrStep === "complete" ? "스캔 결과 (수정 가능)" : "약 정보 입력"}
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
            placeholder="예) 아스피린"
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
            placeholder="예) 100"
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
              placeholder="예) 점심 30분 후"
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
