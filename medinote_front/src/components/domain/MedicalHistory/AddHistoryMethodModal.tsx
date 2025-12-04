// src/components/domain/MedicalHistory/AddHistoryMethodModal.tsx

import React from 'react';
import { HiOutlineX, HiOutlinePencilAlt, HiOutlineMicrophone, HiOutlineCamera } from 'react-icons/hi';

type ModalProps = {
  onClose: () => void;
  onSelectMethod: (method: 'direct' | 'voice' | 'ocr') => void;
};

export default function AddHistoryMethodModal({ onClose, onSelectMethod }: ModalProps) {
  return (
    // 뒷배경 (Dim)
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* 흰색 모달 팝업 본체 */}
      <div 
        className="w-full max-w-md bg-white rounded-lg shadow-popup p-6 z-50"
        onClick={(e) => e.stopPropagation()} 
      >
        {/* 상단 제목 및 닫기 버튼 */}
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold text-dark-gray">새 진료기록 추가</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-dark-gray text-2xl"
          >
            <HiOutlineX />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          어떤 방식으로 기록을 추가하시겠어요?
        </p>

        {/* 방식 선택 */}
        <div className="space-y-3">
          <MethodCard
            icon={<HiOutlinePencilAlt />}
            title="직접 입력"
            description="진료 내역을 직접 입력합니다."
            onClick={() => onSelectMethod('direct')}
          />
          <MethodCard
            icon={<HiOutlineMicrophone />}
            title="음성 녹음"
            description="진료 대화를 녹음해 자동으로 입력합니다."
            onClick={() => onSelectMethod('voice')}
          />
          <MethodCard
            icon={<HiOutlineCamera />}
            title="OCR 스캔"
            description="진료확인서 또는 진단서를 간편하게 스캔합니다."
            onClick={() => onSelectMethod('ocr')}
          />
        </div>
      </div>
    </div>
  );
}

// --- 서브 컴포넌트: MethodCard ---
type CardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
};

function MethodCard({ icon, title, description, onClick }: CardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 border rounded-lg text-left hover:bg-mint/10 hover:border-mint transition-all"
    >
      <div className="text-3xl text-mint">{icon}</div>
      <div>
        <h3 className="font-bold text-lg text-dark-gray">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </button>
  );
}