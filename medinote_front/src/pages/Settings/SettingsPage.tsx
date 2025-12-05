// src/pages/Settings/SettingsPage.tsx

import React, { useState } from 'react';
import ProfileEditModal from '../../components/domain/Settings/ProfileEditModal';
import { HiOutlineChevronRight, HiOutlineQuestionMarkCircle, HiOutlineShieldCheck, HiOutlineDocumentText, HiOutlineLogout, HiOutlineUserRemove} from 'react-icons/hi';
import useUserStore from '../../store/useUserStore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

type InfoModalType = 'help' | 'privacy' | 'terms' | null;

export default function SettingsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [infoModalType, setInfoModalType] = useState<InfoModalType>(null);
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

        {/* 세로 레이아웃 */}
        <section className="flex flex-col gap-6">

          {/* 프로필 수정 카드 */}
          <div>
            <div className="w-full bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="w-24 h-24 bg-mint rounded-full flex items-center justify-center text-white font-bold text-4xl mb-4 mx-auto">
                {userAvatar || '?'}
              </div>
              <h3 className="text-xl font-bold text-dark-gray mb-6">{userName || '홍길동님'}</h3>
              
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-dark-gray font-semibold py-2 px-4 rounded-lg"
              >
                수정
              </button>
            </div>
          </div>

          {/* 리스트메뉴 */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <ListItem icon={<HiOutlineQuestionMarkCircle />} title="도움말 & 지원" onClick={() => setInfoModalType('help')} />
              <ListItem icon={<HiOutlineShieldCheck />} title="개인정보 처리방침" onClick={() => setInfoModalType('privacy')} />
              <ListItem icon={<HiOutlineDocumentText />} title="서비스 이용약관" onClick={() => setInfoModalType('terms')} />
            </div>
            
            {/* 하단 */}
            <div className="space-y-3 pt-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 p-4 bg-white rounded-lg shadow-lg text-dark-gray hover:bg-gray-100 font-semibold"
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

      {/* 정보 모달 */}
      {infoModalType && (
        <InfoModal
          type={infoModalType}
          onClose={() => setInfoModalType(null)}
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
  onClick?: () => void;
};

function ListItem({ icon, title, description, onClick }: ItemProps) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between p-4 border-t border-gray-100 hover:bg-gray-100">
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

// --- 정보 모달 (도움말, 개인정보, 이용약관) ---
const INFO_CONTENT: Record<'help' | 'privacy' | 'terms', { title: string; content: string }> = {
  help: {
    title: '도움말 & 지원',
    content: `메디노트 서비스 이용 안내

■ 주요 기능
• 건강 프로필: 기본 건강 정보, 질환, 복용 약물, 알러지 정보를 등록하고 관리할 수 있습니다.
• 진료 기록: 병원 방문 기록과 처방 내역을 저장하고 확인할 수 있습니다.
• AI 건강 상담: 건강 관련 질문에 AI가 답변을 제공합니다.
• 데이터 내보내기: PDF 형식으로 건강 기록을 내보낼 수 있습니다.

■ 문의 및 지원
서비스 이용 중 문의사항이 있으시면 앱 내 피드백 기능을 이용해 주시기 바랍니다.

■ 중요 안내
본 서비스에서 제공하는 AI 기반 답변은 사용자의 편의를 위한 참고 자료입니다. 건강상 이상이 의심되는 경우, 반드시 전문 의료기관을 방문하여 의료 전문가와 상담하시기 바랍니다.`,
  },
  privacy: {
    title: '개인정보 처리방침',
    content: `메디노트 개인정보 처리방침

■ 제1조 (수집하는 개인정보)
회사는 서비스 제공을 위해 다음의 개인정보를 수집합니다.
• 필수 항목: 이메일, 이름, 비밀번호
• 민감정보: 질병 정보, 복용 약 정보, 알러지 정보, 진료 기록 등 「개인정보 보호법」상 민감정보에 해당하는 항목

■ 제2조 (개인정보의 수집 및 이용 목적)
• 회원 가입 및 관리
• 건강 정보 관리 및 맞춤형 서비스 제공
• AI 기반 건강 상담 서비스 제공

■ 제3조 (개인정보의 보유 및 이용 기간)
• 회원 탈퇴 시 즉시 파기
• 단, 관계 법령에 따라 보존할 필요가 있는 경우 해당 법령에서 정한 기간 동안 보관

■ 제4조 (개인정보의 제3자 제공)
회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 법령의 규정에 의거하거나 이용자의 동의가 있는 경우에는 예외로 합니다.

■ 제5조 (개인정보의 파기)
회사는 개인정보 보유 기간의 경과, 처리 목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.`,
  },
  terms: {
    title: '서비스 이용약관',
    content: `메디노트 서비스 이용약관

■ 제1조 (목적)
본 약관은 메디노트 서비스의 이용 조건 및 절차, 회사와 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.

■ 제2조 (서비스의 내용)
회사는 건강 정보 관리 및 AI 기반 건강 상담 서비스를 제공합니다.

■ 제3조 (의료 면책 조항)
① 본 서비스에서 제공하는 AI 기반 답변, 건강 분석 리포트 및 기타 정보는 사용자의 편의를 위한 참고 자료일 뿐이며, 의사·약사 등 전문 의료인의 진단, 처방, 또는 의학적 조언을 대체하지 않습니다.
② 건강상 이상 또는 질환이 의심되는 경우, 반드시 전문 의료기관을 방문하여 의료 전문가와 상담하시기 바랍니다.
③ 본 서비스는 의료행위를 제공하지 않으며, 사용자가 AI 답변을 신뢰함으로써 발생하는 어떠한 결과에 대해서도 법적 책임을 부담하지 않습니다.

■ 제4조 (데이터의 정확성 및 책임)
① 본 서비스에 입력되는 건강정보는 사용자가 직접 입력한 내용을 기반으로 합니다.
② 사용자가 부정확하거나 오래된 정보를 입력함으로써 발생하는 결과, 오류, 또는 불이익에 대해서는 전적으로 사용자 본인에게 책임이 있습니다.
③ 회사는 사용자가 입력한 데이터의 정확성, 완전성, 최신성에 대해 보증하지 않습니다.

■ 제5조 (데이터 유실 및 백업)
① 회사는 사용자의 데이터가 안전하게 저장되도록 합리적인 기술적·관리적 조치를 취합니다.
② 그러나 서버 오류, 시스템 장애, 또는 예기치 못한 기술적 문제로 인해 데이터가 유실될 가능성이 있습니다.
③ 사용자는 중요한 건강 정보를 PDF 내보내기 기능을 통해 주기적으로 백업하시기를 권장합니다.
④ 회사는 고의 또는 중대한 과실이 없는 한, 데이터 유실로 인한 손해에 대해 책임을 부담하지 않습니다.

■ 제6조 (서비스의 변경 및 중단)
회사는 서비스 개선을 위해 사전 공지 후 서비스를 변경하거나 중단할 수 있습니다.`,
  },
};

function InfoModal({
  type,
  onClose,
}: {
  type: 'help' | 'privacy' | 'terms';
  onClose: () => void;
}) {
  const { title, content } = INFO_CONTENT[type];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-dark-gray">{title}</h2>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <p className="text-sm text-gray-600 whitespace-pre-line">{content}</p>
        </div>

        <div className="p-4 border-t">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-lg bg-mint text-white font-bold hover:bg-mint/90"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}