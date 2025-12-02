// src/pages/Chatbot/ChatbotPage.tsx

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { HiOutlineChatAlt2, HiOutlinePlus, HiOutlineTrash, HiOutlinePaperClip, HiOutlineMicrophone, HiOutlinePaperAirplane, HiOutlineX } from 'react-icons/hi';
import useUserStore from '../../store/useUserStore';
import { toast } from 'react-toastify';

type Attachment = { name: string; url: string; type: string };
type Msg = { id: string; sender: 'ai' | 'user'; text: string; time: string; attachments?: Attachment[] };
type Chat = { id: string; title: string; createdAt: string; messages: Msg[] };

export default function ChatbotPage() {
  const userName = useUserStore((s) => s.userName) || '사용자';
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isChatListOpen, setIsChatListOpen] = useState(false);
  const toggleChatList = () => setIsChatListOpen(prev => !prev);

  // 초기 진입
  useEffect(() => {
    if (chats.length === 0) {
      const id = `c_${Date.now()}`;
      const now = new Date();
      const greet: Msg = {
        id: `m_${Date.now()}`,
        sender: 'ai',
        text: `안녕하세요, ${userName}님! 무엇을 도와드릴까요?`,
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChats([{ id, title: '새 채팅', createdAt: now.toISOString().slice(0, 10), messages: [greet] }]);
      setCurrentId(id);
    }
  }, [chats.length, userName]);

  const current = useMemo(() => chats.find((c) => c.id === currentId) || null, [chats, currentId]);

  const startNewChat = () => {
    const id = `c_${Date.now()}`;
    const now = new Date();
    const greet: Msg = {
      id: `m_${Date.now()}`,
      sender: 'ai',
      text: `안녕하세요, ${userName}님! 무엇을 도와드릴까요?`,
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChats((prev) => [...prev, { id, title: '새 채팅', createdAt: now.toISOString().slice(0, 10), messages: [greet] }]);
    setCurrentId(id);
    setIsChatListOpen(false);
  };

  const updateChat = (id: string, updater: (chat: Chat) => Chat) => {
    setChats((prev) => prev.map((c) => (c.id === id ? updater(c) : c)));
  };

  const deleteChat = (id: string) => {
    setChats((prev) => prev.filter((c) => c.id !== id));
    if (currentId === id) setCurrentId((prev) => {
      const list = chats.filter((c) => c.id !== id);
      return list[0]?.id || null;
    });
  };

  const selectChat = (id: string) => {
    setCurrentId(id);
    setIsChatListOpen(false);
  };

  return (
    <div className="flex flex-col">
      <header className="w-full bg-mint/10 shadow-sm rounded-lg mb-4">
        <button 
          onClick={toggleChatList}
          className="w-full flex items-center gap-2 p-4 text-left hover:bg-black/5 rounded-lg transition-colors"
          aria-label="채팅 기록 열기/닫기"
        >
          <HiOutlineChatAlt2 className="text-mint text-2xl flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-dark-gray truncate">AI 건강 챗봇</h2>
            <p className="text-xs text-gray-500 truncate">
              {current?.title || '채팅 기록 열기'}
            </p>
          </div>
        </button>
      </header>

      <div className="flex bg-white rounded-lg shadow-lg h-[calc(100vh-230px)] relative overflow-hidden">
        <ChatSidebar isOpen={isChatListOpen} onClose={toggleChatList} chats={chats} currentId={currentId} onSelect={selectChat} onNew={startNewChat} onDelete={deleteChat} />
        <ChatWindow chat={current} onSend={(text, attachments) => {
          if (!current) return;
          const now = new Date();
          updateChat(current.id, (c) => {
            const msg: Msg = { id: `m_${Date.now()}`, sender: 'user', text, time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), attachments };
            const title = c.title === '새 채팅' && text ? text.slice(0, 20) : c.title;
            return { ...c, title, messages: [...c.messages, msg] };
          });
          // 임시 답변
          setTimeout(() => {
            updateChat(current.id, (c) => {
              const bot: Msg = {
                id: `m_${Date.now()}`,
                sender: 'ai',
                text: '어제 처방받은 항생제에 위에 자극을 주는 성분이 있어요. 약을 빈 속에 먹지 말고 식사 후에 충분한 물과 함께 복용하세요. 위 통증이 심하거나 속쓰림, 메스꺼움이 계속된다면 복용을 잠시 중단하고 병원에 꼭 연락하세요.',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              };
              return { ...c, messages: [...c.messages, bot] };
            });
          }, 500);
        }} />
      </div>
    </div>
  );
}

