import React, { useState, type ChangeEvent, type FormEvent, useEffect } from "react";
import type { HistoryRecord } from "./HistoryDetailModal";
import { toast } from "react-toastify";

export type HistoryFormData = Omit<HistoryRecord, "id" | "meds">;
type FormProps = {
  onSave: (data: HistoryFormData) => Promise<void> | void;
  onCancel: () => void;
  initialData?: Partial<HistoryFormData>;
};

const BLANK_FORM: HistoryFormData = {
  title: "",
  date: new Date().toISOString().split("T")[0],
  hospital: "",
  doctor: "",
  symptoms: "",
  notes: "",
};

export default function HistoryForm({ onSave, onCancel, initialData }: FormProps) {
  const [form, setForm] = useState<HistoryFormData>({ ...BLANK_FORM, ...initialData });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm({ ...BLANK_FORM, ...initialData });
  }, [initialData]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.hospital || !form.date) {
      toast.error("진단명, 병원, 진료일은 필수입니다.");
      return;
    }
    if (submitting) return;
    try {
      setSubmitting(true);
      await onSave(form);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-bold text-dark-gray mb-6">진료기록 상세 입력</h3>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">진단명*</label>
          <input
            name="title"
            type="text"
            placeholder="예: 고혈압 정기검진"
            value={form.title}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mint"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-sm font-bold text-gray-700 mb-1 col-span-2">진료일*</label>
          <input
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mint col-span-2"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">병원 *</label>
            <input
              name="hospital"
              type="text"
              placeholder="예: 서울대학교병원"
              value={form.hospital}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mint"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">담당의</label>
            <input
              name="doctor"
              type="text"
              placeholder="예: 김메디"
              value={form.doctor}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mint"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">증상</label>
          <textarea
            name="symptoms"
            rows={3}
            placeholder="예: 두통, 어지러움"
            value={form.symptoms}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mint"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">의사 소견</label>
          <textarea
            name="notes"
            rows={3}
            placeholder="예: 혈압 조절 필요"
            value={form.notes}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mint"
          />
        </div>
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 border rounded-lg hover:bg-gray-100 text-gray-700"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-mint hover:bg-mint-dark text-white font-bold py-3 px-4 rounded-lg disabled:opacity-60"
          >
            {submitting ? "저장 중..." : "추가"}
          </button>
        </div>
      </form>
    </div>
  );
}
