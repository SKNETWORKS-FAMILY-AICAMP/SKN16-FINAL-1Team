// src/pages/Chatbot/ChatbotPage.tsx

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  HiOutlineChatAlt2,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePaperClip,
  HiOutlinePaperAirplane,
  HiOutlineX,
} from "react-icons/hi";
import { toast } from "react-toastify";
import {
  deleteOneChatbotSession,
  getChatbotSessionDetail,
  getChatbotSessions,
  postChatbotQuery,
} from "../../api/chatbotAPI";
import useUserStore from "../../store/useUserStore";

type Attachment = { name: string; url: string; type: string };

type Source = {
  id: string;
  collection: string;
  title?: string | null;
  url?: string | null;
  score?: number | null;
};

type Msg = {
  id: string;
  sender: "ai" | "user";
  text: string;
  time: string;
  attachments?: Attachment[];
  sources?: Source[];
};

type Chat = {
  id: string;
  sessionId: number;
  title: string;
  createdAt: string;
  messages: Msg[];
};

type ChatSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  chats: Chat[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
};

type ChatWindowProps = {
  chat: Chat | null;
  onSend: (text: string, attachments: Attachment[]) => Promise<void> | void;
};

type MessageBubbleProps = {
  sender: Msg["sender"];
  time: string;
  text: string;
  attachments?: Attachment[];
  sources?: Source[];
};

type AttachmentPreviewProps = {
  att: Attachment;
  onRemove: () => void;
};

