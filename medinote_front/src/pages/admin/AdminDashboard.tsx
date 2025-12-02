// src/pages/admin/AdminDashboard.tsx

import React from 'react';
import { 
  HiOutlineUsers, HiOutlineChatAlt2, HiOutlineExclamationCircle, 
  HiOutlineDocumentText, HiOutlineArrowRight, HiOutlineBell
} from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import useAdminStore, { type FeedbackType } from '../../store/useAdminStore';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const feedbacks = useAdminStore((state) => state.feedbacks);

  const pendingFeedbacks = feedbacks
    .filter(f => f.status === 'new')
    .slice(0, 5);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-dark-gray">관리자 대시보드</h1>
        <span className="text-sm text-gray-500">최근 업데이트: 방금 전</span>
      </div>

      {/* 1. 핵심 지표 카드 (Top Cards) */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          title="실시간 접속자" 
          value="42명" 
          desc="전일 대비 +12%"
          icon={<HiOutlineUsers />} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="오늘의 AI 대화" 
          value="156건" 
          desc="토큰 사용량 양호"
          icon={<HiOutlineChatAlt2 />} 
          color="bg-purple-500" 
        />
        <StatCard 
          title="미처리 피드백" 
          value={`${pendingFeedbacks.length}건`}
          icon={<HiOutlineExclamationCircle />} 
          color="bg-red-500" 
          alert={pendingFeedbacks.length > 0}
        />
        <StatCard 
          title="오늘 신규 진료기록" 
          value="+84"
          icon={<HiOutlineDocumentText />} 
          color="bg-mint" 
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 2. 주간 활성 사용자 추이 (Main Chart - Mockup) */}
        <section className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h3 className="text-lg font-bold text-dark-gray">주간 활성 사용자 (WAU)</h3>
              <p className="text-sm text-gray-500">지난 7일간의 앱 이용자 추이입니다.</p>
            </div>
            <div className="flex gap-4 text-sm">
              <span className="flex items-center gap-1"><div className="w-3 h-3 bg-mint rounded-full"></div>활성 유저</span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 bg-gray-300 rounded-full"></div>신규 가입</span>
            </div>
          </div>
          
          {/* CSS만으로 만든 막대 그래프 모의 UI */}
          <div className="h-64 flex items-end justify-between gap-4 px-2">
            <BarGraph label="월" height="h-32" height2="h-10" />
            <BarGraph label="화" height="h-40" height2="h-12" />
            <BarGraph label="수" height="h-36" height2="h-8" />
            <BarGraph label="목" height="h-48" height2="h-14" />
            <BarGraph label="금" height="h-56" height2="h-20" />
            <BarGraph label="토" height="h-64" height2="h-24" isPeak />
            <BarGraph label="일" height="h-60" height2="h-16" />
          </div>
        </section>

        {/* 3. 운영 알림 / 긴급 이슈 (Action Items) */}
        <section className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-dark-gray flex items-center gap-2">
              <HiOutlineBell className="text-red-500" /> 
              미처리 피드백 ({pendingFeedbacks.length})
            </h3>
            <button 
              className="text-xs text-gray-500 hover:underline"
              onClick={() => navigate('/admin/feedbacks')}
            >
              전체보기
            </button>
          </div>
          
          <div className="space-y-3">
            {pendingFeedbacks.length > 0 ? (
              pendingFeedbacks.map((item) => (
                <ActionItem 
                  key={item.id}
                  type={item.type}
                  text={item.title} // 제목 표시
                  time={item.date}
                  onClick={() => navigate('/admin/feedbacks')} // 클릭 시 관리 페이지로 이동
                />
              ))
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">처리할 피드백이 없습니다. 🎉</p>
            )}
          </div>
          
          <button
            className="w-full mt-4 py-2 text-sm text-center text-mint border border-mint rounded-lg hover:bg-mint/5"
            onClick={() => navigate('/admin/feedbacks')}
          >
            이슈 처리하러 가기
          </button>
        </section>
      </div>

      {/* 4. 데이터 통계 (Data Ranking) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 많이 등록된 질환 TOP 5 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold text-dark-gray mb-4">많이 등록된 질환 TOP 5</h3>
          <div className="space-y-4">
            <ProgressBar label="1. 고혈압" percent={35} color="bg-red-400" />
            <ProgressBar label="2. 당뇨병 (2형)" percent={28} color="bg-orange-400" />
            <ProgressBar label="3. 고지혈증" percent={20} color="bg-yellow-400" />
            <ProgressBar label="4. 역류성 식도염" percent={12} color="bg-green-400" />
            <ProgressBar label="5. 비염" percent={5} color="bg-blue-400" />
          </div>
        </div>

        {/* 많이 등록된 약물 TOP 5 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold text-dark-gray mb-4">많이 등록된 약물 TOP 5</h3>
          <div className="space-y-4">
            <ProgressBar label="1. 타이레놀" percent={42} color="bg-mint" />
            <ProgressBar label="2. 아모디핀" percent={30} color="bg-mint" />
            <ProgressBar label="3. 메트포민" percent={18} color="bg-mint" />
            <ProgressBar label="4. 유산균" percent={8} color="bg-mint" />
            <ProgressBar label="5. 오메가3" percent={2} color="bg-mint" />
          </div>
        </div>
      </section>
    </div>
  );
}

// --- 서브 컴포넌트들 ---

// 1. 통계 카드
function StatCard({ title, value, desc, icon, color, alert = false }: any) {
  return (
    <div className={`bg-white p-6 rounded-lg shadow flex items-start justify-between ${alert ? 'border-l-4 border-red-500' : ''}`}>
      <div>
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <h2 className="text-3xl font-bold text-dark-gray">{value}</h2>
        <p className={`text-xs mt-2 ${alert ? 'text-red-500 font-bold' : 'text-gray-400'}`}>{desc}</p>
      </div>
      <div className={`p-3 rounded-full text-white text-xl ${color}`}> {icon} </div>
    </div>
  );
}

function ActionItem({ type, text, time, onClick }: { type: FeedbackType, text: string, time: string, onClick: () => void }) {
  // 유형별 스타일 매핑
  const config: Record<FeedbackType, { bg: string, text: string, label: string }> = {
    bug: { bg: 'bg-red-100', text: 'text-red-600', label: '버그' },
    suggestion: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '제안' },
    inquiry: { bg: 'bg-blue-100', text: 'text-blue-600', label: '문의' },
    other: { bg: 'bg-gray-100', text: 'text-gray-600', label: '기타' },
  };
  const style = config[type];

  return (
    <div 
      onClick={onClick}
      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
    >
      <div className="flex items-center gap-3">
        <span className={`px-2 py-1 rounded text-xs font-bold ${style.bg} ${style.text}`}>
          {style.label}
        </span>
        <span className="text-sm text-dark-gray font-medium truncate max-w-[180px]">
          {text}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span>{time}</span>
        <HiOutlineArrowRight />
      </div>
    </div>
  );
}

// 막대 그래프 (CSS Mockup)
function BarGraph({ label, height, height2, isPeak }: any) {
  return (
    <div className="flex flex-col items-center justify-end h-full w-full gap-1 group">
      {/* 툴팁 (호버 시 표시) */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-1 text-xs bg-dark-gray text-white px-2 py-1 rounded">
        {label}
      </div>
      {/* 막대 1 (활성 유저) */}
      <div className={`w-full max-w-[30px] rounded-t-sm transition-all hover:brightness-90 ${height} ${isPeak ? 'bg-mint' : 'bg-mint/60'}`}></div>
      {/* 막대 2 (신규 유저) */}
      <div className={`w-full max-w-[30px] rounded-t-sm bg-gray-200 ${height2}`}></div>
      <span className="text-xs text-gray-500 mt-2">{label}</span>
    </div>
  );
}

// 가로 막대 그래프 (Progress Bar)
function ProgressBar({ label, percent, color }: any) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="font-bold text-gray-500">{percent}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5">
        <div 
          className={`h-2.5 rounded-full ${color}`} 
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    </div>
  );
}