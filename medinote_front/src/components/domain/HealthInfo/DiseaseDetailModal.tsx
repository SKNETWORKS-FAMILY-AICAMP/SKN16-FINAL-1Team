// src/components/domain/HealthInfo/DiseaseDetailModal.tsx

import React, { useState, type ChangeEvent, type FormEvent } from 'react';
import { HiOutlineX } from 'react-icons/hi';
import useHealthDataStore, { type Disease } from '../../../store/useHealthDataStore';
import { toast } from 'react-toastify';

type Props = {
  disease: Disease;
  onClose: () => void;
};

export default function DiseaseDetailModal({ disease, onClose }: Props) {
  const updateDisease = useHealthDataStore((s) => s.updateDisease);
  const deleteDisease = useHealthDataStore((s) => s.deleteDisease);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: disease.name,
    type: disease.type === 'chronic' ? '만성질환' : '급성질병',
    meds: disease.meds,
  });

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const onSave = (e: FormEvent) => {
    e.preventDefault();
    updateDisease(disease.id, {
      name: form.name,
      type: form.type === '만성질환' ? 'chronic' : 'simple',
      meds: form.meds,
    });
    toast.success('수정되었습니다');
    onClose();
  };

  const onDelete = () => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      deleteDisease(disease.id);
      toast.success('삭제되었습니다.');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-lg shadow-popup p-6 z-50" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold text-dark-gray">질환 상세</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-dark-gray text-2xl">
            <HiOutlineX />
          </button>
        </div>

        {!editing ? (
          <div className="space-y-2">
            <div className="text-lg font-bold text-dark-gray">{form.name}</div>
            <div className="text-sm text-gray-500">유형: {form.type}</div>
            {form.meds && <div className="text-sm text-gray-600">관련 복용약: {form.meds}</div>}
          </div>
        ) : (
          <form className="space-y-4" onSubmit={onSave}>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">질환명</label>
              <input name="name" value={form.name} onChange={onChange} className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mint" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">유형</label>
              <select name="type" value={form.type} onChange={onChange} className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mint bg-white">
                <option>만성질환</option>
                <option>급성질병</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">관련 복용약</label>
              <input name="meds" value={form.meds} onChange={onChange} className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mint" />
            </div>
            <div className="flex gap-3 mt-4">
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