export default function ChatbotPage() {
  const userName = useUserStore((s) => s.user?.name) ?? "사용자";
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isChatListOpen, setIsChatListOpen] = useState(false);
  const toggleChatList = () => setIsChatListOpen((prev) => !prev);

  function startNewChat() {
    const now = new Date();
    const id = `new_${now.getTime()}`;

    const greet: Msg = {
      id: `m_${now.getTime()}`,
      sender: "ai",
      text: `${userName}님, 무엇을 도와드릴까요?`,
      time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChats((prev) => [
      {
        id,
        sessionId: 0,
        title: "새 대화",
        createdAt: now.toISOString().slice(0, 10),
        messages: [greet],
      },
      ...prev,
    ]);

    setCurrentId(id);
    setIsChatListOpen(false);
  }

  // 세션 목록 + 상세 불러오기
  useEffect(() => {
    async function loadSessions() {
      try {
        const { sessions } = await getChatbotSessions();

        if (!sessions || sessions.length === 0) {
          startNewChat();
          return;
        }

        const loadedChats: Chat[] = await Promise.all(
          sessions.map(async (session: any) => {
            try {
              const detail = await getChatbotSessionDetail(session.session_id);

              return {
                id: `c_${session.session_id}`,
                sessionId: session.session_id,
                title: session.title,
                createdAt: new Date(session.created_at).toLocaleDateString(),
                messages: detail.messages.map(
                  (
                    m: {
                      role: string;
                      content: string;
                      created_at: string;
                      sources?: Source[];
                    },
                    idx: number
                  ) => ({
                    id: `${session.session_id}_${idx}_${m.role}`,
                    sender: m.role === "assistant" ? "ai" : "user",
                    text: m.content,
                    time: new Date(m.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                    sources: m.sources ?? [],
                  })
                ),
              };
            } catch (error) {
              console.error("Failed to load session detail:", error);
              return {
                id: `c_${session.session_id}`,
                sessionId: session.session_id,
                title: session.title,
                createdAt: new Date(session.created_at).toLocaleDateString(),
                messages: [],
              };
            }
          })
        );

        setChats(loadedChats);

        if (loadedChats.length > 0) {
          setCurrentId((prev) => prev ?? loadedChats[0].id);
        }
      } catch (err) {
        console.error("Failed to load chat history:", err);
        toast.error("채팅 기록을 불러오지 못했습니다. 다시 시도해 주세요.");
        startNewChat();
      }
    }

    void loadSessions();
  }, []);

  const current = useMemo(
    () => chats.find((c) => c.id === currentId) || null,
    [chats, currentId]
  );

  const updateChat = (id: string, updater: (chat: Chat) => Chat) => {
    setChats((prev) => prev.map((c) => (c.id === id ? updater(c) : c)));
  };

  const deleteChat = async (id: string) => {
    const target = chats.find((c) => c.id === id);
    if (!target) return;

    if (target.sessionId) {
      try {
        await deleteOneChatbotSession(target.sessionId);
      } catch (err: any) {
        console.error(err);
        toast.error(
          err?.response?.data?.detail ??
            "채팅 세션을 삭제하지 못했습니다. 다시 시도해 주세요."
        );
        return;
      }
    }

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
      {/* 상단 헤더 */}
      <header className="w-full bg-mint/10 shadow-sm rounded-lg mb-4">
        <button
          onClick={toggleChatList}
          className="w-full flex items-center gap-2 p-4 text-left hover:bg-black/5 rounded-lg transition-colors"
        >
          <HiOutlineChatAlt2 className="text-mint text-2xl" />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-dark-gray truncate">
              {current?.title || "새 대화"}
            </h2>
          </div>
        </button>
      </header>

      <div className="flex bg-white rounded-lg shadow-lg h-[calc(100vh-180px)] relative overflow-hidden">
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
              id: `m_${now.getTime()}`,
              sender: "user",
              text,
              time: timeStr,
              attachments,
            };

            updateChat(current.id, (c) => ({
              ...c,
              title:
                c.title === "새 대화" && text ? text.slice(0, 20) : c.title,
              messages: [...c.messages, userMsg],
            }));

            try {
              const res: any = await postChatbotQuery({
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
                sources: res.sources ?? [],
              };

              const nextId = `c_${res.session_id}`;

              setChats((prev) =>
                prev.map((c) => {
                  if (c.id !== current.id) return c;
                  return {
                    ...c,
                    id: nextId,
                    sessionId: res.session_id,
                    messages: [...c.messages, botMsg],
                  };
                })
              );
              setCurrentId(nextId);
            } catch (err: any) {
              console.error(err);
              toast.error(
                err?.message ??
                  "챗봇 응답을 가져오지 못했습니다. 다시 시도해 주세요."
              );
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
}: ChatSidebarProps) {
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
            <HiOutlinePlus /> 새 대화
          </button>
        </div>

        <h5 className="px-4 pt-2 pb-1 text-xs text-gray-400 font-semibold">
          최근 대화
        </h5>

        <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
          {chats.map((c) => (
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
                  aria-label="대화 삭제"
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

function ChatWindow({ chat, onSend }: ChatWindowProps) {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [isSending, setIsSending] = useState(false);

  const messages = chat?.messages || [];

  // 메시지가 추가되면 맨 아래로 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!message.trim() || isSending || !chat) return;
    setIsSending(true);

    try {
      await onSend(message.trim(), attachments);
      setMessage("");
      setAttachments([]);
    } finally {
      setIsSending(false);
    }
  };

  const isInputDisabled = isSending || !chat;

  return (
    <div className="w-full flex flex-col">
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-sm text-gray-400">
            메시지를 입력해서 대화를 시작해 보세요.
          </p>
        ) : (
          messages.map((m) => (
            <MessageBubble
              key={m.id}
              sender={m.sender}
              time={m.time}
              text={m.text}
              attachments={m.attachments}
              sources={m.sources}
            />
          ))
        )}
        {/* 스크롤 타겟 */}
        <div ref={messagesEndRef} />
      </div>

      {attachments.length > 0 ? (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {attachments.map((att, idx) => (
            <AttachmentPreview
              key={`${att.url}-${idx}`}
              att={att}
              onRemove={() =>
                setAttachments((prev) =>
                  prev.filter((_, attIdx) => attIdx !== idx)
                )
              }
            />
          ))}
        </div>
      ) : null}

      <div className="p-3 bg-white">
        <div className="flex items-center gap-2 border rounded-lg p-2 bg-gray-50">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-gray-500 hover:text-mint text-xl p-2"
            disabled={isInputDisabled}
            aria-label="파일 첨부"
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
            placeholder="질문을 입력해 주세요"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 bg-transparent outline-none"
            disabled={isInputDisabled}
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
            disabled={isInputDisabled}
            aria-label="메시지 전송"
          >
            <HiOutlinePaperAirplane className="rotate-90" />
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  sender,
  time,
  text,
  attachments,
  sources,
}: MessageBubbleProps) {
  const isAi = sender === "ai";
  const [showSources, setShowSources] = useState(false);

  return (
    <div className={`flex ${isAi ? "justify-start" : "justify-end"}`}>
      <div className="max-w-xs lg:max-w-md">
        <div
          className={`px-4 py-3 rounded-lg whitespace-pre-wrap ${
            isAi
              ? "bg-gray-100 text-dark-gray rounded-bl-none"
              : "bg-mint text-white rounded-br-none"
          }`}
        >
          {text}

          {attachments && attachments.length > 0 ? (
            <div className="mt-2 space-y-1">
              {attachments.map((att) => (
                <a
                  key={att.url}
                  href={att.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`text-xs underline break-all ${
                    isAi ? "text-dark-gray" : "text-white"
                  }`}
                >
                  {att.name}
                </a>
              ))}
            </div>
          ) : null}

          {/* 🔥 '출처' 알약 버튼 */}
          {isAi && sources && sources.length > 0 && (
            <div className="mt-3">
              <button
                onClick={() => setShowSources((p) => !p)}
                className="inline-flex items-center gap-1 text-[11px] px-3 py-1 rounded-full bg-gray-900 text-white border border-gray-900 shadow-sm hover:bg-black transition-colors"
              >
                출처
                <span className="text-[9px]">
                  {showSources ? "▲" : "▼"}
                </span>
              </button>

              {/* 🔍 출처 목록 (토글로 펼침) */}
              {showSources && (
                <div className="mt-2 rounded-lg bg-white/95 border border-gray-200 p-2">
                  <ul className="space-y-1">
                    {sources.map((s, idx) => (
                      <li
                        key={s.id || idx}
                        className="text-[11px] flex flex-wrap items-center gap-x-1"
                      >
                        {s.url ? (
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-mint underline"
                          >
                            {s.title || s.url}
                          </a>
                        ) : (
                          <span className="text-gray-600">
                            {s.title || s.id}
                          </span>
                        )}

                        {typeof s.score === "number" && (
                          <span className="text-[10px] text-gray-400">
                            · score {s.score.toFixed(2)}
                          </span>
                        )}

                        <span className="text-[10px] text-gray-400">
                          ({s.collection})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
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

function AttachmentPreview({ att, onRemove }: AttachmentPreviewProps) {
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
          파일
        </div>
      )}

      <span className="text-xs text-gray-600">{att.name}</span>

      <button
        onClick={onRemove}
        className="text-gray-400 hover:text-red-500 p-1 rounded-full"
        aria-label="첨부 파일 제거"
      >
        <HiOutlineX className="w-3 h-3" />
      </button>
    </div>
  );
}
