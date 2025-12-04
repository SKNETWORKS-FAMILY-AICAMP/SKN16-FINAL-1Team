// src/pages/admin/FeedbackManagementPage.tsx

import React, { useState } from 'react';
import { 
  HiOutlineSearch, 
  HiOutlineFilter, 
  HiOutlineMail, 
  HiOutlineExclamationCircle,
  HiOutlinePaperAirplane,
  HiOutlineChatAlt
} from 'react-icons/hi';
import { toast } from 'react-toastify';
import useAdminStore, { type FeedbackType, type FeedbackStatus } from '../../store/useAdminStore';

export default function FeedbackManagementPage() {
  const { feedbacks, updateFeedbackStatus, addAdminReply } = useAdminStore();

  // 필터 및 상태
  const [filterType, setFilterType] = useState<FeedbackType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<FeedbackStatus | 'all'>('all');
  const [showReplyRequiredOnly, setShowReplyRequiredOnly] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');

  // 필터링 로직
  const filteredFeedbacks = feedbacks.filter(item => {
    const typeMatch = filterType === 'all' || item.type === filterType;
    const statusMatch = filterStatus === 'all' || item.status === filterStatus;
    const replyMatch = showReplyRequiredOnly ? item.replyByEmail : true; // 메일 요청 필터로 사용
    return typeMatch && statusMatch && replyMatch;
  });

  // --- 핸들러 ---
  const toggleExpand = (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      setReplyText('');
    } else {
      setExpandedId(id);
      const feedback = feedbacks.find(f => f.id === id);
      setReplyText(feedback?.adminReply || '');
    }
  };

  const handleStatusChange = (id: number, newStatus: FeedbackStatus) => {
    updateFeedbackStatus(id, newStatus);
    toast.success("처리 상태가 변경되었습니다.");
  };

  // 답변 보내기
  const handleSendReply = (id: number) => {
    if (!replyText.trim()) {
      toast.error("답변 내용을 입력해주세요.");
      return;
    }

    addAdminReply(id, replyText);

    const target = feedbacks.find(f => f.id === id);
    let msg = "앱 내 알림으로 답변을 보냈습니다.";
    if (target?.replyByEmail && target.email) {
      msg += ` (메일 ${target.email} 발송 포함)`;
    }
    toast.success(msg);
    setExpandedId(null);
    setReplyText('');
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-dark-gray">피드백 관리</h1>
        </div>
        <div className="text-right">
          <span className="text-sm font-bold text-mint">
            미처리 건수: {feedbacks.filter(f => f.status !== 'done').length}건
          </span>
        </div>
      </div>

      {/* 필터 영역 */}
      <div className="bg-white p-4 rounded-lg shadow flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-gray-600">
          <HiOutlineFilter />
          <span className="font-semibold">필터</span>
        </div>

        <select 
          value={filterType} 
          onChange={(e) => setFilterType(e.target.value as any)}
          className="p-2 border rounded-lg text-sm"
        >
          <option value="all">모든 유형</option>
          <option value="bug">버그</option>
          <option value="suggestion">제안</option>
          <option value="inquiry">문의</option>
          <option value="other">기타</option>
        </select>

        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="p-2 border rounded-lg text-sm"
        >
          <option value="all">모든 상태</option>
          <option value="new">대기중</option>
          <option value="in_progress">처리중</option>
          <option value="done">완료</option>
        </select>

        <label className="flex items-center gap-2 cursor-pointer select-none bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-100">
          <input 
            type="checkbox" 
            checked={showReplyRequiredOnly}
            onChange={(e) => setShowReplyRequiredOnly(e.target.checked)}
            className="w-4 h-4 text-mint rounded focus:ring-mint"
          />
          <span className="text-sm font-semibold text-dark-gray">메일 답변 요청만 보기</span>
        </label>
      </div>

      {/* 피드백 리스트 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 text-sm font-semibold text-gray-600">유형</th>
              <th className="p-4 text-sm font-semibold text-gray-600">제목</th>
              <th className="p-4 text-sm font-semibold text-gray-600">작성자</th>
              <th className="p-4 text-sm font-semibold text-gray-600">작성일</th>
              <th className="p-4 text-sm font-semibold text-gray-600">메일요청</th>
              <th className="p-4 text-sm font-semibold text-gray-600">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredFeedbacks.map((item) => (
              <React.Fragment key={item.id}>
                {/* 메인 행 */}
                <tr onClick={() => toggleExpand(item.id)} className={`hover:bg-gray-50 transition-colors cursor-pointer ${expandedId === item.id ? 'bg-mint/5' : ''}`}>
                  <td className="p-4"><TypeBadge type={item.type} /></td>
                  <td className="p-4 font-medium text-dark-gray max-w-xs truncate">{item.title}</td>
                  <td className="p-4 text-sm text-gray-600">{item.user}</td>
                  <td className="p-4 text-sm text-gray-500">{item.date}</td>
                  <td className="p-4">
                    {item.replyByEmail ? <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 text-blue-600 text-xs font-bold"><HiOutlineMail /> 요청됨</span> : <span className="text-gray-400 text-xs">-</span>}
                  </td>
                  <td className="p-4">
                    <StatusSelect status={item.status} onChange={(s) => handleStatusChange(item.id, s)} />
                  </td>
                </tr>

                {/* 상세 내용 및 답변 폼 */}
                {expandedId === item.id && (
                  <tr className="bg-gray-50">
                    <td colSpan={6} className="p-6 border-b border-t border-mint/20">
                      <div className="flex flex-col gap-6">
                        {/* 문의 내용 */}
                        <div>
                          <h4 className="text-sm font-bold text-gray-500 mb-2">문의 내용</h4>
                          <div className="bg-white p-4 rounded border border-gray-200 leading-relaxed text-dark-gray">
                            {item.content}
                          </div>
                          {item.email && (
                            <p className="text-xs text-gray-400 mt-1 text-right">
                              연락처 이메일: {item.email}
                            </p>
                          )}
                        </div>
                        
                        {/* 답변 작성 영역 */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-bold text-gray-500">
                              관리자 답변 
                              {item.status === 'done' && <span className="text-green-600 ml-2">(답변 완료됨)</span>}
                            </h4>
                            {item.replyByEmail && (
                              <span className="text-xs text-blue-600 flex items-center gap-1">
                                <HiOutlineExclamationCircle /> 사용자가 메일 답변을 추가로 요청했습니다.
                              </span>
                            )}
                          </div>
                          
                          <textarea
                            rows={4}
                            placeholder="사용자에게 보낼 답변을 입력하세요..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mint"
                          />
                          
                          <div className="flex justify-end mt-3">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleSendReply(item.id); }}
                              className="flex items-center gap-2 px-6 py-2 bg-dark-gray text-white rounded-lg hover:bg-black transition-colors font-semibold"
                            >
                              <HiOutlinePaperAirplane className="transform rotate-90" />
                              답변 보내기
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        {filteredFeedbacks.length === 0 && (
          <div className="p-10 text-center text-gray-500">
            해당하는 피드백이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}

// --- 서브 컴포넌트 ---

function TypeBadge({ type }: { type: FeedbackType }) {
  const config = {
    bug: { color: 'bg-red-100 text-red-700', label: '버그' },
    suggestion: { color: 'bg-yellow-100 text-yellow-700', label: '제안' },
    inquiry: { color: 'bg-blue-100 text-blue-700', label: '문의' },
    other: { color: 'bg-gray-100 text-gray-700', label: '기타' },
  };
  const { color, label } = config[type];
  return <span className={`px-2 py-1 rounded-full text-xs font-bold ${color}`}>{label}</span>;
}

function StatusSelect({ status, onChange }: { status: FeedbackStatus, onChange: (s: FeedbackStatus) => void }) {
  const styles = {
    new: 'text-red-500 font-bold',
    in_progress: 'text-blue-500 font-bold',
    done: 'text-green-500 font-bold',
  };
  return (
    <select 
      value={status} 
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onChange(e.target.value as FeedbackStatus)}
      className={`p-1 border rounded text-xs cursor-pointer ${styles[status]}`}
    >
      <option value="new">대기중</option>
      <option value="in_progress">처리중</option>
      <option value="done">완료</option>
    </select>
  );
}