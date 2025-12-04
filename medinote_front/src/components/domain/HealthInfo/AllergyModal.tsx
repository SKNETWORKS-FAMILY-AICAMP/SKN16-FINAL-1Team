// src/components/domain/HealthInfo/AllergyModal.tsx

import React, { useState, type FormEvent } from 'react';
import { HiOutlineX } from 'react-icons/hi';
import useHealthDataStore from '../../../store/useHealthDataStore';
import { toast } from 'react-toastify';

type ModalProps = { onClose: () => void };

export default function AllergyModal({ onClose }: ModalProps) {
  const [name, setName] = useState('');
  const addAllergy = useHealthDataStore((state) => state.addAllergy);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('알러지명을 입력해주세요.');
      return;
    }
    addAllergy({ name });
    toast.success('알러지가 추가되었습니다.');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-sm bg-white rounded-lg shadow-popup p-6 z-50" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold text-dark-gray">알러지 추가</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-dark-gray text-2xl">
            <HiOutlineX />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-6">주의해야 할 알러지를 등록하세요.</p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">알러지명</label>
            <input
              type="text"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 땅콩"
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mint"
            />
          </div>

          <button type="submit" className="w-full bg-mint hover:bg-mint-dark text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200 mt-2">
            추가
          </button>
        </form>
      </div>
    </div>
  );
}

