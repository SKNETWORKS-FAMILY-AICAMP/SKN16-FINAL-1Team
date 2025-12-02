// src/pages/HealthInfo/HealthInfoPage.tsx

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import BasicInfoTab from '../../components/domain/HealthInfo/BasicInfoTab';
import DiseaseInfoTab from '../../components/domain/HealthInfo/DiseaseInfoTab';
import MedInfoTab from '../../components/domain/HealthInfo/MedInfoTab';
import AllergyInfoTab from '../../components/domain/HealthInfo/AllergyInfoTab';

type ActiveTab = 'basic' | 'disease' | 'med' | 'allergy';

export default function HealthInfoPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('basic');
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'basic' || t === 'disease' || t === 'med' || t === 'allergy') {
      setActiveTab(t as ActiveTab);
    }
  }, [searchParams]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return <BasicInfoTab />;
      case 'disease':
        return <DiseaseInfoTab />;
      case 'med':
        return <MedInfoTab />;
      case 'allergy':
        return <AllergyInfoTab />;
      default:
        return <BasicInfoTab />;
    }
  };

  return (
    <div className="flex flex-col">
      {/* Subheader */}
      <header className="w-full bg-mint/10 p-4 shadow-sm">
        <h2 className="text-xl font-bold text-dark-gray">건강정보</h2>
      </header>

      {/* Tab navigation */}
      <nav className="flex justify-around bg-white shadow-md">
        <TabButton
          title="기본정보"
          isActive={activeTab === 'basic'}
          onClick={() => setActiveTab('basic')}
        />
        <TabButton
          title="질환정보"
          isActive={activeTab === 'disease'}
          onClick={() => setActiveTab('disease')}
        />
        <TabButton
          title="약 정보"
          isActive={activeTab === 'med'}
          onClick={() => setActiveTab('med')}
        />
        <TabButton
          title="알러지"
          isActive={activeTab === 'allergy'}
          onClick={() => setActiveTab('allergy')}
        />
      </nav>

      {/* 선택된 탭 콘텐츠 렌더링 */}
      <div className="p-4 bg-gray-50 min-h-[calc(100vh-200px)]">
        {renderTabContent()}
      </div>
    </div>
  );
}


// --- 서브 컴포넌트: TabButton ---
type TabButtonProps = {
  title: string;
  isActive: boolean;
  onClick: () => void;
};

function TabButton({ title, isActive, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 text-center font-bold relative transition-colors ${
        isActive 
          ? 'text-mint' 
          : 'text-gray-400 hover:text-dark-gray'
      }`}
    >
      {title}
      {/* 활성화 시 민트색 밑줄 표시 */}
      {isActive && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-mint"></div>
      )}
    </button>
  );
}
