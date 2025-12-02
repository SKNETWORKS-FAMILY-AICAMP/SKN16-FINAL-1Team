// src/components/domain/HealthInfo/DiseaseModal.tsx

import React, { useState, type ChangeEvent, type FormEvent } from 'react';
import { HiOutlineX } from 'react-icons/hi';
import useHealthDataStore from '../../../store/useHealthDataStore';
import { toast } from 'react-toastify';

interface DiseaseForm {
  name: string;
  type: '만성질환' | '급성질병';
  meds: string;
}

type ModalProps = {
  onClose: () => void;
  defaultType: 'chronic' | 'simple';
};

export default function DiseaseModal({ onClose, defaultType }: ModalProps) {
  const [formData, setFormData] = useState<DiseaseForm>({
    name: '',
    type: defaultType === 'chronic' ? '만성질환' : '급성질병',
    meds: '',
  });

  const addDisease = useHealthDataStore((state) => state.addDisease);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('질환명을 입력해주세요.');
      return;
    }

    addDisease({
      name: formData.name,
      type: formData.type === '만성질환' ? 'chronic' : 'simple',
      meds: formData.meds,
    });

    toast.success('질환이 추가되었습니다.');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-lg shadow-popup p-6 z-50" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold text-dark-gray">질환 추가</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-dark-gray text-2xl">
            <HiOutlineX />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-6">질환 정보를 입력하세요.</p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">질환명</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="예: 고혈압"
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mint bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">유형</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mint bg-white"
            >
              <option>만성질환</option>
              <option>급성질병</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">관련 복용약</label>
            <input
              type="text"
              name="meds"
              value={formData.meds}
              onChange={handleChange}
              placeholder="예: 아모디핀, 메트포르민"
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mint"
            />
            <p className="text-xs text-gray-500 mt-1">쉼표(,)로 구분하여 입력</p>
          </div>

          <button type="submit" className="w-full bg-mint hover:bg-mint-dark text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200 mt-6">
            추가
          </button>
        </form>
      </div>
    </div>
  );
}

