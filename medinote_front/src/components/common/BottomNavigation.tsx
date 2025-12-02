import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HiHome, HiOutlineHome,
  HiUser, HiOutlineUser,
  HiClipboardList, HiOutlineClipboardList,
  HiChatAlt2, HiOutlineChatAlt2
} from 'react-icons/hi';

export default function BottomNavigation() {
  const location = useLocation();
  const currentPath = location.pathname;

  if (currentPath === '/') return null;

  const tabs = [
    { 
      path: '/dashboard', 
      label: '홈', 
      activeIcon: <HiHome className="text-2xl" />, 
      inactiveIcon: <HiOutlineHome className="text-2xl" /> 
    },
    { 
      path: '/health-info', 
      label: '건강정보', 
      activeIcon: <HiUser className="text-2xl" />, 
      inactiveIcon: <HiOutlineUser className="text-2xl" /> 
    },
    { 
      path: '/history', 
      label: '진료기록', 
      activeIcon: <HiClipboardList className="text-2xl" />, 
      inactiveIcon: <HiOutlineClipboardList className="text-2xl" /> 
    },
    { 
      path: '/chatbot', 
      label: '챗봇', 
      activeIcon: <HiChatAlt2 className="text-2xl" />, 
      inactiveIcon: <HiOutlineChatAlt2 className="text-2xl" /> 
    },
  ];

  return (
    // [수정 포인트] left-0 right-0을 제거하고, max-w-lg와 중앙 정렬(left-1/2 -translate-x-1/2) 추가
    <nav className="fixed bottom-0 w-full max-w-lg left-1/2 -translate-x-1/2 bg-white border-t border-gray-200 h-[60px] flex justify-around items-center z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.03)] pb-safe">
      {tabs.map((tab) => {
        const isActive = currentPath.startsWith(tab.path);

        return (
          <Link 
            key={tab.path} 
            to={tab.path} 
            className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${
              isActive ? 'text-mint' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <div className="mb-0.5">
              {isActive ? tab.activeIcon : tab.inactiveIcon}
            </div>
            <span className="text-[10px] font-medium">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}