// src/components/domain/HealthInfo/AllergyDetailModal.tsx

import React, { useState, type ChangeEvent, type FormEvent } from 'react';
import { HiOutlineX } from 'react-icons/hi';
import useHealthDataStore, { type Allergy } from '../../../store/useHealthDataStore';
import { toast } from 'react-toastify';

type Props = {
  allergy: Allergy;
  onClose: () => void;
};

export default function AllergyDetailModal({ allergy, onClose }: Props) {
  const updateAllergy = useHealthDataStore((s) => s.updateAllergy);
  const deleteAllergy = useHealthDataStore((s) => s.deleteAllergy);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(allergy.name);

  const onSave = (e: FormEvent) => {
    e.preventDefault();
    updateAllergy(allergy.id, { name });
    toast.success('수정되었습니다');
    onClose();
  };

  const onDelete = () => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      deleteAllergy(allergy.id);
      toast.success('삭제되었습니다.');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-sm bg-white rounded-lg shadow-popup p-6 z-50" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold text-dark-gray">알러지 상세</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-dark-gray text-2xl">
            <HiOutlineX />
          </button>
        </div>

        {!editing ? (
          <div className="text-lg font-bold text-dark-gray">{name}</div>
        ) : (
          <form className="space-y-4" onSubmit={onSave}>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">알러지명</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mint" />
            </div>
            <div className="flex gap-3 mt-2">
              <button type="button" onClick={() => setEditing(false)} className="flex-1 py-3 border rounded-lg hover:bg-gray-100 text-gray-700">취소</button>
              <button type="submit" className="flex-1 bg-mint hover:bg-mint-dark text-white font-bold py-3 px-4 rounded-lg">저장</button>
            </div>
          </form>
        )}

        {!editing && (
          <div className="flex gap-3 mt-6">
            <button onClick={() => setEditing(true)} className="flex-1 bg-mint hover:bg-mint-dark text-white font-bold py-3 px-4 rounded-lg">수정</button>
            <button onClick={onDelete} className="flex-1 border border-red-300 text-red-500 hover:bg-red-50 font-bold py-3 px-4 rounded-lg">삭제</button>
          </div>
        )}
      </div>
    </div>
  );
}
