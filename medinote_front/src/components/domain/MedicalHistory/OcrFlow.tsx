// src/components/domain/MedicalHistory/OcrFlow.tsx

import React, { useState, type ChangeEvent } from "react";
import {
  HiOutlineArrowLeft,
  HiOutlineCamera,
  HiOutlinePhotograph,
} from "react-icons/hi";
import { toast } from "react-toastify";
import { OCR_API_BASE_URL } from "../../../utils/config";
import { type HistoryFormData } from "./HistoryForm";

type OcrStep = "selectMethod" | "preview" | "scanning";

type Props = {
  onComplete: (data: Partial<HistoryFormData>) => void;
  onCancel: () => void;
};

// 🔹 백엔드 VisitFormSchema 와 맞춘 타입
type VisitParsedResponse = {
  hospital?: string;
  doctor_name?: string;
  symptom?: string;
  opinion?: string;
  diagnosis_code?: string;
  diagnosis_name?: string;
  date?: string;
};

// 🔹 1차 OCR 응답 타입 (백엔드 /visits/{id}/ocr 의 Swagger 예시 기준)
type VisitOcrJobResponse = {
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

export default function OcrFlow({ onComplete, onCancel }: Props) {
  const [ocrStep, setOcrStep] = useState<OcrStep>("selectMethod");
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const resetSelection = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setOcrFile(null);
    setImagePreview(null);
  };

  const handleImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast.error("이미지 파일을 선택해 주세요.");
      return;
    }
    setOcrFile(file);
    setImagePreview(URL.createObjectURL(file));
    setOcrStep("preview");
    event.target.value = "";
  };

  // 🔹 백엔드 VisitFormSchema → HistoryFormData 로 매핑
  const mapParsedToHistory = (
    parsed: VisitParsedResponse
  ): Partial<HistoryFormData> => ({
    // 진단명이 있으면 제목으로 사용, 없으면 빈 문자열
    title: parsed.diagnosis_name ?? "",
    date: parsed.date ?? "",
    hospital: parsed.hospital ?? "",
    doctor: parsed.doctor_name ?? "",
    symptoms: parsed.symptom ?? "",
    notes: parsed.opinion ?? "",
  });

  const handleScanStart = async () => {
    if (!ocrFile) {
      toast.error("파일을 먼저 선택해 주세요.");
      return;
    }

    setOcrStep("scanning");

    try {
      // 🔹 TODO: 실제 선택된 visit_id 로 바꿔야 함
      const visitId = 1;

      // 1) 첫 번째 요청: 파일 업로드 + OCR 실행  (→ OCR 서버 8003)
      const uploadForm = new FormData();
      uploadForm.append("file", ocrFile);

      const uploadResp = await fetch(
        `${OCR_API_BASE_URL}/visits/${visitId}/ocr`,
        {
          method: "POST",
          body: uploadForm,
        }
      );

      if (!uploadResp.ok) {
        let detail = "";
        try {
          const errorBody = await uploadResp.json();
          detail = errorBody?.detail ?? "";
        } catch {
          detail = "";
        }
        throw new Error(detail || `OCR 업로드 실패 (${uploadResp.status})`);
      }

      const uploadData = (await uploadResp.json()) as VisitOcrJobResponse;

      // 🔹 OCR 결과 텍스트가 비어 있으면 파싱까지 가지 않음
      if (!uploadData.text?.trim()) {
        toast.error(
          "OCR 결과 텍스트가 비어 있습니다. 이미지 상태를 다시 확인해 주세요."
        );
        setOcrStep("preview");
        return;
      }

      // 2) 두 번째 요청: OCR 텍스트를 GPT로 파싱하는 API 호출 (→ OCR 서버 8003)
      const parseResp = await fetch(
        `${OCR_API_BASE_URL}/visits/${visitId}/ocr/parse`,
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
          const errorBody = await parseResp.json();
          detail = errorBody?.detail ?? "";
        } catch {
          detail = "";
        }
        throw new Error(detail || `OCR 파싱 실패 (${parseResp.status})`);
      }

      const parsed = (await parseResp.json()) as VisitParsedResponse;
      const mapped = mapParsedToHistory(parsed);

      const hasAnyValue = Object.values(mapped).some(
        (value) => !!value?.toString().trim()
      );

      if (!hasAnyValue) {
        toast.error(
          "인식된 데이터가 없습니다. 이미지 상태를 확인해 주세요."
        );
        setOcrStep("preview");
        return;
      }

      toast.success("OCR 결과를 불러왔습니다.");
      setOcrStep("preview");
      onComplete(mapped);
    } catch (err) {
      console.error("Visit OCR 처리 오류:", err);
      toast.error("OCR 처리 중 오류가 발생했습니다. 다시 시도해 주세요.");
      setOcrStep("preview");
    }
  };

  const handleScanAgain = () => {
    resetSelection();
    setOcrStep("selectMethod");
  };

  return (
    <div className="p-4 space-y-4">
      <button
        onClick={onCancel}
        className="flex items-center gap-1 text-mint font-semibold mb-2"
      >
        <HiOutlineArrowLeft /> 취소
      </button>

      <div className="bg-white p-6 rounded-lg shadow-lg text-center">
        {/* 1. (selectMethod) 촬영/앨범 선택 */}
        {ocrStep === "selectMethod" && (
          <div>
            <HiOutlineCamera className="text-3xl text-mint mx-auto mb-2" />
            <h3 className="font-semibold text-dark-gray mb-4">OCR 스캔</h3>
            <p className="text-sm text-gray-600 mb-4">
              진료확인서를 업로드하면 자동으로 값을 채워드려요.
            </p>

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
                className="flex-1 flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <HiOutlineCamera className="text-3xl text-mint" />
                <span className="text-sm font-semibold mt-1">
                  카메라 촬영
                </span>
              </label>
              <label
                htmlFor="album-input"
                className="flex-1 flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <HiOutlinePhotograph className="text-3xl text-mint" />
                <span className="text-sm font-semibold mt-1">
                  앨범에서 선택
                </span>
              </label>
            </div>
          </div>
        )}

        {/* 2. (preview) 이미지 미리보기 & 스캔 시작 */}
        {ocrStep === "preview" && imagePreview && (
          <div>
            <h3 className="font-semibold text-dark-gray mb-3">
              이미지 미리보기
            </h3>
            <img
              src={imagePreview}
              alt="Visit OCR Preview"
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

        {/* 3. (scanning) 스캔 로딩 UI */}
        {ocrStep === "scanning" && (
          <div className="h-48 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-mint border-t-transparent rounded-full animate-spin mb-6"></div>
            <h2 className="text-xl font-bold text-dark-gray mb-2">
              스캔 중입니다...
            </h2>
            <p className="text-sm text-gray-600">
              문서를 분석하고 있습니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
