// src/components/domain/MedicalHistory/OcrFlow.tsx

import React, { useState, type ChangeEvent } from 'react';
import { HiOutlineArrowLeft, HiOutlineCamera, HiOutlinePhotograph } from 'react-icons/hi';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../../utils/config';
import { type HistoryFormData } from './HistoryForm';

type OcrStep = 'selectMethod' | 'preview' | 'scanning';
type Props = {
  onComplete: (data: Partial<HistoryFormData>) => void;
  onCancel: () => void;
};

type VisitParsedResponse = Partial<
  Pick<HistoryFormData, 'title' | 'date' | 'hospital' | 'doctor' | 'symptoms' | 'notes'>
>;

type OcrAnalyzeResponse = {
  status: string;
  source_type: string;
  raw_text: string;
  parsed: VisitParsedResponse;
  job_id?: number;
};

const OCR_API_BASE = (
  (import.meta.env.VITE_OCR_API_URL as string | undefined) ?? API_BASE_URL
).replace(/\/$/, '');

export default function OcrFlow({ onComplete, onCancel }: Props) {
  const [ocrStep, setOcrStep] = useState<OcrStep>('selectMethod');
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
      toast.error('이미지 파일을 선택해 주세요.');
      return;
    }
    setOcrFile(file);
    setImagePreview(URL.createObjectURL(file));
    setOcrStep('preview');
    event.target.value = '';
  };

  const mapParsedToHistory = (parsed: VisitParsedResponse): Partial<HistoryFormData> => ({
    title: parsed.title ?? '',
    date: parsed.date ?? '',
    hospital: parsed.hospital ?? '',
    doctor: parsed.doctor ?? '',
    symptoms: parsed.symptoms ?? '',
    notes: parsed.notes ?? '',
  });

  const handleScanStart = async () => {
    if (!ocrFile) {
      toast.error('파일을 먼저 선택해 주세요.');
      return;
    }

    setOcrStep('scanning');

    const formData = new FormData();
    formData.append('file', ocrFile);
    formData.append('source_type', 'visit');

    try {
      const resp = await fetch(`${OCR_API_BASE}/ocr/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!resp.ok) {
        let detail = '';
        try {
          const errorBody = await resp.json();
          detail = errorBody?.detail ?? '';
        } catch {
          detail = '';
        }
        throw new Error(detail || `OCR 요청 실패 (${resp.status})`);
      }

      const data = (await resp.json()) as OcrAnalyzeResponse;
      const parsed = data?.parsed || {};
      const mapped = mapParsedToHistory(parsed);
      const hasAnyValue = Object.values(mapped).some((value) => !!value?.toString().trim());

      if (!hasAnyValue) {
        toast.error('인식된 데이터가 없습니다. 이미지 상태를 확인해 주세요.');
        setOcrStep('preview');
        return;
      }

      toast.success('OCR 결과를 불러왔습니다.');
      setOcrStep('preview');
      onComplete(mapped);
    } catch (err) {
      console.error('OCR analyze error', err);
      toast.error('OCR 처리 중 오류가 발생했습니다. 다시 시도해 주세요.');
      setOcrStep('preview');
    }
  };

  const handleScanAgain = () => {
    resetSelection();
    setOcrStep('selectMethod');
  };

  return (
    <div className="p-4 space-y-4">
      <button onClick={onCancel} className="flex items-center gap-1 text-mint font-semibold mb-2">
        <HiOutlineArrowLeft /> 취소
      </button>

      <div className="bg-white p-6 rounded-lg shadow-lg text-center">
        {/* 1. (selectMethod) 촬영/앨범 선택 */}
        {ocrStep === 'selectMethod' && (
          <div>
            <HiOutlineCamera className="text-3xl text-mint mx-auto mb-2" />
            <h3 className="font-semibold text-dark-gray mb-4">OCR 스캔</h3>
            <p className="text-sm text-gray-600 mb-4">
              진료확인서를 업로드하면 자동으로 값을 채워드려요.
            </p>

            <input type="file" id="camera-input" accept="image/*" capture className="hidden" onChange={handleImageSelect} />
            <input type="file" id="album-input" accept="image/*" className="hidden" onChange={handleImageSelect} />

            <div className="flex gap-4 justify-center">
              <label
                htmlFor="camera-input"
                className="flex-1 flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <HiOutlineCamera className="text-3xl text-mint" />
                <span className="text-sm font-semibold mt-1">카메라 촬영</span>
              </label>
              <label
                htmlFor="album-input"
                className="flex-1 flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <HiOutlinePhotograph className="text-3xl text-mint" />
                <span className="text-sm font-semibold mt-1">앨범에서 선택</span>
              </label>
            </div>
          </div>
        )}

        {/* 2. (preview) 이미지 미리보기 & 스캔 시작 */}
        {ocrStep === 'preview' && imagePreview && (
          <div>
            <h3 className="font-semibold text-dark-gray mb-3">이미지 미리보기</h3>
            <img src={imagePreview} alt="Prescription Preview" className="rounded-lg mb-3" />
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
        {ocrStep === 'scanning' && (
          <div className="h-48 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-mint border-t-transparent rounded-full animate-spin mb-6"></div>
            <h2 className="text-xl font-bold text-dark-gray mb-2">스캔 중입니다...</h2>
            <p className="text-sm text-gray-600">문서를 분석하고 있습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
