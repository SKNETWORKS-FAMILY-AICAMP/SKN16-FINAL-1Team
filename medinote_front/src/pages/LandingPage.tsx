// src/pages/LandingPage.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { FaHeart } from 'react-icons/fa';
import { HiOutlineShieldCheck, HiOutlineSparkles } from 'react-icons/hi';

export default function LandingPage() {
  return (
    <div className="relative w-full min-h-screen text-dark-gray">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/landing-bg.jpg')" }}
      />
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-white/75 backdrop-blur-sm" />

      {/* Header (landing only) */}
      <header className="absolute top-0 left-0 w-full p-6 z-10">
        <div className="flex items-center gap-2">
          <FaHeart className="text-mint text-2xl" aria-hidden />
          <span className="text-xl font-bold text-dark-gray">메디노트</span>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center text-center p-6">
        <h1 className="text-4xl md:text-5xl font-extrabold text-dark-gray mb-6 leading-tight">
          <span className="text-mint">나의 건강</span>을
          <br />
          <span className="text-mint">한 눈</span>에
        </h1>
        <p className="text-lg text-gray-700 mb-10 max-w-lg mx-auto">
          나의 건강을 기록하고 
          한 눈에 관리하세요
        </p>

        {/* Buttons */}
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/login"
            className="px-4 py-2 text-sm rounded-lg bg-mint text-white hover:bg-mint/90"
          >
            로그인
          </Link>
          <Link
            to="/signup"
            className="px-4 py-2 text-sm rounded-lg border border-mint text-mint hover:bg-mint/10"
          >
            회원가입
          </Link>
        </div>
      </main>

      {/* Footer highlights */}
      <footer className="absolute bottom-0 left-0 w-full p-6 z-10">
        <div className="flex justify-center items-center gap-8">
          <FooterItem icon={<HiOutlineShieldCheck />} text="개인정보보호" />
          <FooterItem icon={<HiOutlineSparkles />} text="건강관리" />
        </div>
      </footer>
    </div>
  );
}

type ItemProps = { icon: React.ReactNode; text: string };
function FooterItem({ icon, text }: ItemProps) {
  return (
    <div className="flex items-center gap-2 text-gray-600">
      <span className="text-xl">{icon}</span>
      <span className="text-sm font-semibold">{text}</span>
    </div>
  );
}
