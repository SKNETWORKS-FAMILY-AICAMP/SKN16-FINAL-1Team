// src/components/domain/MedicalHistory/OcrFlow.tsx

import React, { useState, type ChangeEvent } from 'react';
import { 
  HiOutlineArrowLeft, 
  HiOutlineCheckCircle,
  HiOutlineCamera,
  HiOutlinePhotograph,
  HiOutlineRefresh
} from 'react-icons/hi';
import { toast } from 'react-toastify';
import { type HistoryFormData } from './HistoryForm'; 

type OcrStep = 'selectMethod' | 'preview' | 'scanning';
type Props = {
  onComplete: (data: Partial<HistoryFormData>) => void;
  onCancel: () => void;
};

export default function OcrFlow({ onComplete, onCancel }: Props) {
  const [ocrStep, setOcrStep] = useState<OcrStep>('selectMethod');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // (가상) 이미지 선택 핸들러
  const handleImageSelect = (event?: ChangeEvent<HTMLInputElement>) => {
    // (실제 HTML5 파일 입력 로직 - 지금은 모의)
    // const file = event?.target.files?.[0];
    // if (!file) return;
    // const url = URL.createObjectURL(file);
    
    toast.info("이미지를 선택했습니다. (가상)");
    // (가상) 이미지 미리보기 URL 설정
    setImagePreview("https://placehold.co/400x300/eee/ccc?text=Scanned+Receipt+Preview");
    setOcrStep('preview');
  };

  // (가상) 스캔 시작 핸들러
  const handleScanStart = () => {
    setOcrStep('scanning'); // 로딩 UI 표시
    
    // 2초간 스캔 API를 호출하는 척
    setTimeout(() => {
      const fakeOcrData: Partial<HistoryFormData> = {
        title: "식곤증",
        date: "2025-11-15",
        hospital: "서울성모병원",
        doctor: "박성모",
        notes: "눈을 뜨세요"
      };
      onComplete(fakeOcrData);
    }, 2000);
  };

  const handleScanAgain = () => {
    setOcrStep('selectMethod');
    setImagePreview(null);
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
              진료확인서 또는 진단서를 간편하게 스캔합니다.
            </p>
            
            {/* 실제 파일 입력을 위한 숨겨진 input들 */}
            {/* 'capture' 속성은 카메라를 우선으로 켭니다 */}
            <input type="file" id="camera-input" accept="image/*" capture className="hidden" onChange={handleImageSelect} />
            <input type="file" id="album-input" accept="image/*" className="hidden" onChange={handleImageSelect} />

            <div className="flex gap-4 justify-center">
              {/* label로 input과 연결 */}
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

        {/* 2. (preview) 이미지 미리보기 및 스캔 시작 */}
        {ocrStep === 'preview' && imagePreview && (
          <div>
            <h3 className="font-semibold text-dark-gray mb-3">이미지 미리보기</h3>
            <img src={imagePreview} alt="Prescription Preview" className="rounded-lg mb-3" />
            <div className="flex gap-3">
              <button type="button" onClick={handleScanAgain} className="flex-1 py-2 border rounded-lg hover:bg-gray-100 text-gray-700">
                다시 선택
              </button>
              <button type="button" onClick={handleScanStart} className="flex-1 bg-mint text-white font-semibold rounded-lg hover:bg-mint-dark">
                스캔 시작
              </button>
            </div>
          </div>
        )}

        {/* 3. (scanning) 스캔 중 로딩 UI */}
        {ocrStep === 'scanning' && (
          <div className="h-48 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-mint border-t-transparent rounded-full animate-spin mb-6"></div>
            <h2 className="text-xl font-bold text-dark-gray mb-2">
              스캔 중입니다...
            </h2>
            <p className="text-sm text-gray-600">
              입력폼에 자동 입력중입니다.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}