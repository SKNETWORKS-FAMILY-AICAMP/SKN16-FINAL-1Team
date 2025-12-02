// src/components/common/ProfileDropdown.tsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useUserStore from '../../store/useUserStore';
import { HiOutlineUser, HiOutlineCog, HiOutlineMoon, HiOutlineLogout } from 'react-icons/hi';

type Theme = 'light' | 'dark';

export default function ProfileDropdown() {
  const navigate = useNavigate();
  const userName = useUserStore((s) => s.userName);
  const userEmail = useUserStore((s) => s.userEmail);
  const logout = useUserStore((s) => s.logout);

  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const stored = (localStorage.getItem('theme') as Theme) || 'light';
    applyTheme(stored);
  }, []);

  const applyTheme = (t: Theme) => {
    setTheme(t);
    localStorage.setItem('theme', t);
    const root = document.documentElement;
    if (t === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  };

  const toggleTheme = () => applyTheme(theme === 'light' ? 'dark' : 'light');
  const goSettings = () => navigate('/settings');
  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="absolute top-12 right-0 w-60 bg-white dark:bg-gray-800 rounded-md shadow-popup z-50 border border-gray-100 dark:border-gray-700">
      <div className="p-4 border-b dark:border-gray-700">
        <p className="font-bold text-dark-gray dark:text-white">{userName || '사용자'}</p>
        <p className="text-sm text-gray-500 dark:text-gray-300">{userEmail || '로그인 필요'}</p>
      </div>

      <ul className="py-2">
        <MenuItem icon={<HiOutlineUser />} text="프로필" onClick={goSettings} />
        <MenuItem icon={<HiOutlineCog />} text="설정" onClick={goSettings} />
        <MenuItem icon={<HiOutlineMoon />} text={`테마: ${theme === 'light' ? '라이트' : '다크'}`} onClick={toggleTheme} />
      </ul>

      <div className="p-2 border-t dark:border-gray-700">
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-red-500 hover:bg-red-50 rounded-md">
          <HiOutlineLogout className="text-xl" />
          <span className="font-semibold">로그아웃</span>
        </button>
      </div>
    </div>
  );
}

type ItemProps = { icon: React.ReactNode; text: string; onClick: () => void };
function MenuItem({ icon, text, onClick }: ItemProps) {
  return (
    <li className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-dark-gray dark:text-white" onClick={onClick} role="menuitem">
      <span className="text-xl text-gray-500 dark:text-gray-300">{icon}</span>
      <span>{text}</span>
    </li>
  );
}

