// src/components/common/Sidebar.tsx

import { useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import {
  HiOutlineHome,
  HiOutlineClipboardList,
  HiOutlineChartBar,
  HiOutlineCalendar,
  HiOutlineChatAlt2,
  HiOutlineX,
  HiOutlineChevronRight,
  HiOutlineChevronDown,
} from 'react-icons/hi';
import { FaUserMd } from 'react-icons/fa';
import useUserStore from '../../store/useUserStore';

type SidebarProps = { isOpen: boolean; onClose: () => void; onFeedbackClick: () => void; };

export default function Sidebar({ isOpen, onClose, onFeedbackClick }: SidebarProps) {
  const userName = useUserStore((s) => s.userName);
  const userAvatar = useUserStore((s) => s.userAvatar);
  const [isHealthOpen, setIsHealthOpen] = useState(false);

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/30 z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed top-0 left-0 w-64 h-full bg-white shadow-lg z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-mint rounded-full flex items-center justify-center text-white font-bold">
              {userAvatar || '?'}
            </div>
            <div>
              <p className="font-bold">{userName || '사용자'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 text-2xl">
            <HiOutlineX />
          </button>
        </div>

        <nav className="flex flex-col justify-between h-[calc(100vh-140px)] p-4">
          <ul className="flex flex-col gap-1">
            <SidebarLink to="/dashboard" icon={<HiOutlineHome />} text="홈" onNavigate={onClose} />
            <li>
              <button
                type="button"
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100"
                onClick={() => setIsHealthOpen((v) => !v)}
                aria-expanded={isHealthOpen}
                aria-controls="health-info-submenu"
              >
                <span className="text-2xl">
                  <FaUserMd />
                </span>
                <span className="flex-1 text-left">건강정보</span>
                <span className="text-xl text-gray-500">
                  {isHealthOpen ? <HiOutlineChevronDown /> : <HiOutlineChevronRight />}
                </span>
              </button>
              {isHealthOpen ? (
                <div id="health-info-submenu" className="ml-9 mt-1 flex flex-col gap-1">
                  <SidebarLink to="/health-info?tab=basic" text="기본정보" onNavigate={onClose} indent />
                  <SidebarLink to="/health-info?tab=disease" text="질환정보" onNavigate={onClose} indent />
                  <SidebarLink to="/health-info?tab=med" text="약 정보" onNavigate={onClose} indent />
                  <SidebarLink to="/health-info?tab=allergy" text="알러지" onNavigate={onClose} indent />
                </div>
              ) : null}
            </li>
            <SidebarLink to="/history" icon={<HiOutlineClipboardList />} text="진료기록" onNavigate={onClose} />
            <SidebarLink to="/analysis" icon={<HiOutlineChartBar />} text="건강분석" onNavigate={onClose} />
            <SidebarLink to="/schedule" icon={<HiOutlineCalendar />} text="일정관리" onNavigate={onClose} />
            <SidebarLink to="/chatbot" icon={<HiOutlineChatAlt2 />} text="AI 챗봇" onNavigate={onClose} />
          </ul>
          <button 
            onClick={onFeedbackClick}
            className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            피드백 제공
          </button>
        </nav>
      </aside>
    </>
  );
}

type ItemProps = {
  to: string;
  text: string;
  onNavigate: () => void;
  icon?: ReactNode;
  indent?: boolean;
};

function SidebarLink({ to, text, icon, onNavigate, indent = false }: ItemProps) {
  return (
    <li>
      <NavLink
        to={to}
        onClick={onNavigate}
        className={({ isActive }) =>
          `${indent ? 'pl-2' : ''} flex items-center gap-3 p-3 rounded-lg ` +
          (isActive ? 'bg-mint/10 text-mint font-bold' : 'hover:bg-gray-100')
        }
        end
      >
        {icon ? <span className="text-2xl">{icon}</span> : null}
        <span>{text}</span>
      </NavLink>
    </li>
  );
}

