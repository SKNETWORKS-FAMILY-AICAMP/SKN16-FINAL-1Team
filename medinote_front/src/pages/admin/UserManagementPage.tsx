// src/pages/admin/UserManagementPage.tsx

import React, { useState } from 'react';
import { 
  HiOutlineSearch, 
  HiOutlineMail, 
  HiOutlineChevronDown, 
  HiOutlineChevronUp,
  HiOutlineSave,
  HiOutlineBan,
  HiOutlineX,
  HiOutlineExclamationCircle
} from 'react-icons/hi';
import { toast } from 'react-toastify';

type UserStatus = 'active' | 'suspended' | 'withdrawn'; // 정상, 정지, 탈퇴
type LoginStatus = 'online' | 'offline';
type UserGroup = 'admin' | 'user';

interface User {
  id: number;
  name: string;
  email: string;
  group: UserGroup;
  joinDate: string;
  lastLogin: string;
  loginStatus: LoginStatus;
  status: UserStatus;
  ip: string;
  suspendReason?: string;
}

export default function UserManagementPage() {
  // 가상 회원 데이터 30개
  const [users, setUsers] = useState<User[]>(
    Array.from({ length: 30 }, (_, i) => ({
      id: i + 1,
      name: `사용자${i + 1}`,
      email: `user${i + 1}@example.com`,
      group: i === 0 ? 'admin' : 'user',
      joinDate: '2025-10-01',
      lastLogin: '2025-11-13',
      loginStatus: i % 3 === 0 ? 'online' : 'offline',
      status: i % 5 === 0 ? 'suspended' : i % 7 === 0 ? 'withdrawn' : 'active',
      ip: `192.168.0.${i + 1}`,
      suspendReason: i % 5 === 0 ? '약관 위반(욕설 사용)' : undefined,
    }))
  );

  // 검색 및 필터 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState<UserGroup | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<UserStatus | 'all'>('all');
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);

  // 정지 모달 상태
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [targetUserId, setTargetUserId] = useState<number | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // 필터링 로직
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.includes(searchTerm) || user.email.includes(searchTerm);
    const matchesGroup = filterGroup === 'all' || user.group === filterGroup;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesGroup && matchesStatus;
  });

  // 페이지네이션 로직
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // --- 핸들러 ---
  const toggleExpand = (id: number) => {
    setExpandedUserId(expandedUserId === id ? null : id);
  };

  const handleNameChange = (id: number, newName: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, name: newName } : u));
  };

  const sendTempPassword = (email: string) => {
    // (가상 API)
    toast.info(`${email}로 임시 비밀번호를 발송했습니다.`);
  };

  const handleStatusChangeRequest = (id: number, newStatus: UserStatus) => {
    if (newStatus === 'suspended') {
      setTargetUserId(id);
      setSuspendReason('');
      setSuspendModalOpen(true);
    } 
    else {
      updateUserStatus(id, newStatus);
      toast.success("회원 상태가 변경되었습니다.");
    }
  };

  const updateUserStatus = (id: number, newStatus: UserStatus, reason?: string) => {
    setUsers(users.map(u => 
      u.id === id 
        ? { ...u, status: newStatus, suspendReason: reason } 
        : u
    ));
  };

  const confirmSuspend = () => {
    if (!targetUserId) return;
    if (!suspendReason.trim()) {
      toast.error("정지 사유를 입력해주세요.");
      return;
    }

    updateUserStatus(targetUserId, 'suspended', suspendReason);
    toast.success(`이용 정지 처리되었습니다. (사유: ${suspendReason})`);
    setSuspendModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-16 relative">
      <h1 className="text-2xl font-bold text-dark-gray">회원 관리</h1>

      {/* 1. 검색 및 필터 영역 */}
      <div className="bg-white p-4 rounded-lg shadow flex flex-wrap gap-4 items-center">
        {/* 검색창 */}
        <div className="relative flex-1 min-w-[200px]">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="이름 또는 이메일 검색" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-mint"
          />
        </div>
        
        {/* 그룹 필터 */}
        <select 
          className="p-2 border rounded-lg"
          value={filterGroup}
          onChange={(e) => setFilterGroup(e.target.value as any)}
        >
          <option value="all">전체 그룹</option>
          <option value="user">사용자</option>
          <option value="admin">관리자</option>
        </select>

        {/* 상태 필터 */}
        <select 
          className="p-2 border rounded-lg"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
        >
          <option value="all">전체 상태</option>
          <option value="active">정상</option>
          <option value="suspended">정지</option>
          <option value="withdrawn">탈퇴</option>
        </select>
      </div>

      {/* 2. 회원 리스트 테이블 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 text-sm font-semibold text-gray-600">이름</th>
              <th className="p-4 text-sm font-semibold text-gray-600">이메일</th>
              <th className="p-4 text-sm font-semibold text-gray-600">비밀번호</th>
              <th className="p-4 text-sm font-semibold text-gray-600">그룹</th>
              <th className="p-4 text-sm font-semibold text-gray-600">가입일</th>
              <th className="p-4 text-sm font-semibold text-gray-600">최근접속</th>
              <th className="p-4 text-sm font-semibold text-gray-600">로그인</th>
              <th className="p-4 text-sm font-semibold text-gray-600">상태</th>
              <th className="p-4 text-sm font-semibold text-gray-600">IP</th>
              <th className="p-4 text-sm font-semibold text-gray-600">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {currentUsers.map((user) => (
              <React.Fragment key={user.id}>
                {/* 메인 행 */}
                <tr 
                  className={`hover:bg-gray-50 transition-colors cursor-pointer ${expandedUserId === user.id ? 'bg-mint/5' : ''}`}
                  onClick={() => toggleExpand(user.id)}
                >
                  <td className="p-4 text-dark-gray">{user.name}</td>
                  <td className="p-4 text-gray-600">{user.email}</td>
                  <td className="p-4 text-gray-400">********</td>
                  <td className="p-4">{user.group === 'admin' ? '관리자' : '사용자'}</td>
                  <td className="p-4 text-gray-500">{user.joinDate}</td>
                  <td className="p-4 text-gray-500">{user.lastLogin}</td>
                  <td className={`p-4 ${user.loginStatus === 'online' ? 'text-green-500' : 'text-gray-400'}`}>
                    {user.loginStatus === 'online' ? 'Online' : 'Offline'}
                  </td>
                  <td className="p-4">
                    <StatusBadge status={user.status} />
                  </td>
                  <td className="p-4 text-gray-500 text-xs">{user.ip}</td>
                  <td className="p-4">
                    {expandedUserId === user.id ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />}
                  </td>
                </tr>

                {/* 상세 정보 드롭다운 (수정 폼) */}
                {expandedUserId === user.id && (
                  <tr className="bg-gray-50">
                    <td colSpan={10} className="p-6 border-b border-t border-mint/20">
                      <div className="flex flex-col gap-4">
                        <h4 className="font-bold text-dark-gray mb-2">회원 정보 수정</h4>
                        
                        {/* 정지된 회원일 경우 사유 표시 */}
                        {user.status === 'suspended' && user.suspendReason && (
                            <div className="bg-red-50 border border-red-200 p-3 rounded-lg mb-2 flex items-start gap-2">
                                <HiOutlineExclamationCircle className="text-red-500 text-xl flex-shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-bold text-red-600 text-sm">이용 정지 사유: </span>
                                    <span className="text-red-600 text-sm">{user.suspendReason}</span>
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* 이름 수정 */}
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">이름 수정</label>
                            <div className="flex gap-2">
                              <input 
                                type="text" 
                                value={user.name}
                                onChange={(e) => handleNameChange(user.id, e.target.value)}
                                className="p-2 border rounded w-full"
                              />
                              <button className="bg-mint text-white px-3 rounded hover:bg-mint-dark">
                                <HiOutlineSave />
                              </button>
                            </div>
                          </div>

                          {/* 상태 변경 */}
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">회원 상태 변경</label>
                            <select 
                              value={user.status}
                              onChange={(e) => handleStatusChangeRequest(user.id, e.target.value as UserStatus)}
                              className="p-2 border rounded w-full"
                            >
                              <option value="active">정상</option>
                              <option value="suspended">정지 (관리자 권한)</option>
                              <option value="withdrawn">탈퇴</option>
                            </select>
                          </div>

                          {/* 임시 비번 발송 */}
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">비밀번호 관리</label>
                            <button 
                              onClick={(e) => { e.stopPropagation(); sendTempPassword(user.email); }}
                              className="flex items-center justify-center gap-2 w-full p-2 border border-gray-300 rounded hover:bg-white text-gray-700"
                            >
                              <HiOutlineMail /> 임시 비밀번호 메일 발송
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

        {/* 데이터 없을 때 */}
        {filteredUsers.length === 0 && (
          <div className="p-8 text-center text-gray-500">검색 결과가 없습니다.</div>
        )}
      </div>

      {/* 3. 페이지네이션 */}
      <div className="flex justify-center gap-2">
        <button 
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100"
        >
          이전
        </button>
        <span className="px-3 py-1 text-gray-600">
          {currentPage} / {totalPages || 1}
        </span>
        <button 
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100"
        >
          다음
        </button>
      </div>
      {/* 정지 사유 입력 모달 */}
      {suspendModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 text-red-600">
                <HiOutlineBan className="text-2xl" />
                <h2 className="text-xl font-bold">이용 정지 처리</h2>
              </div>
              <button onClick={() => setSuspendModalOpen(false)} className="text-gray-400 hover:text-dark-gray">
                <HiOutlineX className="text-2xl" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              해당 회원을 정지 상태로 변경합니다. <br/>
              <span className="font-bold">정지 사유</span>를 반드시 입력해주세요.
            </p>

            <textarea
              rows={4}
              placeholder="예: 커뮤니티 내 욕설 사용 (3회 경고 누적)"
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-50"
            />

            <div className="flex justify-end gap-2 mt-6">
              <button 
                onClick={() => setSuspendModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-semibold"
              >
                취소
              </button>
              <button 
                onClick={confirmSuspend}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold"
              >
                정지 확정
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 상태 뱃지 컴포넌트
function StatusBadge({ status }: { status: UserStatus }) {
  const styles = {
    active: 'text-green-600',
    suspended: 'text-red-600',
    withdrawn: 'text-gray-400',
  };
  const labels = {
    active: '정상',
    suspended: '정지',
    withdrawn: '탈퇴',
  };

  return <span className={styles[status]}>{labels[status]}</span>;
}