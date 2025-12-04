import React, { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { 
  HiOutlineX, 
  HiOutlineCamera, 
  HiOutlineLockClosed, 
  HiOutlineCheckCircle,
  HiOutlineUser,
  HiOutlineMail
} from 'react-icons/hi';
import useUserStore from '../../../store/useUserStore';
import { toast } from 'react-toastify';

type ModalProps = { onClose: () => void };

// --- 유효성 검사 로직 (회원가입과 동일) ---
const validateName = (v: string) => {
  const t = v.trim();
  if (!t) return '이름을 입력해주세요';
  if (t.length < 2 || t.length > 20) return '이름은 2자 이상 20자 이하로 입력해주세요';
  if (!/^[A-Za-z가-힣\s]+$/.test(t)) return '이름에는 특수문자나 숫자를 사용할 수 없습니다';
  return undefined;
};

const validatePasswordRule = (v: string) => {
  if (!v) return undefined; // 변경 안 할 경우 허용
  if (v.length < 8 || v.length > 20) return '비밀번호는 8자 이상 20자 이하로 입력해주세요';
  const hasLetter = /[A-Za-z]/.test(v);
  const hasNumber = /[0-9]/.test(v);
  const hasSpecial = /[^A-Za-z0-9]/.test(v);
  if (!(hasLetter && hasNumber && hasSpecial))
    return '비밀번호는 영문, 숫자, 특수문자를 모두 포함해야 합니다';
  return undefined;
};

const validateConfirm = (confirm: string, original: string) => {
  if (original && !confirm) return '비밀번호를 다시 확인해주세요';
  if (original !== confirm) return '비밀번호가 일치하지 않습니다';
  return undefined;
};

export default function ProfileEditModal({ onClose }: ModalProps) {
  const { userName, userEmail, userAvatar, updateProfile, updateAvatar } = useUserStore();
  
  // 1. 단계 관리 ('verify': 본인확인, 'edit': 수정하기)
  const [step, setStep] = useState<'verify' | 'edit'>('verify');

  // --- [단계 1] 본인 확인용 State ---
  const [verifyPassword, setVerifyPassword] = useState('');

  // --- [단계 2] 수정용 State & Validation ---
  const [editName, setEditName] = useState(userName || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 에러 메시지 & 터치 상태
  const [errors, setErrors] = useState<{ name?: string; newPassword?: string; confirm?: string }>({});
  const [touched, setTouched] = useState<{ name?: boolean; newPassword?: boolean; confirm?: boolean }>({});

  // 파일 업로드 ref
  const fileRef = useRef<HTMLInputElement | null>(null);

  // 이미지 변경 핸들러
  const onPickImage = () => fileRef.current?.click();
  const onFileSelected = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      if (dataUrl) {
        updateAvatar(dataUrl);
        toast.success('프로필 사진이 변경되었습니다.');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // --- 1. 본인 확인 제출 ---
  const handleVerifySubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!verifyPassword) {
      toast.error('현재 비밀번호를 입력해주세요.');
      return;
    }
    
    // (가상) 비밀번호 확인 로직
    // 실제로는 API 호출이 필요합니다. 여기서는 간단히 통과시킵니다.
    console.log(`본인 확인 시도: ${userEmail} / ${verifyPassword}`);
    
    toast.info('본인 확인이 완료되었습니다.');
    setStep('edit');
  };

  // --- Validation 핸들러 (onBlur) ---
  const handleBlur = (field: 'name' | 'newPassword' | 'confirm') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    
    if (field === 'name') {
      setErrors((prev) => ({ ...prev, name: validateName(editName) }));
    }
    if (field === 'newPassword') {
      setErrors((prev) => ({ ...prev, newPassword: validatePasswordRule(newPassword) }));
    }
    if (field === 'confirm') {
      setErrors((prev) => ({ ...prev, confirm: validateConfirm(confirmPassword, newPassword) }));
    }
  };

  // --- 입력 변경 핸들러 (실시간 에러 갱신) ---
  const handleChangeName = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEditName(val);
    if (touched.name) setErrors((prev) => ({ ...prev, name: validateName(val) }));
  };

  const handleChangeNewPassword = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewPassword(val);
    if (touched.newPassword) setErrors((prev) => ({ ...prev, newPassword: validatePasswordRule(val) }));
    // 비밀번호가 바뀌면 확인란도 다시 검사
    if (touched.confirm) setErrors((prev) => ({ ...prev, confirm: validateConfirm(confirmPassword, val) }));
  };

  const handleChangeConfirm = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setConfirmPassword(val);
    if (touched.confirm) setErrors((prev) => ({ ...prev, confirm: validateConfirm(val, newPassword) }));
  };

  // --- 2. 수정 사항 저장 ---
  const handleEditSubmit = (e: FormEvent) => {
    e.preventDefault();

    // 전체 유효성 검사
    const nErr = validateName(editName);
    const pErr = validatePasswordRule(newPassword);
    const cErr = validateConfirm(confirmPassword, newPassword);

    // 하나라도 에러가 있으면 중단
    if (nErr || (newPassword && (pErr || cErr))) {
      setErrors({ name: nErr, newPassword: pErr, confirm: cErr });
      setTouched({ name: true, newPassword: true, confirm: true });
      return;
    }

    // (가상) 서버 저장
    // 비밀번호가 있으면 함께 저장, 없으면 이름만 저장하는 식으로 처리
    // useUserStore의 updateProfile이 (name, email)만 받도록 되어있다면 비밀번호 처리는 별도 API 호출 필요
    updateProfile(editName, userEmail || ''); 
    
    if (newPassword) {
      console.log(`비밀번호 변경 요청: ${newPassword}`);
    }

    toast.success('회원 정보가 수정되었습니다.');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-lg shadow-popup p-6 z-50" onClick={(e) => e.stopPropagation()}>
        
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-dark-gray">
            {step === 'verify' ? '본인 확인' : '회원 정보 수정'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-dark-gray text-2xl">
            <HiOutlineX />
          </button>
        </div>

        {/* --- [단계 1] 본인 확인 폼 --- */}
        {step === 'verify' && (
          <form onSubmit={handleVerifySubmit} className="space-y-5">
            <p className="text-sm text-gray-500">
              개인정보 보호를 위해 비밀번호를 입력해주세요.
            </p>

            {/* 이메일 (수정불가) */}
            <div>
              <label className="block text-sm font-bold text-dark-gray mb-2">이메일</label>
              <div className="relative">
                <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="email" 
                  value={userEmail || ''} 
                  disabled 
                  className="w-full pl-10 pr-3 py-3 border rounded-lg bg-gray-100 text-gray-500"
                />
              </div>
            </div>

            {/* 비밀번호 입력 */}
            <div>
              <label className="block text-sm font-bold text-dark-gray mb-2">비밀번호</label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="password" 
                  placeholder="현재 비밀번호 입력"
                  value={verifyPassword} 
                  onChange={(e) => setVerifyPassword(e.target.value)} 
                  className="w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mint"
                  autoFocus
                />
              </div>
            </div>

            <button type="submit" className="w-full bg-mint hover:bg-mint-dark text-white font-bold py-3 px-4 rounded-lg mt-2">
              확인
            </button>
          </form>
        )}

        {/* --- [단계 2] 전체 수정 폼 --- */}
        {step === 'edit' && (
          <form onSubmit={handleEditSubmit} className="space-y-5">
            
            {/* 1. 프로필 사진 */}
            <div className="flex flex-col items-center mb-2">
              <div className="relative w-24 h-24 mb-2 cursor-pointer group" onClick={onPickImage}>
                {userAvatar ? (
                  <img src={userAvatar} alt="avatar" className="w-24 h-24 rounded-full object-cover border border-gray-200" />
                ) : (
                  <div className="w-24 h-24 bg-mint rounded-full flex items-center justify-center text-white font-bold text-4xl">
                    {userName?.charAt(0) || '?'}
                  </div>
                )}
                <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white border border-gray-200 shadow flex items-center justify-center text-gray-500 group-hover:text-mint transition-colors">
                  <HiOutlineCamera />
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileSelected} />
              </div>
            </div>

            {/* 2. 이름 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">이름</label>
              <div className="relative">
                <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  value={editName} 
                  onChange={handleChangeName}
                  onBlur={() => handleBlur('name')}
                  className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 ${errors.name && touched.name ? 'border-red-500 focus:ring-red-200' : 'focus:ring-mint'}`} 
                />
              </div>
              {touched.name && errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>
            
            {/* 이메일 (수정불가) */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                이메일 <span className="text-xs font-normal text-gray-400">(변경 불가)</span>
              </label>
              <div className="relative">
                <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="email" 
                  value={userEmail || ''} 
                  readOnly 
                  disabled 
                  className="w-full pl-10 pr-3 py-3 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed" 
                />
              </div>
            </div>

            <hr className="border-gray-100 my-4" />
            
            {/* 3. 비밀번호 변경 (입력 시 재확인 칸 등장) */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                새 비밀번호 <span className="text-xs font-normal text-gray-400">(변경 시에만 입력)</span>
              </label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="password" 
                  placeholder="새 비밀번호 입력"
                  value={newPassword} 
                  onChange={handleChangeNewPassword}
                  onBlur={() => handleBlur('newPassword')}
                  className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 ${errors.newPassword && touched.newPassword ? 'border-red-500 focus:ring-red-200' : 'focus:ring-mint'}`} 
                />
              </div>
              {touched.newPassword && errors.newPassword && <p className="text-xs text-red-500 mt-1">{errors.newPassword}</p>}
            </div>

            {/* 재확인 칸: 새 비밀번호가 입력되었을 때만 표시 */}
            {newPassword.length > 0 && (
              <div className="animate-fade-in-down">
                <label className="block text-sm font-bold text-gray-700 mb-1">새 비밀번호 확인</label>
                <div className="relative">
                  <HiOutlineCheckCircle className={`absolute left-3 top-1/2 -translate-y-1/2 text-xl ${newPassword === confirmPassword && confirmPassword ? 'text-green-500' : 'text-gray-400'}`} />
                  <input 
                    type="password" 
                    placeholder="비밀번호 다시 입력"
                    value={confirmPassword} 
                    onChange={handleChangeConfirm}
                    onBlur={() => handleBlur('confirm')}
                    className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 ${errors.confirm && touched.confirm ? 'border-red-500 focus:ring-red-200' : 'focus:ring-mint'}`} 
                  />
                </div>
                {touched.confirm && errors.confirm && <p className="text-xs text-red-500 mt-1">{errors.confirm}</p>}
              </div>
            )}

            <button type="submit" className="w-full bg-mint hover:bg-mint-dark text-white font-bold py-3 px-4 rounded-lg mt-4 transition-colors">
              저장하기
            </button>
          </form>
        )}
      </div>
    </div>
  );
}