// src/components/domain/HealthInfo/BasicInfoTab.tsx

import React, { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import { HiOutlineUserCircle } from "react-icons/hi";
import { toast } from "react-toastify";
import useHealthDataStore from "../../../store/useHealthDataStore";
import {
  getHealthProfile,
  createHealthProfile,
  updateHealthProfile,
  type HealthProfileResponse,
} from "../../../api/healthAPI";

interface BasicInfoForm {
  birth: string;
  gender: string;
  bloodType: string;
  height: string;
  weight: string;
  drink: string;
  smoke: string;
}

export default function BasicInfoTab() {
  const storeBasicInfo = useHealthDataStore((state) => state.basicInfo);
  const updateBasicInfo = useHealthDataStore((state) => state.updateBasicInfo);

  const [formData, setFormData] = useState<BasicInfoForm>(storeBasicInfo);
  const [profileId, setProfileId] = useState<number | null>(null);

  useEffect(() => {
    setFormData(storeBasicInfo);
  }, [storeBasicInfo]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await getHealthProfile();
        const mapped = mapProfileToForm(profile);
        setFormData(mapped);
        updateBasicInfo(mapped as any);
        setProfileId(profile.profile_id);
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 404) {
          return; // 프로필 없음 → 빈 폼 유지
        }
        console.error("건강 프로필 조회 실패:", err);
        toast.error("건강 프로필을 불러오지 못했습니다.");
      }
    };
    fetchProfile();
  }, [updateBasicInfo]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();

    try {
      const payload = toProfilePayload(formData);
      const saved = profileId
        ? await updateHealthProfile(payload)
        : await createHealthProfile(payload);

      const mapped = mapProfileToForm(saved);
      setFormData(mapped);
      updateBasicInfo(mapped as any);
      setProfileId(saved.profile_id);
      toast.success(profileId ? "기본 정보가 수정되었습니다." : "기본 정보가 저장되었습니다.");
    } catch (err) {
      console.error("건강 프로필 저장 실패:", err);
      toast.error("건강 프로필 저장에 실패했습니다.");
    }
  };

  return (
    <>
      <div className="w-full bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-2 mb-2">
          <HiOutlineUserCircle className="text-mint text-2xl" />
          <h3 className="text-lg font-bold text-dark-gray">기본 건강정보</h3>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          건강 관리의 기본이 되는 정보를 입력해 주세요.
        </p>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-x-4 gap-y-5">
          <div className="col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-1">생년월일</label>
            <input
              type="date"
              name="birth"
              value={formData.birth}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mint"
            />
          </div>
          
          <div className="col-span-1">
            <label className="block text-sm font-bold text-gray-700 mb-1">성별</label>
            <select 
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mint bg-white"
            >
              <option>남성</option>
              <option>여성</option>
            </select>
          </div>

          <div className="col-span-1">
            <label className="block text-sm font-bold text-gray-700 mb-1">혈액형</label>
            <select 
              name="bloodType"
              value={formData.bloodType}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mint bg-white"
            >
              <option>A+</option> <option>A-</option> <option>B+</option> <option>B-</option>
              <option>AB+</option> <option>AB-</option> <option>O+</option> <option>O-</option>
            </select>
          </div>

          <div className="col-span-1">
            <label className="block text-sm font-bold text-gray-700 mb-1">키(cm)</label>
            <input
              type="number"
              name="height"
              value={formData.height}
              onChange={handleChange}
              placeholder="170"
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mint"
            />
          </div>

          <div className="col-span-1">
            <label className="block text-sm font-bold text-gray-700 mb-1">몸무게(kg)</label>
            <input
              type="number"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              placeholder="80"
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mint"
            />
          </div>

          <div className="col-span-1">
            <label className="block text-sm font-bold text-gray-700 mb-1">음주 빈도</label>
            <select 
              name="drink"
              value={formData.drink}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mint bg-white"
            >
              <option>거의 안마심</option> <option>주1회이하</option> <option>주2-4회</option>
              <option>월2-3회</option> <option>월4회이상</option>
            </select>
          </div>

          <div className="col-span-1">
            <label className="block text-sm font-bold text-gray-700 mb-1">흡연 상태</label>
            <select 
              name="smoke"
              value={formData.smoke}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mint bg-white"
            >
              <option>비흡연자</option> <option>과거 흡연자</option> <option>현재 흡연자</option>
            </select>
          </div>
        </form>
        <button 
          type="submit"
          onClick={handleSubmit}
          className="w-full h-14 bg-mint hover:bg-mint-dark text-white font-bold rounded-lg mt-6 transition-colors"
        >
          정보 저장하기
        </button>
      </div>
    </>
  );
}

function mapProfileToForm(profile: HealthProfileResponse): BasicInfoForm {
  return {
    birth: profile.birth,
    gender: profile.gender,
    bloodType: profile.blood_type,
    height: String(profile.height ?? ""),
    weight: String(profile.weight ?? ""),
    drink: profile.drinking,
    smoke: profile.smoking,
  };
}

function toProfilePayload(form: BasicInfoForm) {
  return {
    birth: form.birth,
    gender: form.gender,
    blood_type: form.bloodType,
    height: Number(form.height) || 0,
    weight: Number(form.weight) || 0,
    drinking: form.drink,
    smoking: form.smoke,
  };
}
