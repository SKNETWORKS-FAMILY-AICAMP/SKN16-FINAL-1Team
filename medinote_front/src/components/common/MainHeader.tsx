import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineMenu, HiOutlineBell, HiOutlineQuestionMarkCircle, HiOutlineCog } from 'react-icons/hi';
import { FaHeart } from 'react-icons/fa';
import ProfileDropdown from './ProfileDropdown';
import useUserStore from '../../store/useUserStore';
import NotificationDropdown from './NotificationDropdown';

export interface Notification {
  id: string;
  title: string;
  content: string;
  time: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    title: "피드백 답변 완료",
    content: "안녕하세요, 홍길동님.\n요청하신 '다크 모드 제안' 피드백에 대한 답변이 완료되었습니다.\n소중한 의견 감사합니다!",
    time: "10분 전",
    read: false,
  }
];

type HeaderProps = {
  onMenuClick: () => void;
};

export default function MainHeader({ onMenuClick }: HeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const userAvatar = useUserStore((s) => s.userAvatar);

  // 알림 드롭다운 상태
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  // 알림 데이터 상태
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  
  // 읽지 않은 알림이 있는지 확인
  const hasUnread = notifications.some(n => !n.read);

  const toggleProfile = () => {
    setIsNotificationOpen(false);
    setIsProfileOpen(prev => !prev);
  };
  
  const toggleNotification = () => {
    setIsProfileOpen(false);
    setIsNotificationOpen(prev => !prev);
  };

  // '읽음' 처리
  const handleMarkAsRead = (item: Notification) => {
    if (item.read) return;
    setNotifications(prev => 
      prev.map(n => n.id === item.id ? { ...n, read: true } : n)
    );
  };

  // 알림 삭제
  const handleItemDelete = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };
  
  // 모두 읽음
  const handleReadAll = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <>
      <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-16 bg-white shadow-md z-50 flex items-center justify-between px-4">
        {/* Left: Menu + Logo */}
        <div className="flex items-center gap-2">
          <button onClick={onMenuClick} className="text-dark-gray text-2xl" aria-label="Open menu">
            <HiOutlineMenu />
          </button>
          <Link to="/dashboard" className="flex items-center gap-1 text-mint" aria-label="Go to dashboard">
            <FaHeart />
            <span className="font-bold text-lg">메디노트</span>
          </Link>
        </div>

        {/* Right: Icons + Profile */}
        <div className="flex items-center gap-3 relative">
          
          {/* 알림 버튼 */}
          <button 
            onClick={toggleNotification}
            className="text-dark-gray text-2xl relative"
            aria-label="Notifications"
          >
            <HiOutlineBell />
            {hasUnread && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
            )}
          </button>
          
          <button className="text-dark-gray text-2xl" aria-label="Help">
            <HiOutlineQuestionMarkCircle />
          </button>
          <Link to="/settings" className="text-dark-gray text-2xl" aria-label="Settings">
            <HiOutlineCog />
          </Link>

          {/* Profile button */}
          <button
            onClick={toggleProfile}
            className="w-8 h-8 bg-mint rounded-full flex items-center justify-center text-white font-bold"
          >
            {userAvatar || '?'}
          </button>

          {/* 알림 드롭다운 */}
          {isNotificationOpen && (
            <NotificationDropdown 
              notifications={notifications}
              onClose={() => setIsNotificationOpen(false)}
              onMarkAsRead={handleMarkAsRead}
              onItemDelete={handleItemDelete}
              onReadAll={handleReadAll}
            />
          )}

          {isProfileOpen && <ProfileDropdown />}
        </div>
      </header>
    </>
  );
}