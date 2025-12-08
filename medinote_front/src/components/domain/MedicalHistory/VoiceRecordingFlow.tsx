// src/components/domain/MedicalHistory/VoiceRecordingFlow.tsx

import React, { useState, type ChangeEvent } from 'react';
import { HiOutlineMicrophone, HiOutlineArrowLeft, HiOutlineCheck, HiOutlineSpeakerphone } from 'react-icons/hi';
import { toast } from 'react-toastify';
import { type HistoryFormData } from './HistoryForm'; 
import { apiClient } from '../../../api/axios';
import { HiOutlineFolder } from 'react-icons/hi';

type FlowStep = 'selectMethod' | 'consent' | 'processing';
type Props = {
  onComplete: (data: Partial<HistoryFormData>) => void;
  onCancel: () => void;
};

export default function VoiceRecordingFlow({ onComplete, onCancel }: Props) {
  const [step, setStep] = useState<FlowStep>('selectMethod');
  const [hasConsented, setHasConsented] = useState(false);

  // 파일 선택(녹음 완료) 핸들러
  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast.error("녹음 파일이 선택되지 않았습니다.");
      return;
    }

    setStep('processing');
    toast.info("음성 파일 변환 중...");

    try {
      // 1) 파일 업로드 → stt_id 받기
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await apiClient.post('/stt/analyze', formData);
      const sttId = data.stt_id;

      // 2) Polling으로 결과 대기
      const pollResult = async () => {
        try {
          const res = await apiClient.get(`/stt/${sttId}/status`);
          if (res.data.status === 'done') {
            // 3) 완료되면 결과를 form에 전달
            toast.success("음성 변환 완료!");
            onComplete({
              title: res.data.diagnosis,
              symptoms: res.data.symptoms,
              notes: res.data.notes
            });
          } else if (res.data.status === 'error') {
            toast.error('STT 처리 실패');
            onCancel();
          } else {
            // pending이면 2초 후 재확인
            setTimeout(pollResult, 2000);
          }
        } catch (err) {
          toast.error('상태 확인 중 오류 발생');
          onCancel();
        }
      };
      pollResult();

    } catch (err) {
      toast.error('파일 업로드 실패');
      onCancel();
    }
  };

  // 1. 방법 선택 단계
  if (step === 'selectMethod') {
    return (
      <div className="p-4 space-y-4">
        <button onClick={onCancel} className="flex items-center gap-1 text-mint font-semibold mb-2">
          <HiOutlineArrowLeft /> 취소
        </button>
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <HiOutlineMicrophone className="text-3xl text-mint mx-auto mb-2" />
          <h3 className="font-semibold text-dark-gray mb-4">음성 녹음</h3>
          <p className="text-sm text-gray-600 mb-4">
            진료 내용을 음성으로 기록합니다.
          </p>
          
          <input type="file" id="voice-file-input" accept="audio/*" className="hidden" onChange={handleFileChange} />
          
          <div className="flex gap-4 justify-center">
            <button onClick={() => setStep('consent')} className="flex-1 flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <HiOutlineMicrophone className="text-3xl text-mint" />
              <span className="text-sm font-semibold mt-1">음성녹음</span>
            </button>
            <label htmlFor="voice-file-input" className="flex-1 flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <HiOutlineFolder className="text-3xl text-mint" />
              <span className="text-sm font-semibold mt-1">파일선택</span>
            </label>
          </div>
        </div>
      </div>
    );
  }

  // 2. 동의 단계
  if (step === 'consent') {
    return (
      <div className="p-4 space-y-4">
        <button onClick={() => setStep('selectMethod')} className="...">
          <HiOutlineArrowLeft /> 뒤로
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
          {/* 숨겨진 파일 input */}
          <input 
            type="file" 
            id="stt-record-input"
            accept="audio/*"
            className="hidden" 
            onChange={handleFileChange}
          />

          {/* 녹음 버튼 - 동의 시 빨간색, 미동의 시 회색 */}
          <div className="mt-6 text-center">
            <label 
              htmlFor={hasConsented ? "stt-record-input" : undefined}
              className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-xl ${
                hasConsented 
                  ? 'bg-red-500 hover:bg-red-600 cursor-pointer' 
                  : 'bg-gray-400 cursor-not-allowed'
              } text-white`}
            >
              <HiOutlineMicrophone className="text-4xl" />
            </label>
            <p className={`text-sm font-semibold mt-3 ${hasConsented ? 'text-red-500' : 'text-gray-400'}`}>
              녹음 시작
            </p>
          </div>

        </div>
      </div>
    );
  }

  // 3. 로딩 단계
  if (step === 'processing') {
    return (
      <div className="p-4">
        <div className="bg-white p-10 rounded-lg shadow-lg text-center flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-mint border-t-transparent rounded-full animate-spin mb-6"></div>
          <h2 className="text-xl font-bold text-dark-gray mb-2">
            텍스트 변환 중...
          </h2>
          <p className="text-sm text-gray-600">
            잠시만 기다려주세요.
          </p>
        </div>
      </div>
    );
  }
  
  return null;
}