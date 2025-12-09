// src/pages/Analysis/AnalysisPage.tsx

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlineUser,
  HiOutlineDocumentText,
  HiOutlineRefresh
} from 'react-icons/hi';
import useHealthDataStore from '../../store/useHealthDataStore';
import useUserStore from '../../store/useUserStore';
import { postHealthAnalysis } from '../../api/chatbotAPI';

// BMI 계산 함수
const calculateBmi = (height: number, weight: number): string => {
  if (!height || !weight) return "N/A";
  const mHeight = height / 100;
  const bmi = weight / (mHeight * mHeight);
  return bmi.toFixed(1);
};

// 만 나이 계산 함수
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

// 오늘 날짜 포맷
const getTodayString = () => {
  const today = new Date();
  return `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
};

export default function AnalysisPage() {
  const { basicInfo } = useHealthDataStore();
  const userName = useUserStore((s) => s.user?.name) ?? '사용자';

  const [report, setReport] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 스토어의 데이터로 BMI와 나이 계산
  const bmi = calculateBmi(Number(basicInfo.height), Number(basicInfo.weight));
  const age = getKoreanAge(basicInfo.birth);

  // 건강 분석 요청 함수
  const fetchHealthAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await postHealthAnalysis();
      setReport(response.analysis);
    } catch (err) {
      console.error('건강 분석 요청 실패:', err);
      setError('건강 분석을 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 페이지 로드 시 분석 요청
  useEffect(() => {
    fetchHealthAnalysis();
  }, []);

  return (
    <div className="flex flex-col">
      <header className="w-full bg-mint/10 p-4 shadow-sm">
        <h2 className="text-xl font-bold text-dark-gray">건강분석</h2>
        <p className="text-sm text-gray-500">사용자의 건강 상태를 분석합니다.</p>
      </header>
      <div className="p-4 pb-16 space-y-4">
        {/* 기본 건강정보 */}
        <Link to="/health-info" className="block">
          <section className="w-full bg-white rounded-lg shadow-lg p-6 flex items-center gap-4 hover:bg-gray-50 transition-colors cursor-pointer">
            <HiOutlineUser className="text-mint text-4xl" />
            <div>
              <h3 className="text-lg font-bold text-dark-gray">
                {userName} 님 (만 {age}세)
              </h3>
              <p className="text-sm text-gray-500">
                {basicInfo.gender || '성별 미입력'} | {basicInfo.height || '-'}cm | {basicInfo.weight || '-'}kg
              </p>
              <p className="text-sm text-gray-700 font-semibold mt-1">
                BMI: {bmi}
              </p>
            </div>
          </section>
        </Link>
      
      {/* 건강 분석 리포트 */}
      <section className="w-full bg-white rounded-lg shadow-lg">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <HiOutlineDocumentText className="text-mint text-2xl" />
            <h3 className="text-lg font-bold text-dark-gray">건강 분석 리포트</h3>
          </div>
          <button
            onClick={fetchHealthAnalysis}
            disabled={loading}
            className="p-2 text-mint hover:bg-mint/10 rounded-full disabled:opacity-50"
            title="다시 분석하기"
          >
            <HiOutlineRefresh className={`text-xl ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* 리포트 내용 */}
        <div className="p-6 bg-yellow-50 min-h-[200px] text-dark-gray leading-relaxed">
          <p className="font-semibold text-gray-700 mb-4">{getTodayString()}</p>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mint"></div>
              <span className="ml-3 text-gray-500">건강 상태를 분석 중입니다...</span>
            </div>
          )}

          {error && !loading && (
            <div className="text-red-500 text-center py-8">
              <p>{error}</p>
              <button
                onClick={fetchHealthAnalysis}
                className="mt-4 px-4 py-2 bg-mint text-white rounded-lg hover:bg-mint/90"
              >
                다시 시도
              </button>
            </div>
          )}

          {!loading && !error && report && (
            <div className="whitespace-pre-line">
              {report}
            </div>
          )}

          {!loading && !error && !report && (
            <p className="text-gray-500 text-center py-8">
              분석 결과가 없습니다. 새로고침을 눌러주세요.
            </p>
          )}
        </div>
      </section>
     </div>
    </div>
  );
}
