import React, { useState } from 'react';
import { HiOutlineTrash, HiOutlineCheckCircle } from 'react-icons/hi';
// MainHeader.tsx에서 정의한 Notification 타입을 가져옵니다.
import { type Notification } from './MainHeader'; 

// MainHeader로부터 받을 props 타입
type DropdownProps = {
  notifications: Notification[];
  onClose: () => void;
  onMarkAsRead: (item: Notification) => void;
  onItemDelete: (id: string) => void;
  onReadAll: () => void;
};

export default function NotificationDropdown(
  { notifications, onClose, onMarkAsRead, onItemDelete, onReadAll }: DropdownProps
) {
  // [핵심] 현재 확장된(열린) 알림의 ID를 저장할 state
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="absolute top-14 right-0 w-80 bg-white rounded-lg shadow-popup z-50 border border-gray-100">
      {/* 1. 헤더 */}
      <div className="flex justify-between items-center p-4 border-b">
        <h3 className="font-bold text-dark-gray">알림</h3>
        <button 
          onClick={onReadAll}
          className="text-xs text-mint font-semibold hover:underline"
        >
          모두 읽음
        </button>
      </div>

      {/* 2. 알림 리스트 (스크롤) */}
      <ul className="py-2 max-h-80 overflow-y-auto">
        {notifications.length > 0 ? (
          notifications.map(item => (
            <NotificationItem 
              key={item.id}
              item={item}
              isExpanded={expandedId === item.id}
              // 클릭 시 ID를 토글 (열렸으면 닫고, 닫혔으면 열기)
              onToggleExpand={() => setExpandedId(expandedId === item.id ? null : item.id)}
              onMarkAsRead={onMarkAsRead}
              onItemDelete={onItemDelete}
            />
          ))
        ) : (
          <li className="p-4 text-center text-sm text-gray-400">
            새로운 알림이 없습니다.
          </li>
        )}
      </ul>
    </div>
  );
}

// --- 서브 컴포넌트: 알림 아이템 (확장 기능 포함) ---
type ItemProps = {
  item: Notification;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onMarkAsRead: (item: Notification) => void;
  onItemDelete: (id: string) => void;
};

function NotificationItem({ item, isExpanded, onToggleExpand, onMarkAsRead, onItemDelete }: ItemProps) {
  
  // 삭제 버튼 클릭 시 이벤트 전파(확장) 방지
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    onItemDelete(item.id);
  };

  // 아이템 클릭 시 (확장 + 읽음 처리)
  const handleClick = () => {
    onToggleExpand(); // 확장/축소
    if (!item.read) {
      onMarkAsRead(item); // '읽음' 처리
    }
  };

  return (
    <li 
      onClick={handleClick}
      className={`block px-4 py-3 cursor-pointer ${
        item.read ? 'bg-white' : 'bg-mint/5' // 안 읽은 건 민트색 배경
      } hover:bg-gray-100 transition-colors`}
    >
      {/* 상단 (아이콘, 요약, 삭제버튼) */}
      <div className="flex items-start gap-3">
        {/* 아이콘 */}
        <div className="w-8 h-8 bg-mint/10 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5">
          {/* 아이콘 예시: 피드백은 다른 아이콘으로 (로직 추가 필요) */}
          <HiOutlineCheckCircle className="text-mint text-xl" />
        </div>

        {/* 내용 (Truncate 처리) */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${item.read ? 'font-normal text-gray-700' : 'font-bold text-dark-gray'}`}>
            {item.title}
          </p>
          {/* 확장되지 않았을 때만 요약본(...) 표시 */}
          {!isExpanded && (
            <p className="text-sm text-gray-600 truncate">
              {item.content}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1">{item.time}</p>
        </div>

        {/* 삭제 버튼 */}
        <button 
          onClick={handleDelete}
          title="알림 삭제"
          className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-200"
        >
          <HiOutlineTrash />
        </button>
      </div>

      {/* [핵심] 확장 시 전체 내용 표시 */}
      {isExpanded && (
        <div className="pl-11 pt-3 mt-2 border-t border-mint/10">
          {/* whitespace-pre-wrap: 줄바꿈과 공백을 유지하며 보여줌 */}
          <p className="text-sm text-dark-gray whitespace-pre-wrap">
            {item.content}
          </p>
        </div>
      )}
    </li>
  );
}