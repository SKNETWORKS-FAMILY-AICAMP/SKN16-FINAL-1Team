// src/pages/Chatbot/ChatbotPage.tsx

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  HiOutlineChatAlt2,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePaperClip,
  HiOutlineMicrophone,
  HiOutlinePaperAirplane,
  HiOutlineX,
} from "react-icons/hi";
import useUserStore from "../../store/useUserStore";
import { toast } from "react-toastify";
import { postChatbotQuery } from "../../api/chatbotAPI";
import { API_BASE_URL } from "../../utils/config";

type Attachment = { name: string; url: string; type: string };
type Msg = {
  id: string;
  sender: "ai" | "user";
  text: string;
  time: string;
  attachments?: Attachment[];
};

type Chat = {
  id: string; 
  sessionId: number; 
  title: string;
  createdAt: string;
  messages: Msg[];
};

export default function ChatbotPage() {
  const userName = useUserStore((s) => s.userName) || "사용자";
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isChatListOpen, setIsChatListOpen] = useState(false);
  const toggleChatList = () => setIsChatListOpen((prev) => !prev);

  // 🔥 새로고침 시 DB에서 이전 대화 모두 불러오기
  useEffect(() => {
    async function loadSessions() {
      try {
        const res = await fetch(`${API_BASE_URL}/chatbot/sessions`);
        const data = await res.json();

        const loadedChats: Chat[] = [];

        for (const s of data.sessions) {
          const detailRes = await fetch(
            `${API_BASE_URL}/chatbot/sessions/${s.session_id}`
          );
          const detailData = await detailRes.json();

          loadedChats.push({
            id: `c_${s.session_id}`,
            sessionId: s.session_id,
            title: s.title,
            createdAt: s.created_at,
            messages: detailData.messages.map((m: any) => ({
              id: `${m.role}_${Math.random()}`,
              sender: m.role === "assistant" ? "ai" : "user",
              text: m.content,
              time: new Date(m.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            })),
          });
        }

        setChats(loadedChats);

        if (loadedChats.length > 0) {
          setCurrentId(loadedChats[0].id);
        }
      } catch (err) {
        console.error("❌ DB에서 채팅 기록 로딩 실패:", err);
      }
    }

    loadSessions();
  }, []);

  const current = useMemo(
    () => chats.find((c) => c.id === currentId) || null,
    [chats, currentId]
  );

  const startNewChat = () => {
    const id = `c_${Date.now()}`;
    const now = new Date();

    const greet: Msg = {
      id: `m_${Date.now()}`,
      sender: "ai",
      text: `안녕하세요, ${userName}님! 무엇을 도와드릴까요?`,
      time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChats((prev) => [
      ...prev,
      {
        id,
        sessionId: 0,
        title: "새 채팅",
        createdAt: now.toISOString().slice(0, 10),
        messages: [greet],
      },
    ]);

    setCurrentId(id);
    setIsChatListOpen(false);
  };

  const updateChat = (id: string, updater: (chat: Chat) => Chat) => {
    setChats((prev) => prev.map((c) => (c.id === id ? updater(c) : c)));
  };

  const deleteChat = (id: string) => {
    setChats((prev) => prev.filter((c) => c.id !== id));

    if (currentId === id) {
      const list = chats.filter((c) => c.id !== id);
      setCurrentId(list[0]?.id || null);
    }
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
        >
          <HiOutlineChatAlt2 className="text-mint text-2xl" />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-dark-gray truncate">
              AI 건강 챗봇
            </h2>
            <p className="text-xs text-gray-500 truncate">
              {current?.title || "채팅 기록 열기"}
            </p>
          </div>
        </button>
      </header>

      <div className="flex bg-white rounded-lg shadow-lg h-[calc(100vh-230px)] relative overflow-hidden">
        <ChatSidebar
          isOpen={isChatListOpen}
          onClose={toggleChatList}
          chats={chats}
          currentId={currentId}
          onSelect={selectChat}
          onNew={startNewChat}
          onDelete={deleteChat}
        />

        <ChatWindow
          chat={current}
          onSend={async (text, attachments) => {
            if (!current) return;

            const now = new Date();
            const timeStr = now.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

            const userMsg: Msg = {
              id: `m_${Date.now()}`,
              sender: "user",
              text,
              time: timeStr,
              attachments,
            };

            updateChat(current.id, (c) => ({
              ...c,
              title:
                c.title === "새 채팅" && text ? text.slice(0, 20) : c.title,
              messages: [...c.messages, userMsg],
            }));

            try {
              const res = await postChatbotQuery({
                session_id: current.sessionId ?? 0,
                query: text,
              });

              const botMsg: Msg = {
                id: `m_${Date.now()}_ai`,
                sender: "ai",
                text: res.answer,
                time: new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              };

              updateChat(current.id, (c) => ({
                ...c,
                sessionId: res.session_id,
                messages: [...c.messages, botMsg],
              }));
            } catch (err: any) {
              console.error(err);
              toast.error(err?.message ?? "챗봇 호출 중 오류가 발생했어요.");
            }
          }}
        />
      </div>
    </div>
  );
}

function ChatSidebar({
  isOpen,
  onClose,
  chats,
  currentId,
  onSelect,
  onNew,
  onDelete,
}: any) {
  return (
    <>
      <div
        className={`absolute inset-0 bg-black/30 z-20 transition-opacity ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <aside
        className={`absolute top-0 left-0 w-64 h-full bg-white z-30 transform transition-transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } border-r border-gray-200 flex flex-col`}
      >
        <div className="p-3">
          <button
            onClick={onNew}
            className="w-full flex items-center justify-center gap-2 p-2 bg-mint/10 hover:bg-mint/20 text-mint font-semibold rounded-lg"
          >
            <HiOutlinePlus /> 새 채팅
          </button>
        </div>

        <h5 className="px-4 pt-2 pb-1 text-xs text-gray-400 font-semibold">
          최근
        </h5>

        <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
          {chats.map((c: Chat) => (
            <div
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={`p-3 rounded-lg cursor-pointer ${
                c.id === currentId ? "bg-gray-100" : "hover:bg-gray-50"
              }`}
            >
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-sm text-dark-gray truncate w-4/5">
                  {c.title}
                </h4>

                <button
                  className="text-gray-400 hover:text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(c.id);
                  }}
                >
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

function ChatWindow({ chat, onSend }: any) {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const messages = chat?.messages || [];

  const send = async () => {
    if (!message.trim() || isRecording || isSending || !chat) return;
    setIsSending(true);

    try {
      await onSend(message.trim(), attachments);
      setMessage("");
      setAttachments([]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="w-full flex flex-col">
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {messages.map((m: Msg) => (
          <MessageBubble key={m.id} sender={m.sender} time={m.time}>
            {m.text}
          </MessageBubble>
        ))}
      </div>

      <div className="p-3 border-t bg-white">
        <div className="flex items-center gap-2 border rounded-lg p-2 bg-gray-50">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-gray-500 hover:text-mint text-xl p-2"
          >
            <HiOutlinePaperClip />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const url = URL.createObjectURL(file);
                setAttachments((prev) => [
                  ...prev,
                  { name: file.name, url, type: file.type },
                ]);
              }
              e.target.value = "";
            }}
          />

          <input
            type="text"
            placeholder="질문을 입력하세요."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 bg-transparent outline-none"
            disabled={isRecording || isSending}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
          />

          <button
            onClick={send}
            className="bg-mint text-white rounded-lg p-2 w-10 h-10 flex justify-center items-center disabled:opacity-50"
            disabled={isSending || isRecording}
          >
            <HiOutlinePaperAirplane className="rotate-90" />
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ sender, time, children }: any) {
  const isAi = sender === "ai";

  return (
    <div className={`flex ${isAi ? "justify-start" : "justify-end"}`}>
      <div className="max-w-xs lg:max-w-md">
        <div
          className={`px-4 py-3 rounded-lg ${
            isAi
              ? "bg-gray-100 text-dark-gray rounded-bl-none"
              : "bg-mint text-white rounded-br-none"
          }`}
        >
          {children}
        </div>
        <p
          className={`text-xs text-gray-400 mt-1 ${
            isAi ? "text-left" : "text-right"
          }`}
        >
          {time}
        </p>
      </div>
    </div>
  );
}

function AttachmentPreview({ att, onRemove }: any) {
  const isImage = att.type.startsWith("image/");

  return (
    <div className="flex items-center gap-2 border rounded px-2 py-1 bg-white">
      {isImage ? (
        <img
          src={att.url}
          alt={att.name}
          className="w-12 h-12 object-cover rounded"
        />
      ) : (
        <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded text-xs text-gray-500">
          FILE
        </div>
      )}

      <span className="text-xs text-gray-600">{att.name}</span>

      <button
        onClick={onRemove}
        className="text-gray-400 hover:text-red-500 p-1 rounded-full"
      >
        <HiOutlineX className="w-3 h-3" />
      </button>
    </div>
  );
}
