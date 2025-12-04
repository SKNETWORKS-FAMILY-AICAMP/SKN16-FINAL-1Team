import React, { useState, type FormEvent } from 'react';
import { HiOutlineX, HiOutlineCheck } from 'react-icons/hi';
import { toast } from 'react-toastify';

// 1. 모달 Props 정의
type ModalProps = {
  onClose: () => void;
};

// 2. 피드백 유형 정의
type FeedbackType = 'bug' | 'suggestion' | 'inquiry' | 'other';

export default function FeedbackModal({ onClose }: ModalProps) {
  // 3. 폼 State 관리
  const [title, setTitle] = useState('');
  const [type, setType] = useState<FeedbackType>('bug'); // 기본값 '버그'
  const [content, setContent] = useState('');
  const [email, setEmail] = useState('');
  const [replyByEmail, setReplyByEmail] = useState(false); // 메일 답변 요청 여부

  // 4. 제출 핸들러
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // 유효성 검사
    if (!title.trim()) {
      toast.error("제목을 입력해주세요.");
      return;
    }
    if (!content.trim()) {
      toast.error("내용을 입력해주세요.");
      return;
    }

    // (가상) 서버 전송 로직
    console.log("피드백 제출:", { 
      title, type, content, email, replyByEmail,
      date: new Date().toISOString()
    });
    
    // 5. 성공 알림 및 모달 닫기
    toast.success("소중한 의견 감사합니다! 담당자가 확인중입니다.");
    onClose();
  };

  return (
    // 모달 뒷배경 (Dim)
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* 모달 본체 */}
      <div 
        className="w-full max-w-lg bg-white rounded-lg shadow-popup p-6 z-50 animate-fade-in-up"
        onClick={(e) => e.stopPropagation()} 
      >
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-dark-gray">피드백 제공</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-dark-gray text-2xl">
            <HiOutlineX />
          </button>
        </div>

        {/* 입력 폼 */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* 제목 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">제목</label>
            <input
              type="text"
              placeholder="제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mint"
            />
          </div>

          {/* 유형 (토글 버튼) */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">유형</label>
            <div className="flex flex-wrap gap-2">
              <ToggleButton name="bug" label="버그" current={type} setType={setType} />
              <ToggleButton name="suggestion" label="제안" current={type} setType={setType} />
              <ToggleButton name="inquiry" label="문의" current={type} setType={setType} />
              <ToggleButton name="other" label="기타" current={type} setType={setType} />
            </div>
          </div>

          {/* 내용 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">내용</label>
            <textarea
              rows={5}
              placeholder="자세한 내용을 입력해주세요."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mint resize-none"
            />
          </div>

          {/* 이메일 & 메일 답변 여부 */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <div className="mb-3">
              <label className="block text-sm font-bold text-gray-700 mb-1.5">이메일 (선택)</label>
              <input
                type="email"
                placeholder="답변 받을 이메일을 입력하세요"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mint bg-white"
              />
            </div>
            
            {/* 메일 답변 요청 토글 */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${replyByEmail ? 'bg-mint border-mint' : 'bg-white border-gray-300'}`}>
                {replyByEmail && <HiOutlineCheck className="text-white text-sm" />}
              </div>
              <input 
                type="checkbox"
                checked={replyByEmail}
                onChange={(e) => setReplyByEmail(e.target.checked)}
                className="hidden"
              />
              <span className="text-sm font-medium text-gray-600">
                메일로 답변을 받겠습니다.
              </span>
            </label>
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            className="w-full py-3 bg-mint hover:bg-mint-dark text-white font-bold rounded-lg shadow-md transition-colors"
          >
            제출하기
          </button>
        </form>
      </div>
    </div>
  );
}

// --- 서브 컴포넌트: 유형 선택 버튼 ---
type ToggleProps = {
  name: FeedbackType;
  label: string;
  current: FeedbackType;
  setType: (type: FeedbackType) => void;
};

function ToggleButton({ name, label, current, setType }: ToggleProps) {
  const isActive = current === name;
  return (
    <button
      type="button"
      onClick={() => setType(name)}
      className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
        isActive 
          ? 'bg-mint text-white border-mint shadow-sm' 
          : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  );
}