function ChatSidebar({ isOpen, onClose, chats, currentId, onSelect, onNew, onDelete }: { isOpen: boolean; onClose: () => void; chats: Chat[]; currentId: string | null; onSelect: (id: string) => void; onNew: () => void; onDelete: (id: string) => void }) {
  return (
    <>
      <div
        className={`absolute inset-0 bg-black/30 z-20 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* 사이드바 */}
      <aside
        className={`absolute top-0 left-0 w-64 h-full bg-white z-30 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } border-r border-gray-200 flex flex-col`}
      >

        <div className="p-3">
          <button onClick={onNew} className="w-full flex items-center justify-center gap-2 p-2 bg-mint/10 hover:bg-mint/20 text-mint font-semibold rounded-lg whitespace-nowrap overflow-hidden text-ellipsis h-10">
            <HiOutlinePlus /> 새 채팅
          </button>
        </div>
        <h5 className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400"> 최근 </h5>
        <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
          {chats.map((c) => (
            <div 
              key={c.id} 
              onClick={() => onSelect(c.id)}
              className={`p-3 rounded-lg cursor-pointer ${c.id === currentId ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
            >
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-sm text-dark-gray truncate w-4/5">{c.title}</h4>
                <button className="text-gray-400 hover:text-red-500 text-sm" onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}>
                  <HiOutlineTrash />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">{c.createdAt}</p>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}

function ChatWindow({ chat, onSend }: { chat: Chat | null; onSend: (text: string, attachments?: Attachment[]) => void }) {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const handleAudioFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsRecording(true);
    toast.info("음성 녹음 수신됨. 텍스트 변환 중...");

    // (가상) STT API 호출 - 2초 딜레이
    setTimeout(() => {
      setMessage("어제부터 머리가 아프고 속이 좀 메스꺼워요.");
      setIsRecording(false);
      toast.success("음성 변환이 완료되었습니다.");
    }, 2000);

    e.target.value = ''; // input 초기화
  };

  const pickFile = () => fileInputRef.current?.click();
  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAttachments((prev) => [...prev, { name: file.name, url, type: file.type }]);
    }
    e.target.value = '';
  };

  const messages = chat?.messages || [];
  const send = () => {
    if (!message.trim()) return;
    onSend(message.trim(), attachments);
    setMessage('');
    setAttachments([]);
  };

  return (
    <div className="w-full flex flex-col">
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {messages.map((m) => (
          <MessageBubble key={m.id} sender={m.sender} time={m.time}>{m.text}</MessageBubble>
        ))}
        {messages.length === 0 && <p className="text-center text-gray-400">대화를 시작해보세요.</p>}
      </div>

      <div className="p-3 border-t border-gray-200 bg-white">
        {/* 첨부 미리보기 */}
        {attachments.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-2">
            {attachments.map((a, idx) => (
              <AttachmentPreview key={a.url} att={a} onRemove={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))} />
            ))}
          </div>
        )}
        {isRecording && (
          <div className="flex items-center justify-center gap-2 p-2 mb-2 bg-gray-100 rounded-lg">
            <div className="w-4 h-4 border-2 border-mint border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-gray-600">음성 변환 중입니다...</span>
          </div>
        )}
        <div className="flex items-center gap-2 border rounded-lg p-2 bg-gray-50 flex-nowrap">
          <button onClick={pickFile} className="text-gray-500 hover:text-mint text-xl p-2 shrink-0 w-10 h-10 flex items-center justify-center">
            <HiOutlinePaperClip />
          </button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={onFileSelected} />
          <input type="file" id="chatbot-stt-input" accept="audio/*" capture={true} className="hidden"  onChange={handleAudioFileSelected} />
          <input type="text" placeholder="질문을 입력하세요." value={message} onChange={(e) => setMessage(e.target.value)} className="min-w-0 flex-1 bg-transparent focus:outline-none" disabled={isRecording}/>
          <label 
            htmlFor="chatbot-stt-input"
            className={`text-xl p-2 shrink-0 w-10 h-10 flex items-center justify-center rounded-lg ${isRecording ? 'text-gray-400' : 'text-gray-500 hover:text-mint cursor-pointer'}`}
          >
            <HiOutlineMicrophone />
          </label>
          <button 
            onClick={send} 
            className="bg-mint text-white rounded-lg p-2 shrink-0 w-10 h-10 flex items-center justify-center"
            disabled={isRecording} // 로딩 중에는 전송 비활성화
          >
            <HiOutlinePaperAirplane className="transform rotate-90" />
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center pt-2">
          챗봇은 의료진단을 대체할 수 없습니다.
        </p>
      </div>
    </div>
  );
}

type BubbleProps = { sender: 'ai' | 'user'; time: string; children: React.ReactNode };
function MessageBubble({ sender, time, children }: BubbleProps) {
  const isAi = sender === 'ai';
  return (
    <div className={`flex ${isAi ? 'justify-start' : 'justify-end'}`}>
      <div className="max-w-xs lg:max-w-md">
        <div className={`px-4 py-3 rounded-lg ${isAi ? 'bg-gray-100 text-dark-gray rounded-bl-none' : 'bg-mint text-white rounded-br-none'}`}>
          {children}
        </div>
        <p className={`text-xs text-gray-400 mt-1 ${isAi ? 'text-left' : 'text-right'}`}>{time}</p>
      </div>
    </div>
  );
}

function AttachmentPreview({ att, onRemove }: { att: Attachment; onRemove: () => void }) {
  const isImage = att.type.startsWith('image/');
  return (
    <div className="flex items-center gap-2 border rounded px-2 py-1 bg-white">
      {isImage ? (
        <img src={att.url} alt={att.name} className="w-12 h-12 object-cover rounded" />
      ) : (
        <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded text-xs text-gray-500">FILE</div>
      )}
      <span className="text-xs text-gray-600 max-w-[140px] truncate">{att.name}</span>
      <button onClick={onRemove} className="text-gray-400 hover:text-red-500 p-1 rounded-full">
        <HiOutlineX className="w-3 h-3" />
      </button>
    </div>
  );
}
