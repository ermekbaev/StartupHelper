'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface AttachedFile {
  name: string;
  type: string;
  data: string;
  previewUrl?: string;
}

interface AiMessage {
  id: string;
  text: string;
  role: 'user' | 'assistant';
  fileName?: string;
}

const SUGGESTIONS = [
  'Как привлечь первых клиентов?',
  'Как составить финансовый отчёт по гранту?',
  'Как нанять первого сотрудника?',
  'Как найти инвестора для стартапа?',
  'Что такое MVP и как его запустить?',
  'Как снизить налоговую нагрузку?',
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
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function AiAssistantTab() {
  const { token } = useAuth();
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('Файл слишком большой. Максимальный размер — 10 МБ.');
      return;
    }
    const base64 = await readFileAsBase64(file);
    setAttachedFile({
      name: file.name,
      type: file.type,
      data: base64,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    });
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

    setMessages(prev => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        text: messageText || `[Файл: ${fileToSend?.name}]`,
        role: 'user',
        fileName: fileToSend && messageText ? fileToSend.name : undefined,
      },
    ]);

    try {
      const body: Record<string, unknown> = { message: messageText || 'Проанализируй этот файл.' };
      if (fileToSend) {
        body.file = { name: fileToSend.name, type: fileToSend.type, data: fileToSend.data };
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
      }
    } catch (err) {
      console.error('AI tab error:', err);
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
    <div className="flex flex-col h-[calc(100vh-160px)] min-h-[500px]">

      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <i className="ri-sparkling-2-line text-violet-600 text-xl"></i>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Личный ИИ Помощник</h1>
            <p className="text-sm text-gray-500">Стратегия, финансы, кадры, документы — спросите что угодно</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 transition px-3 py-1.5 rounded-lg hover:bg-red-50"
          >
            <i className="ri-delete-bin-line"></i>
            Очистить
          </button>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">

        {/* Messages */}
        <div
          ref={messagesRef}
          className="flex-1 overflow-y-auto p-6 space-y-4"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#e5e7eb transparent' }}
        >
          {messages.length === 0 && !isSending ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center mb-4">
                <i className="ri-sparkling-2-line text-violet-600 text-3xl"></i>
              </div>
              <p className="font-semibold text-gray-800 text-lg mb-2">Чем могу помочь?</p>
              <p className="text-sm text-gray-400 mb-8 max-w-md">
                Задайте вопрос о бизнесе, загрузите документ для анализа или выберите тему ниже
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl">
                {SUGGESTIONS.map(q => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    className="text-left text-sm px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 transition"
                  >
                    <i className="ri-arrow-right-s-line mr-1.5 text-gray-400"></i>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-3`}
                >
                  {/* AI avatar */}
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0 mb-0.5">
                      <i className="ri-sparkling-2-line text-violet-600 text-sm"></i>
                    </div>
                  )}

                  {/* Bubble */}
                  <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[70%]`}>
                    {msg.fileName && (
                      <div className="flex items-center gap-1 text-xs text-violet-400 mb-1 px-1">
                        <i className="ri-attachment-2 text-xs"></i>
                        <span className="truncate max-w-[200px]">{msg.fileName}</span>
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-violet-600 text-white rounded-br-sm'
                          : 'bg-gray-50 text-gray-800 rounded-bl-sm border border-gray-200'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  </div>

                  {/* User avatar */}
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0 mb-0.5">
                      <i className="ri-user-line text-violet-600 text-sm"></i>
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {isSending && (
                <div className="flex justify-start items-end gap-3">
                  <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <i className="ri-sparkling-2-line text-violet-600 text-sm"></i>
                  </div>
                  <div className="bg-gray-50 rounded-2xl rounded-bl-sm px-4 py-3 border border-gray-200">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '120ms' }}></div>
                      <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '240ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Input area */}
        <div className="flex-shrink-0 p-4 border-t border-gray-100 bg-white">
          {/* File preview */}
          {attachedFile && (
            <div className="flex items-center gap-2 mb-3 p-2 bg-violet-50 border border-violet-200 rounded-xl">
              {attachedFile.previewUrl ? (
                <img
                  src={attachedFile.previewUrl}
                  alt={attachedFile.name}
                  className="w-10 h-10 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-white border border-violet-200 flex items-center justify-center flex-shrink-0">
                  <i className={`${getFileIcon(attachedFile.type, attachedFile.name)} text-violet-500 text-lg`}></i>
                </div>
              )}
              <span className="text-sm text-gray-600 truncate flex-1">{attachedFile.name}</span>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition flex-shrink-0"
              >
                <i className="ri-close-line text-sm"></i>
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-violet-300 focus-within:border-violet-300 transition">
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
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-violet-600 hover:bg-violet-100 transition disabled:opacity-40 flex-shrink-0"
                title="Прикрепить файл (PDF, DOCX, XLSX, CSV — до 10 МБ)"
              >
                <i className="ri-attachment-2 text-lg"></i>
              </button>

              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent text-sm outline-none py-2 text-gray-700 placeholder:text-gray-400"
                placeholder={attachedFile ? 'Задайте вопрос по файлу...' : 'Задайте вопрос о бизнесе, финансах, кадрах...'}
                disabled={isSending}
                autoFocus
              />

              <button
                type="submit"
                disabled={isSending || (!input.trim() && !attachedFile)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                <i className="ri-send-plane-fill text-sm"></i>
                Отправить
              </button>
            </div>
            <p className="text-[11px] text-gray-400 text-center mt-2">
              ИИ может ошибаться — проверяйте важную информацию
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
