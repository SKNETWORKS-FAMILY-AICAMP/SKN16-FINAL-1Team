// src/components/common/AppLayout.tsx

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import MainHeader from './MainHeader';
import Sidebar from './Sidebar';
import FeedbackModal from './FeedbackModal';
import BottomNavigation from './BottomNavigation';

export default function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const openFeedbackModal = () => {
    setIsFeedbackModalOpen(true);
    setIsSidebarOpen(false);
  };
  const closeFeedbackModal = () => {
    setIsFeedbackModalOpen(false);
  };

  return (
    <div className="w-full h-screen bg-gray-100 flex justify-center">
      <div className="relative w-full max-w-lg h-screen bg-[#F8FBFB] shadow-md flex flex-col">
        {/* Mainheader */}
        <MainHeader onMenuClick={toggleSidebar} />
        {/* Sidebar */}
        <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} onFeedbackClick={openFeedbackModal} />
        {/* 실제 페이지 내용이 표시될 영역 */}
        <main className="flex-1 pt-16 pb-[60px] overflow-y-auto">
          <Outlet />
        </main>
        <BottomNavigation />
        {isFeedbackModalOpen && <FeedbackModal onClose={closeFeedbackModal} />}
      </div>
    </div>
  );
}
