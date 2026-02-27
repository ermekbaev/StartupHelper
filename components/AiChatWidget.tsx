'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface AttachedFile {
  name: string;
  type: string;
  data: string; // base64
  previewUrl?: string; // for images
}

interface AiMessage {
  id: string;
  text: string;
  role: 'user' | 'assistant';
  fileName?: string; // if message had an attached file
}

const SUGGESTIONS = [
  'Как привлечь первых клиентов?',
  'Как составить финансовый план?',
  'Как нанять первого сотрудника?',
  'Что такое MVP и как его запустить?',
];

const ACCEPTED_TYPES = 'application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv';

function getFileIcon(type: string, name: string): string {
  if (type.startsWith('image/')) return 'ri-image-line';
  if (type === 'application/pdf' || name.endsWith('.pdf')) return 'ri-file-pdf-line';
  if (name.endsWith('.docx') || name.endsWith('.doc')) return 'ri-file-word-line';
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) return 'ri-file-excel-line';
  if (name.endsWith('.csv')) return 'ri-file-chart-line';
  return 'ri-file-line';
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // strip "data:...;base64," prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function AiChatWidget() {
  const { token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Файл слишком большой. Максимальный размер — 10 МБ.');
      return;
    }

    const base64 = await readFileAsBase64(file);
    const isImage = file.type.startsWith('image/');

    setAttachedFile({
      name: file.name,
      type: file.type,
      data: base64,
      previewUrl: isImage ? URL.createObjectURL(file) : undefined,
    });

    // reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleRemoveFile = () => {
    if (attachedFile?.previewUrl) URL.revokeObjectURL(attachedFile.previewUrl);
    setAttachedFile(null);
  };

  const handleSend = async (text?: string) => {
    const messageText = (text ?? input).trim();
    if (!token || (!messageText && !attachedFile) || isSending) return;

    const fileToSend = attachedFile;
    setInput('');
    setAttachedFile(null);
    setIsSending(true);

    const displayText = messageText || `[Файл: ${fileToSend?.name}]`;

    setMessages(prev => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        text: displayText,
        role: 'user',
        fileName: fileToSend && messageText ? fileToSend.name : undefined,
      },
    ]);

    try {
      const body: Record<string, unknown> = { message: messageText || 'Проанализируй этот файл.' };
      if (fileToSend) {
        body.file = {
          name: fileToSend.name,
          type: fileToSend.type,
          data: fileToSend.data,
        };
      }

      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [
          ...prev,
          { id: `ai-${Date.now()}`, text: data.reply, role: 'assistant' },
        ]);
        if (!isOpen) setHasUnread(true);
      }
    } catch (err) {
      console.error('AI widget error:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-4 sm:right-6 z-[60] flex flex-col items-end select-none">

      {/* ── Chat Window ── */}
      {isOpen && (
        <div
          className={`
            animate-slide-up mb-4 flex flex-col overflow-hidden
            rounded-2xl border border-gray-200 bg-white
            shadow-xl
            transition-[width,height] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
            ${isExpanded
              ? 'w-[min(480px,calc(100vw-2rem))] h-[min(640px,88vh)]'
              : 'w-[min(350px,calc(100vw-2rem))] h-[480px]'
            }
          `}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0 bg-violet-600">
            <div className="flex items-center space-x-3">
              {/* Avatar */}
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-violet-500 flex items-center justify-center">
                  <i className="ri-chat-smile-3-fill text-white text-lg"></i>
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 border-2 border-violet-600 rounded-full"></span>
              </div>
              <div>
                <p className="font-semibold text-white text-sm leading-none">ИИ Помощник</p>
                <p className="text-violet-200 text-[10px] mt-0.5">Онлайн · готов помочь</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-0.5">
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-violet-200 hover:text-white hover:bg-violet-500 transition"
                  title="Очистить чат"
                >
                  <i className="ri-delete-bin-line text-sm"></i>
                </button>
              )}
              <button
                onClick={() => setIsExpanded(prev => !prev)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-violet-200 hover:text-white hover:bg-violet-500 transition"
                title={isExpanded ? 'Уменьшить' : 'Развернуть'}
              >
                <i className={`text-sm ${isExpanded ? 'ri-collapse-diagonal-line' : 'ri-expand-diagonal-line'}`}></i>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-violet-200 hover:text-white hover:bg-violet-500 transition"
                title="Свернуть"
              >
                <i className="ri-subtract-line text-base"></i>
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div
            ref={messagesRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#e5e7eb transparent' }}
          >
            {messages.length === 0 && !isSending ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center h-full text-center px-3 py-4">
                <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center mb-4">
                  <i className="ri-chat-smile-3-fill text-violet-600 text-2xl"></i>
                </div>
                <p className="font-semibold text-gray-800 text-sm mb-1">Привет! Я ИИ Помощник</p>
                <p className="text-xs text-gray-400 leading-relaxed mb-5 max-w-[220px]">
                  Спрошу, отвечу, помогу — о стратегии, финансах, найме и любом аспекте вашего бизнеса
                </p>
                <div className="space-y-2 w-full">
                  {SUGGESTIONS.map(q => (
                    <button
                      key={q}
                      onClick={() => handleSend(q)}
                      className="w-full text-left text-xs px-3 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 transition"
                    >
                      <i className="ri-arrow-right-s-line mr-1.5 text-gray-400"></i>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => (
                  <div
                    key={msg.id}
                    className={`animate-msg-in flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}
                    style={{ animationDelay: `${idx * 0.03}s` }}
                  >
                    {/* AI avatar */}
                    {msg.role === 'assistant' && (
                      <div className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0 mb-0.5">
                        <i className="ri-chat-smile-3-fill text-violet-600 text-[11px]"></i>
                      </div>
                    )}

                    {/* Bubble */}
                    <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[78%]`}>
                      {/* File badge in message */}
                      {msg.fileName && (
                        <div className="flex items-center gap-1 text-[10px] text-violet-300 mb-1 px-1">
                          <i className="ri-attachment-2 text-[10px]"></i>
                          <span className="truncate max-w-[160px]">{msg.fileName}</span>
                        </div>
                      )}
                      <div
                        className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-violet-600 text-white rounded-br-sm'
                            : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100 shadow-sm'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>

                    {/* User avatar */}
                    {msg.role === 'user' && (
                      <div className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0 mb-0.5">
                        <i className="ri-user-line text-violet-600 text-[10px]"></i>
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing indicator */}
                {isSending && (
                  <div className="flex justify-start items-end gap-2">
                    <div className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <i className="ri-chat-smile-3-fill text-violet-600 text-[11px]"></i>
                    </div>
                    <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 border border-gray-100 shadow-sm">
                      <div className="flex items-center space-x-1">
                        <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '120ms' }}></div>
                        <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '240ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="flex-shrink-0 px-3 py-3 bg-white border-t border-gray-100"
          >
            {/* File preview */}
            {attachedFile && (
              <div className="flex items-center gap-2 mb-2 px-1">
                {attachedFile.previewUrl ? (
                  <img
                    src={attachedFile.previewUrl}
                    alt={attachedFile.name}
                    className="w-10 h-10 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-violet-50 border border-violet-200 flex items-center justify-center flex-shrink-0">
                    <i className={`${getFileIcon(attachedFile.type, attachedFile.name)} text-violet-500 text-base`}></i>
                  </div>
                )}
                <span className="text-xs text-gray-600 truncate flex-1">{attachedFile.name}</span>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="w-5 h-5 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition flex-shrink-0"
                >
                  <i className="ri-close-line text-xs"></i>
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-violet-300 transition">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES}
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Attach button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSending}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-violet-600 hover:bg-violet-100 transition disabled:opacity-40 flex-shrink-0"
                title="Прикрепить файл (PDF, DOCX, XLSX, CSV)"
              >
                <i className="ri-attachment-2 text-base"></i>
              </button>

              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent text-sm outline-none py-1.5 text-gray-700 placeholder:text-gray-400"
                placeholder={attachedFile ? 'Задайте вопрос по файлу...' : 'Задайте вопрос...'}
                disabled={isSending}
              />
              <button
                type="submit"
                disabled={isSending || (!input.trim() && !attachedFile)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0 transition disabled:opacity-40 disabled:cursor-not-allowed bg-violet-600 hover:bg-violet-700"
              >
                <i className="ri-send-plane-fill text-sm"></i>
              </button>
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-2">
              ИИ может ошибаться — проверяйте важную информацию
            </p>
          </form>
        </div>
      )}

      {/* ── Floating Button ── */}
      <div className="relative">
        {/* Unread dot */}
        {hasUnread && !isOpen && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full z-10 animate-pulse"></span>
        )}

        {/* Message count badge */}
        {!isOpen && messages.length > 0 && !hasUnread && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-violet-600 rounded-full flex items-center justify-center z-10 border-2 border-white">
            {messages.length}
          </span>
        )}

        <button
          onClick={() => setIsOpen(prev => !prev)}
          className={`
            w-14 h-14 rounded-2xl flex items-center justify-center
            shadow-lg transition-all duration-200 hover:scale-105 active:scale-95
            ${isOpen ? 'bg-gray-600 hover:bg-gray-700' : 'bg-violet-600 hover:bg-violet-700'}
          `}
          title={isOpen ? 'Свернуть' : 'ИИ Помощник'}
        >
          <i
            className={`text-white text-xl transition-all duration-200 ${
              isOpen ? 'ri-close-line' : 'ri-chat-smile-3-fill'
            }`}
          ></i>
        </button>
      </div>
    </div>
  );
}
