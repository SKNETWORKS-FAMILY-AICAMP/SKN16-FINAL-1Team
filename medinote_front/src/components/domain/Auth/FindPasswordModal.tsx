import React, { useState, type FormEvent } from 'react';
import { 
  HiOutlineMail, 
  HiOutlineUser, 
  HiOutlineX, 
  HiOutlineLockClosed, 
  HiOutlineCheckCircle,
  HiOutlinePaperAirplane // 메일 발송 아이콘
} from 'react-icons/hi';
import { toast } from 'react-toastify';

type ModalProps = {
  onClose: () => void;
};

// (가짜) 서버에 저장된 회원 정보
const MOCK_DB = [
  { email: 'admin@test.com', name: '관리자' },
  { email: 'user@test.com', name: '홍길동' },
];

// 회원가입 페이지의 검증 로직 재사용
const validatePassword = (v: string) => {
  if (!v) return '비밀번호를 입력해주세요';
  if (v.length < 8 || v.length > 20) return '비밀번호는 8자 이상 20자 이하로 입력해주세요';
  const hasLetter = /[A-Za-z]/.test(v);
  const hasNumber = /[0-9]/.test(v);
  const hasSpecial = /[^A-Za-z0-9]/.test(v);
  if (!(hasLetter && hasNumber && hasSpecial))
    return '비밀번호는 영문, 숫자, 특수문자를 모두 포함해야 합니다';
  return undefined;
};

const validateConfirm = (c: string, p: string) => {
  if (!c) return '비밀번호를 다시 확인해주세요';
  if (c !== p) return '비밀번호가 일치하지 않습니다';
  return undefined;
};

export default function FindPasswordModal({ onClose }: ModalProps) {
  // 1. 단계 관리: verify(본인확인) -> waiting(인증대기) -> reset(비번재설정)
  const [step, setStep] = useState<'verify' | 'waiting' | 'reset'>('verify');

  // 입력값 상태
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // 에러 메시지 상태
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');

  // --- 1단계: 본인 확인 및 메일 발송 ---
  const handleVerifySubmit = (e: FormEvent) => {
    e.preventDefault();
    setEmailError('');

    if (!email.trim()) {
      setEmailError('이메일을 입력해주세요.');
      return;
    }
    if (!name.trim()) {
      toast.error('이름을 입력해주세요.');
      return;
    }

    // (가상) 서버 조회
    const user = MOCK_DB.find((u) => u.email === email);

    if (!user) {
      setEmailError('존재하지 않는 이메일입니다.');
      return;
    }
    if (user.name !== name) {
      toast.error('입력하신 이메일과 이름이 일치하지 않습니다.');
      return;
    }

    // 성공 시 대기 화면으로 이동
    toast.success('인증 메일을 발송했습니다.');
    setStep('waiting');
  };

  // --- 2단계: 인증 완료 버튼 (가상) ---
  const handleWaitComplete = () => {
    // 실제로는 사용자가 메일 링크를 클릭하면 이 단계로 오거나,
    // 여기서 서버에 "인증 됐나요?" 확인(Polling)하는 로직이 들어감
    toast.success('이메일 인증이 확인되었습니다.');
    setStep('reset');
  };

  // --- 3단계: 비밀번호 변경 제출 ---
  const handleResetSubmit = (e: FormEvent) => {
    e.preventDefault();

    // 유효성 검사 실행
    const pErr = validatePassword(newPassword);
    const cErr = validateConfirm(confirmPassword, newPassword);

    setPasswordError(pErr || '');
    setConfirmError(cErr || '');

    if (pErr || cErr) return;

    // (가상) 서버로 변경 요청
    console.log(`[비밀번호 변경 요청] ${email} -> ${newPassword}`);

    toast.success("비밀번호가 성공적으로 변경되었습니다. 로그인해주세요.");
    onClose(); // 모달 닫기
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-white rounded-lg shadow-popup p-6 z-50"
        onClick={(e) => e.stopPropagation()} 
      >
        {/* 상단 제목 및 닫기 버튼 */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-dark-gray">
            {step === 'verify' ? '비밀번호 찾기' : 
             step === 'waiting' ? '메일 발송 완료' : '비밀번호 재설정'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-dark-gray text-2xl">
            <HiOutlineX />
          </button>
        </div>
        
        {/* --- 1단계: 본인 확인 폼 --- */}
        {step === 'verify' && (
          <form onSubmit={handleVerifySubmit}>
            <p className="text-sm text-gray-500 mb-6">
              이메일과 이름으로 본인 확인을 진행하세요.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-bold text-dark-gray mb-2">이메일</label>
              <div className="relative">
                <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  placeholder="이메일을 입력하세요"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    emailError ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-mint'
                  }`}
                />
              </div>
              {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-dark-gray mb-2">이름</label>
              <div className="relative">
                <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="이름을 입력하세요"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mint"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-mint hover:bg-mint-dark text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors"
            >
              본인인증 메일 보내기
            </button>
          </form>
        )}

        {/* --- 2단계: 인증 대기 화면 --- */}
        {step === 'waiting' && (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-mint/10 rounded-full flex items-center justify-center mx-auto mb-4 text-mint text-3xl">
              <HiOutlinePaperAirplane className="transform rotate-45 -ml-1" />
            </div>
            <h3 className="text-lg font-bold text-dark-gray mb-2">인증 메일이 발송되었습니다.</h3>
            <p className="text-sm text-gray-500 mb-6 px-4 leading-relaxed">
              <span className="font-bold text-mint">{email}</span> 으로 보낸 메일을 확인해주세요.<br/>
              메일 내 링크를 클릭하면 인증이 완료됩니다.
            </p>
            
            <button
              onClick={handleWaitComplete}
              className="w-full bg-mint hover:bg-mint-dark text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              인증 완료 (가상)
            </button>
            <p className="text-xs text-gray-400 mt-4 cursor-pointer hover:underline" onClick={() => setStep('verify')}>
              이메일 다시 입력하기
            </p>
          </div>
        )}

        {/* --- 3단계: 새 비밀번호 설정 폼 --- */}
        {step === 'reset' && (
          <form onSubmit={handleResetSubmit} className="space-y-5">
            <p className="text-sm text-gray-500 mb-2">
              인증되었습니다. 새로운 비밀번호를 설정해주세요.
            </p>

            <div>
              <label className="block text-sm font-bold text-dark-gray mb-2">새 비밀번호</label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  placeholder="영문, 숫자, 특수문자 포함 8자 이상"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (passwordError) setPasswordError(''); 
                  }}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    passwordError ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-mint'
                  }`}
                />
              </div>
              {passwordError && <p className="text-xs text-red-500 mt-1">{passwordError}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-dark-gray mb-2">새 비밀번호 확인</label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  placeholder="비밀번호를 다시 확인해주세요"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (confirmError) setConfirmError('');
                  }}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    confirmError ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-mint'
                  }`}
                />
                {!confirmError && newPassword && newPassword === confirmPassword && (
                  <HiOutlineCheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
                )}
              </div>
              {confirmError && <p className="text-xs text-red-500 mt-1">{confirmError}</p>}
            </div>

            <button
              type="submit"
              className="w-full bg-mint hover:bg-mint-dark text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors"
            >
              비밀번호 변경 완료
            </button>
          </form>
        )}
      </div>
    </div>
  );
}