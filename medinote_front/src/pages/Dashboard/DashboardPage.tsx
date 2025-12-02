// src/pages/Dashboard/DashboardPage.tsx

import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import useScheduleStore from "../../store/useScheduleStore";
import { kstYmd } from "../../utils/date";
import useUserStore from "../../store/useUserStore";
import useHealthDataStore from "../../store/useHealthDataStore";
import {
  HiOutlineUser,
  HiOutlineClipboardList,
  HiOutlineChartBar,
  HiOutlineCalendar,
  HiOutlineArrowRight,
  HiOutlineCheckCircle,
} from "react-icons/hi";

const TOTAL_SLIDES = 2;

export default function DashboardPage() {
  const userName = useUserStore((s) => s.user?.name ?? "");

  const schedules = useScheduleStore((s) => s.schedules);
  const today = kstYmd(); // "YYYY-MM-DD"

  const todays = useMemo(
    () =>
      schedules
        .filter((s) => s.date === today)
        .sort((a, b) => a.time.localeCompare(b.time)),
    [schedules, today]
  );

  const [currentSlide, setCurrentSlide] = useState(0);

  // ⭐ 약 정보 가져오기
  const medications = useHealthDataStore((s) => s.medications);

  // ⭐ 오늘 날짜 기준 복용기간이 유효한 약만 필터링
  const todaysMeds = useMemo(() => {
    return medications.filter((m) => {
      if (!m.startDate || !m.endDate) return false;

      const start = new Date(m.startDate);
      const end = new Date(m.endDate);
      const now = new Date(today);

      // startDate <= today <= endDate
      return start <= now && now <= end;
    });
  }, [medications, today]);

  // ⭐ 복약 체크 상태
  const [medCheckState, setMedCheckState] = useState<Record<string, boolean>>(
    {}
  );
  const handleMedCheck = (id: string) =>
    setMedCheckState((p) => ({ ...p, [id]: !p[id] }));

  const totalMeds = todaysMeds.length;
  const checkedMeds = Object.values(medCheckState).filter(Boolean).length;
  const progressPercent =
    totalMeds > 0 ? (checkedMeds / totalMeds) * 100 : 0;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % TOTAL_SLIDES);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col p-4 pb-16 space-y-6">
      {/* ===== 헤더 슬라이드 ===== */}
      <section className="w-full bg-mint/10 rounded-lg shadow-sm overflow-hidden relative pt-6 pb-10">
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {/* 슬라이드 1 */}
          <div className="w-full flex-shrink-0 px-6 min-h-[120px] flex flex-col justify-center">
            <h2 className="text-2xl font-bold text-dark-gray mb-1">
              <span className="text-mint">{userName || "회원"}</span>님,
              안녕하세요!
            </h2>
            <p className="text-lg text-gray-600">
              오늘도 건강을 기록하고 관리해보세요.
            </p>
          </div>

          {/* 슬라이드 2 */}
          <div className="w-full flex-shrink-0 px-6 min-h-[120px]">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-dark-gray">오늘의 일정</h3>
                <Link
                  to="/schedule"
                  className="text-xs text-mint hover:underline flex items-center"
                >
                  전체보기 <HiOutlineArrowRight className="ml-1" />
                </Link>
              </div>
              {todays.length === 0 ? (
                <p className="text-sm text-gray-400">
                  아직 오늘의 일정이 없습니다.
                </p>
              ) : (
                <ul className="space-y-1">
                  {todays.slice(0, 3).map((s) => (
                    <li key={s.id} className="text-sm text-gray-700">
                      <span className="font-semibold mr-2">{s.time}</span>
                      {s.title}
                    </li>
                  ))}
                  {todays.length > 3 && (
                    <li className="text-xs text-gray-400">
                      + {todays.length - 3}개 더 있음
                    </li>
                  )}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* 네비 버튼 */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
          <button
            onClick={() => setCurrentSlide(0)}
            className={`w-2 h-2 rounded-full transition-all ${
              currentSlide === 0 ? "bg-mint" : "bg-mint/30"
            }`}
          />
          <button
            onClick={() => setCurrentSlide(1)}
            className={`w-2 h-2 rounded-full transition-all ${
              currentSlide === 1 ? "bg-mint" : "bg-mint/30"
            }`}
          />
        </div>
      </section>

      {/* ===== 복약 관리 ===== */}
      <section className="w-full bg-white rounded-lg shadow-lg p-5">
        <div className="flex justify-between items-end mb-3">
          <h3 className="text-lg font-bold text-dark-gray">
            오늘의 복약 관리
          </h3>
          <span className="text-sm text-gray-500 font-medium">
            {progressPercent.toFixed(0)}% 완료 ({checkedMeds}/{totalMeds})
          </span>
        </div>

        {/* 프로그레스 바 */}
        <div className="w-full bg-gray-100 rounded-full h-3 mb-4 overflow-hidden">
          <div
            className="bg-mint h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* 약 리스트 */}
        <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
          {todaysMeds.length > 0 ? (
            todaysMeds.map((m) => (
              <MedCheckItem
                key={m.id}
                time={m.schedule}
                name={`${m.name} (${m.dose}${m.unit})`}
                isChecked={!!medCheckState[m.id]}
                onCheck={() => handleMedCheck(m.id)}
              />
            ))
          ) : (
            <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <p className="text-sm text-gray-400">등록된 약이 없습니다.</p>
              <Link
                to="/health-info"
                className="text-sm text-mint font-bold hover:underline mt-1 inline-block"
              >
                + 약 추가하러 가기
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ===== 메뉴 카드 ===== */}
      <section className="grid grid-cols-2 gap-4">
        <MenuCard
          to="/health-info"
          icon={<HiOutlineUser className="text-mint text-3xl" />}
          title="건강정보"
        />
        <MenuCard
          to="/history"
          icon={<HiOutlineClipboardList className="text-mint text-3xl" />}
          title="진료기록"
        />
        <MenuCard
          to="/analysis"
          icon={<HiOutlineChartBar className="text-mint text-3xl" />}
          title="건강분석"
        />
        <MenuCard
          to="/schedule"
          icon={<HiOutlineCalendar className="text-mint text-3xl" />}
          title="일정관리"
        />
      </section>
    </div>
  );
}

// --- 서브 컴포넌트 ---
type MenuCardProps = {
  to: string;
  icon: React.ReactNode;
  title: string;
};

function MenuCard({ to, icon, title }: MenuCardProps) {
  return (
    <Link
      to={to}
      className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center justify-center space-y-3 hover:shadow-xl hover:scale-105 transition-all duration-200"
    >
      <div className="w-16 h-16 bg-mint/10 rounded-full flex items-center justify-center">
        {icon}
      </div>
      <span className="text-lg font-bold text-dark-gray">{title}</span>
    </Link>
  );
}

type MedCheckProps = {
  time: string;
  name: string;
  isChecked: boolean;
  onCheck: () => void;
};

function MedCheckItem({ time, name, isChecked, onCheck }: MedCheckProps) {
  return (
    <label className="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 border border-transparent hover:border-mint/30 transition-all">
      <input
        type="checkbox"
        checked={isChecked}
        onChange={onCheck}
        className="w-5 h-5 text-mint rounded border-gray-300 focus:ring-mint cursor-pointer"
      />
      <div className="ml-3 flex-1">
        <p
          className={`text-sm font-bold mb-0.5 ${
            isChecked ? "text-gray-400 line-through" : "text-dark-gray"
          }`}
        >
          {name}
        </p>
        <p
          className={`text-xs ${
            isChecked ? "text-gray-400 line-through" : "text-gray-500"
          }`}
        >
          {time}
        </p>
      </div>
      {isChecked && (
        <HiOutlineCheckCircle className="text-mint text-xl animate-bounce-short" />
      )}
    </label>
  );
}
