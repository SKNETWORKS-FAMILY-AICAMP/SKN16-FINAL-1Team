// src/components/domain/MedicalHistory/VoiceRecordingFlow.tsx

import React, { useState, type ChangeEvent } from 'react';
import { HiOutlineMicrophone, HiOutlineArrowLeft, HiOutlineCheck, HiOutlineSpeakerphone } from 'react-icons/hi';
import { toast } from 'react-toastify';
import { type HistoryFormData } from './HistoryForm'; 

type FlowStep = 'consent' | 'recording' | 'processing';
type Props = {
  onComplete: (data: Partial<HistoryFormData>) => void;
  onCancel: () => void;
};

export default function VoiceRecordingFlow({ onComplete, onCancel }: Props) {
  const [step, setStep] = useState<FlowStep>('consent');
  const [hasConsented, setHasConsented] = useState(false);

  // 파일 선택(녹음 완료) 핸들러
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast.error("녹음 파일이 선택되지 않았습니다.");
      return;
    }

    // 파일 오면 "처리 중" 로딩 UI로 변경
    setStep('processing');
    toast.info("오디오 파일을 수신했습니다. 텍스트 변환을 시작합니다.");

    // 가상 STT API 호출(3초)
    setTimeout(() => {
      const fakeSTTData: Partial<HistoryFormData> = {
        title: "스트레스성 편두통",
        symptoms: "어제부터 머리가 아프고 속이 메스꺼움",
        notes: "충분한 수면이 필요합니다."
      };
      onComplete(fakeSTTData);
    }, 3000);
  };

  // --- UI 렌더링 ---

  // 1. 동의 단계
  if (step === 'consent') {
    return (
      <div className="p-4 space-y-4">
        <button onClick={onCancel} className="flex items-center gap-1 text-mint font-semibold mb-2">
          <HiOutlineArrowLeft /> 취소
        </button>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <HiOutlineSpeakerphone className="text-2xl text-mint" />
            <h2 className="text-xl font-bold text-dark-gray">의료진 동의 및 확인</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            의료법에 따라, 진료실 내 대화 녹음은 의료진의 동의가 필요할 수 있습니다.
            본 녹음은 의료진의 동의를 받았으며, 순수 본인의 건강 기록 참고용으로만 사용됨을 확인합니다.
          </p>
          <label className="flex items-center gap-2 cursor-pointer">
            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${hasConsented ? 'bg-mint border-mint' : 'bg-white border-gray-300'}`}>
              {hasConsented && <HiOutlineCheck className="text-white text-sm" />}
            </div>
            <input 
              type="checkbox"
              checked={hasConsented}
              onChange={(e) => setHasConsented(e.target.checked)}
              className="hidden"
            />
            <span className="text-sm font-medium text-gray-700">위 내용에 동의합니다.</span>
          </label>
          <button
            onClick={() => setStep('recording')}
            disabled={!hasConsented}
            className="w-full mt-6 py-3 bg-mint text-white font-bold rounded-lg shadow disabled:opacity-50 disabled:bg-gray-400"
          >
            동의하고 녹음 시작하기
          </button>
        </div>
      </div>
    );
  }

  // 2. 녹음 단계
  if (step === 'recording') {
    return (
      <div className="p-4 space-y-4">
        <button onClick={() => setStep('consent')} className="flex items-center gap-1 text-mint font-semibold mb-2">
          <HiOutlineArrowLeft /> 동의 단계로
        </button>
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <h2 className="text-xl font-bold text-dark-gray mb-4">음성 녹음</h2>
          <p className="text-sm text-gray-600 mb-6">
            아래 버튼을 눌러 기본 녹음기를 실행하세요.<br/>
            녹음 완료 후, '완료' 또는 '확인'을 누르면 변환이 시작됩니다.
          </p>
          
          {/* 숨겨진 실제 <input> 태그. 폰의 마이크를 켭니다. */}
          <input 
            type="file" 
            id="stt-file-input"
            accept="audio/*"
            capture={true}
            className="hidden" 
            onChange={handleFileChange}
          />

          {/* 사용자가 누르는 <label> 버튼 */}
          <label 
            htmlFor="stt-file-input"
            className="w-24 h-24 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center mx-auto shadow-xl cursor-pointer"
          >
            <HiOutlineMicrophone className="text-4xl" />
          </label>
          <p className="text-sm text-red-500 font-semibold mt-3">녹음 시작</p>
        </div>
      </div>
    );
  }

  // 3. 처리 중 (로딩) 단계
  if (step === 'processing') {
    return (
      <div className="p-4">
        <div className="bg-white p-10 rounded-lg shadow-lg text-center flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-mint border-t-transparent rounded-full animate-spin mb-6"></div>
          <h2 className="text-xl font-bold text-dark-gray mb-2">
            텍스트 변환 중...
          </h2>
          <p className="text-sm text-gray-600">
            입력폼에 자동 입력중입니다.<br/>
            잠시만 기다려주세요.
          </p>
        </div>
      </div>
    );
  }
  
  return null;
}