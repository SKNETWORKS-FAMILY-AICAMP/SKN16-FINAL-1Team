// src/pages/Settings/SettingsPage.tsx

import React, { useState } from 'react';
import ProfileEditModal from '../../components/domain/Settings/ProfileEditModal';
import { HiOutlineChevronRight, HiOutlineQuestionMarkCircle, HiOutlineShieldCheck, HiOutlineDocumentText, HiOutlineLogout, HiOutlineUserRemove} from 'react-icons/hi';
import useUserStore from '../../store/useUserStore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function SettingsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { userName, userPassword, userAvatar, logout } = useUserStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.info('로그아웃 되었습니다.');
    navigate('/', {replace: true });
  };

  const handleDeleteAccount = () => {
    toast.success('계정이 삭제되었습니다.');
    logout();
    navigate('/', { replace: true });
  };

  return (
    <>
      <div className="flex flex-col p-4 pb-16 space-y-4">
        {/* 상단 서브헤더 */}
        <header className="w-full bg-mint/10 p-4 shadow-sm rounded-lg">
          <h2 className="text-xl font-bold text-dark-gray">설정</h2>
        </header>

        {/* 2단 레이아웃 */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* 왼쪽: 프로필 수정 카드 */}
          <div className="md:col-span-1">
            <div className="w-full bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="w-24 h-24 bg-mint rounded-full flex items-center justify-center text-white font-bold text-4xl mb-4 mx-auto">
                {userAvatar || '?'}
              </div>
              <h3 className="text-xl font-bold text-dark-gray">{userName || '홍길동님'}</h3>
              <p className="text-sm text-gray-500 mb-6 break-all">{userPassword || '로그아웃'}</p>
              
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-dark-gray font-semibold py-2 px-4 rounded-lg"
              >
                수정
              </button>
            </div>
          </div>

          {/* 오른쪽: 리스트메뉴 */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <ListItem icon={<HiOutlineQuestionMarkCircle />} title="도움말 & 지원" />
              <ListItem icon={<HiOutlineShieldCheck />} title="개인정보 처리방침" />
              <ListItem icon={<HiOutlineDocumentText />} title="서비스 이용약관" />
            </div>
            
            {/* 하단 */}
            <div className="space-y-3 pt-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 p-4 bg-white rounded-lg shadow-lg text-dark-gray hover:bg-gray-50 font-semibold"
              >
                <HiOutlineLogout className="text-xl" />
                로그아웃
              </button>

              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="w-full flex items-center gap-3 p-4 bg-white rounded-lg shadow-lg text-red-500 hover:bg-red-50 font-semibold"
              >
                <HiOutlineUserRemove className="text-xl" />
                탈퇴하기
              </button>
            </div>
            <p className="text-center text-gray-400 text-xs mt-4">
              메디노트 버전 1.0.0
            </p>
          </div>
        </section>
      </div>

      {/* 프로필 수정 모달 */}
      {isModalOpen && <ProfileEditModal onClose={() => setIsModalOpen(false)} />}

      {/* 회원탈퇴 모달 */}
      {isDeleteModalOpen && (
        <DeleteAccountModal
          userName={userName || '사용자'}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteAccount}
        />
      )}
    </>
  );
}


// --- 서브 컴포넌트: ListItem ---
type ItemProps = {
  icon: React.ReactNode;
  title: string;
  description?: string;
};

function ListItem({ icon, title, description }: ItemProps) {
  return (
    <button className="w-full flex items-center justify-between p-4 border-t border-gray-100 hover:bg-gray-50">
      <div className="flex items-center gap-4">
        <div className="text-mint text-2xl">{icon}</div>
        <div>
          <h5 className="text-md font-semibold text-dark-gray text-left">{title}</h5>
          {description && (
            <p className="text-sm text-gray-500 text-left">{description}</p>
          )}
        </div>
      </div>
      <HiOutlineChevronRight className="text-gray-400" />
    </button>
  );
}

// --- 탈퇴 유의사항 모달 ---
function DeleteAccountModal({
  userName,
  onClose,
  onConfirm,
}: {
  userName: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative animate-fadeIn">
        <h2 className="text-xl font-bold text-dark-gray text-center whitespace-pre-line mb-4">
          {userName}님,{'\n'}탈퇴하기 전에 확인해주세요.
        </h2>

        <div className="text-sm text-gray-600 space-y-2 mb-6">
          <p>• 회원 탈퇴 시, 계정 정보는 물론 사용자가 기록한 모든 건강 데이터가 즉시 영구적으로 삭제됩니다.</p>
          <p>• 삭제된 데이터는 서버에서도 완전히 파기되므로, 어떠한 방법으로도 복구할 수 없습니다.  실수로 탈퇴한 경우에도 저희 '메디노트' 팀은 데이터를 복원해 드릴 수 없습니다.</p>
          <p>• 탈퇴 후 동일 이메일로 재가입은 가능하나, 기존 데이터는 복원되지 않습니다.</p>
          <p>• 탈퇴를 진행하기 전에, 보관이 필요한 건강 기록이 있다면 반드시 설정의 데이터 내보내기 기능을 이용해 사용자의 기기에 직접 백업하십시오.</p>
          <p>• 메디노트는 개인정보 보호법에 따라 이용 기록을 일정 기간 보관할 수 있습니다.</p>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="w-4 h-4 accent-red-500"
          />
          <span>유의사항을 모두 확인했으며, 회원탈퇴 시 모든 데이터가 삭제됩니다.</span>
        </label>

        <div className="flex flex-col gap-3">
          <button
            disabled={!checked}
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`w-full py-3 rounded-lg font-bold text-white transition-colors ${
              checked ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            계정 삭제하기
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 rounded-lg text-gray-500 hover:text-dark-gray font-semibold"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}