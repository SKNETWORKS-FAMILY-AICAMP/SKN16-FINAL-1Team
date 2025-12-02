// src/pages/Analysis/AnalysisPage.tsx

import React from 'react';
import { 
  HiOutlineUser, 
  HiOutlineHeart, 
  HiOutlineTrendingUp, 
  HiOutlineDocumentText 
} from 'react-icons/hi';
import useHealthDataStore from '../../store/useHealthDataStore';

// BMI 계산 함수
const calculateBmi = (height: number, weight: number): string => {
  if (!height || !weight) return "N/A";
  const mHeight = height / 100;
  const bmi = weight / (mHeight * mHeight);
  return bmi.toFixed(1);
};
// (만 나이 계산 함수 - 예시)
const getKoreanAge = (birth: string) => {
  if (!birth) return 'N/A';
  const birthDate = new Date(birth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
  }
  return age;
}

export default function AnalysisPage() {
  const { basicInfo } = useHealthDataStore();
  // 스토어의 데이터로 BMI와 나이 계산
  const bmi = calculateBmi(Number(basicInfo.height), Number(basicInfo.weight));
  const age = getKoreanAge(basicInfo.birth);

  return (
    <div className="flex flex-col p-4 pb-16 space-y-4">
      {/* 상단 서브헤더 (페이지 공통) */}
      <header className="w-full bg-mint/10 p-4 shadow-sm rounded-lg">
        <h2 className="text-xl font-bold text-dark-gray">건강분석</h2>
        <p className="text-sm text-gray-500">
          입력된 정보를 바탕으로 건강 상태를 분석합니다.
        </p>
      </header>

      {/* 기본 건강정보 */}
      <section className="w-full bg-white rounded-lg shadow-lg p-6 flex items-center gap-4">
        <HiOutlineUser className="text-mint text-4xl" />
        <div>
          <h3 className="text-lg font-bold text-dark-gray">
            {/* (가상) 홍길동 님 -> 나중에 useUserStore에서 가져와야 함 */}
            홍길동 님 (만 {age}세)
          </h3>
          <p className="text-sm text-gray-500">
            {basicInfo.gender} | {basicInfo.height}cm | {basicInfo.weight}kg
          </p>
          <p className="text-sm text-gray-700 font-semibold mt-1">
            BMI: {bmi} {/* (BMI 결과에 따라 '과체중' 등을 표시하는 로직 추가) */}
          </p>
        </div>
      </section>

      {/* 건강 분석 리포트 */}
      <section className="w-full bg-white rounded-lg shadow-lg">
        <div className="flex items-center gap-2 p-4 border-b">
          <HiOutlineDocumentText className="text-mint text-2xl" />
          <h3 className="text-lg font-bold text-dark-gray">건강 분석 리포트</h3>
        </div>
        
        {/* 메모장 형식 UI */}
        <div className="p-6 bg-yellow-50 min-h-[200px] text-dark-gray leading-relaxed">
          <p className="font-semibold text-gray-700">2025년 11월 8일</p>
          <br />
          <p>
            - 현재 BMI 지수({bmi})는 <span className="font-bold text-red-600">과체중</span> 범위입니다. 
            체중 관리를 위한 식단 조절 및 유산소 운동을 권고합니다.
          </p>
          <p>
            - '고혈압' 및 '당뇨병(2형)' 만성질환을 보유 중입니다. '아모디핀', '메트포민'을 꾸준히 복용하고 계신 점이 긍정적입니다.
          </p>
          <p>
            - 최근 1주일간 건강 추세가 상승세입니다. 좋은 컨디션을 유지하세요!
          </p>
        </div>
      </section>
    </div>
  );
}