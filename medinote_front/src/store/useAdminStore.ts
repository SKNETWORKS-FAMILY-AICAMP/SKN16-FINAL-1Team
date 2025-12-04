// src/store/useAdminStore.ts

import { create } from 'zustand';

// --- 타입 정의 ---
export type FeedbackType = 'bug' | 'suggestion' | 'inquiry' | 'other';
export type FeedbackStatus = 'new' | 'in_progress' | 'done';

export interface Feedback {
  id: number;
  user: string;
  type: FeedbackType;
  title: string;
  content: string;
  email?: string;
  replyByEmail: boolean;
  status: FeedbackStatus;
  date: string;
  adminReply?: string;
}

interface AdminState {
  // State
  feedbacks: Feedback[];

  // Actions
  updateFeedbackStatus: (id: number, status: FeedbackStatus) => void;
  addAdminReply: (id: number, reply: string) => void;
}

const useAdminStore = create<AdminState>((set) => ({
  // 1. 초기 데이터 (가상 DB)
  feedbacks: [
    { 
      id: 1, user: '홍길동', type: 'bug', 
      title: '로그인 오류 제보', content: '로그인할 때 가끔 멈춥니다.', 
      email: 'hong@example.com', replyByEmail: true, status: 'new', date: '방금 전' 
    },
    { 
      id: 2, user: '김철수', type: 'suggestion', 
      title: '다크 모드 기능 제안', content: '밤에 눈이 부셔요.', 
      email: '', replyByEmail: false, status: 'in_progress', date: '10분 전' 
    },
    { 
      id: 3, user: '이영희', type: 'inquiry', 
      title: '탈퇴 시 데이터 삭제 문의', content: '복구 가능한가요?', 
      email: 'lee@test.com', replyByEmail: true, status: 'done', date: '1시간 전',
      adminReply: '복구 불가능합니다.'
    },
    { 
      id: 4, user: '박민수', type: 'other', 
      title: '앱 디자인 칭찬', content: '예쁘네요!', 
      email: '', replyByEmail: false, status: 'new', date: '3시간 전' 
    },
    { 
      id: 5, user: '최유리', type: 'bug', 
      title: '이미지 업로드 실패', content: '사진이 안 올라가요.', 
      email: 'choi@test.com', replyByEmail: true, status: 'new', date: '5시간 전' 
    },
  ],

  // 2. 상태 변경 액션
  updateFeedbackStatus: (id, status) => set((state) => ({
    feedbacks: state.feedbacks.map(f => f.id === id ? { ...f, status } : f)
  })),

  // 3. 답변 등록 액션 (답변 달면 자동으로 상태 완료 처리)
  addAdminReply: (id, reply) => set((state) => ({
    feedbacks: state.feedbacks.map(f => 
      f.id === id ? { ...f, adminReply: reply, status: 'done' } : f
    )
  })),
}));

export default useAdminStore;