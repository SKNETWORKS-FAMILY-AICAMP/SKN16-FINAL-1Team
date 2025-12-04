// src/components/admin/AdminLayout.tsx

import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { HiOutlineLogout, HiOutlineUsers, HiOutlineChartBar, HiOutlineCog, HiOutlineMicrophone, HiOutlineInbox, HiOutlineCamera } from 'react-icons/hi';
import { FaHeart } from 'react-icons/fa';
import useUserStore from '../../store/useUserStore';

export default function AdminLayout() {
  const logout = useUserStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex w-full min-h-screen bg-gray-100">
      
      {/* 1. 관리자 사이드바 */}
      <aside className="w-64 bg-dark-gray text-white flex flex-col shadow-xl z-10">
        <div className="p-6 text-xl font-bold border-b border-gray-700 flex items-center gap-2">
          <FaHeart className="text-mint text-2xl" aria-hidden />
          <span>메디노트 Admin</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/admin" className="flex items-center gap-3 p-3 hover:bg-gray-700 rounded-lg transition-colors">
            <HiOutlineChartBar className="text-xl" /> 
            <span>대시보드</span>
          </Link>
          <Link to="/admin/users" className="flex items-center gap-3 p-3 hover:bg-gray-700 rounded-lg transition-colors">
            <HiOutlineUsers className="text-xl" /> 
            <span>회원 관리</span>
          </Link>
          <Link to="/admin/voice-logs" className="flex items-center gap-3 p-3 hover:bg-gray-700 rounded-lg transition-colors">
            <HiOutlineMicrophone className="text-xl" /> 
            <span>STT 관리</span>
          </Link>
          <Link to="/admin/ocr-logs" className="flex items-center gap-3 p-3 hover:bg-gray-700 rounded-lg transition-colors">
            <HiOutlineCamera className="text-xl" /> 
            <span>OCR 관리</span>
          </Link>
          <Link to="/admin/feedbacks" className="flex items-center gap-3 p-3 hover:bg-gray-700 rounded-lg transition-colors">
            <HiOutlineInbox className="text-xl" /> 
            <span>피드백 관리</span>
          </Link>
          <Link to="/admin/settings" className="flex items-center gap-3 p-3 hover:bg-gray-700 rounded-lg transition-colors">
            <HiOutlineCog className="text-xl" /> 
            <span>시스템 설정</span>
          </Link>
        </nav>

        <button 
          onClick={handleLogout}
          className="p-4 flex items-center gap-2 hover:bg-red-600 transition-colors border-t border-gray-700"
        >
          <HiOutlineLogout /> 로그아웃
        </button>
      </aside>

      {/* 2. 메인 콘텐츠 영역 (오른쪽) */}
      <main className="flex-1 p-8 overflow-auto">
        {/* 실제 페이지 내용은 여기에 표시됨 */}
        <div className="w-full max-w-7xl mx-auto">
          <Outlet /> 
        </div>
      </main>
    </div>
  );
}