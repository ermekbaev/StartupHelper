'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, AdBanner } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  text: string;
  sender: 'USER' | 'SUPPORT';
  createdAt: string;
}

export function SupportTab() {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    if (!token) return;

    try {
      const response = await fetch('/api/support', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [token]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!token || !inputText.trim() || isSending) return;

    setIsSending(true);
    const messageText = inputText.trim();
    setInputText('');

    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      text: messageText,
      sender: 'USER',
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMessage]);

    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: messageText }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => {
          const filtered = prev.filter(m => m.id !== tempUserMessage.id);
          return [...filtered, data.userMessage, data.supportMessage];
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id));
    } finally {
      setIsSending(false);
    }
  };

  const handleClearChat = async () => {
    if (!token || !confirm('Очистить историю чата?')) return;

    try {
      const response = await fetch('/api/support', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error clearing chat:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Сегодня';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Вчера';
    }
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  };

  const groupedMessages = messages.reduce((groups, message) => {
    const dateKey = new Date(message.createdAt).toDateString();
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* AI Assistant hint banner */}
      <div className="flex items-center space-x-3 bg-violet-50 border border-violet-200 rounded-xl px-4 py-3">
        <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center flex-shrink-0">
          <i className="ri-robot-2-line text-violet-600 text-sm"></i>
        </div>
        <p className="text-sm text-violet-700">
          Нужен совет по бизнесу? Используйте{' '}
          <span className="font-semibold">ИИ Помощника</span> — кнопка в правом нижнем углу экрана.
        </p>
      </div>

      {/* Support Chat (preset answers) */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Техническая поддержка</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Ответы на типовые вопросы по платформе</p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="text-gray-500 hover:text-red-600 text-sm flex items-center space-x-1"
            >
              <i className="ri-delete-bin-line"></i>
              <span>Очистить чат</span>
            </button>
          )}
        </div>

        <div className="border border-gray-200 rounded-lg">
          {/* Chat Messages */}
          <div ref={chatContainerRef} className="h-80 sm:h-96 p-3 sm:p-4 overflow-y-auto space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                  <i className="ri-customer-service-2-line text-2xl sm:text-3xl text-gray-400"></i>
                </div>
                <p className="font-medium mb-1 text-sm sm:text-base">Задайте вопрос</p>
                <p className="text-xs sm:text-sm text-center px-4">Наш помощник ответит на вопросы о работе платформы</p>
              </div>
            ) : (
              <>
                {Object.entries(groupedMessages).map(([dateKey, dateMessages]) => (
                  <div key={dateKey}>
                    <div className="flex justify-center mb-3 sm:mb-4">
                      <span className="text-[10px] sm:text-xs text-gray-500 bg-gray-100 px-2 sm:px-3 py-1 rounded-full">
                        {formatDate(dateMessages[0].createdAt)}
                      </span>
                    </div>
                    <div className="space-y-3 sm:space-y-4">
                      {dateMessages.map(message => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender === 'USER' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`rounded-lg p-2.5 sm:p-3 max-w-[85%] sm:max-w-[80%] ${
                              message.sender === 'USER'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100'
                            }`}
                          >
                            <p className={`text-sm ${message.sender === 'USER' ? '' : 'text-gray-900'}`}>
                              {message.text}
                            </p>
                            <p
                              className={`text-[10px] sm:text-xs mt-1 ${
                                message.sender === 'USER' ? 'text-blue-200' : 'text-gray-500'
                              }`}
                            >
                              {message.sender === 'USER' ? 'Вы' : 'Поддержка'} • {formatTime(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-3 sm:p-4">
            <div className="flex space-x-2 sm:space-x-3">
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                className="input flex-1 text-sm sm:text-base"
                placeholder="Введите сообщение..."
                disabled={isSending}
              />
              <button
                type="submit"
                disabled={isSending || !inputText.trim()}
                className="btn btn-primary px-3 sm:px-4 disabled:opacity-50"
              >
                {isSending ? (
                  <i className="ri-loader-4-line animate-spin"></i>
                ) : (
                  <i className="ri-send-plane-line"></i>
                )}
              </button>
            </div>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-2">
              Ответы на типовые вопросы о платформе. По сложным вопросам обратитесь к специалистам по контактам ниже.
            </p>
          </form>
        </div>
      </Card>

      {/* Quick Questions */}
      <Card>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Частые вопросы</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          {[
            'Как оформить отчёт о расходах?',
            'Как добавить нового сотрудника?',
            'Где найти шаблоны документов?',
            'Как работает календарь напоминаний?',
          ].map((question, idx) => (
            <button
              key={idx}
              onClick={() => setInputText(question)}
              className="text-left p-2.5 sm:p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition text-xs sm:text-sm text-gray-700"
            >
              <i className="ri-question-line text-blue-600 mr-1.5 sm:mr-2"></i>
              {question}
            </button>
          ))}
        </div>
      </Card>

      {/* Contact Info */}
      <Card>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Контакты</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="flex items-center space-x-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <i className="ri-mail-line text-blue-600 text-sm sm:text-base"></i>
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-600">Email</p>
              <p className="font-medium text-sm sm:text-base truncate">digital.co@yandex.ru</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <i className="ri-phone-line text-green-600 text-sm sm:text-base"></i>
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-600">Телефон</p>
              <p className="font-medium text-sm sm:text-base">+7 987 432-44-46</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <i className="ri-telegram-line text-purple-600 text-sm sm:text-base"></i>
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-600">Telegram</p>
              <p className="font-medium text-sm sm:text-base">@urstartupru</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Additional Services */}
      <Card>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Дополнительные услуги</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition cursor-pointer">
            <div className="flex items-center space-x-3 mb-2 sm:mb-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="ri-user-star-line text-indigo-600 text-sm sm:text-base"></i>
              </div>
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Персональный консультант</h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
              Индивидуальное сопровождение вашего проекта опытным специалистом
            </p>
            <p className="text-blue-600 font-medium text-sm sm:text-base">от 5 000 ₽/мес</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition cursor-pointer">
            <div className="flex items-center space-x-3 mb-2 sm:mb-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="ri-book-open-line text-amber-600 text-sm sm:text-base"></i>
              </div>
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Обучающие вебинары</h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
              Регулярные онлайн-занятия по ведению бизнеса и отчётности
            </p>
            <p className="text-blue-600 font-medium text-sm sm:text-base">Бесплатно</p>
          </div>
        </div>
      </Card>

      {/* Ad Banner */}
      {!user?.isPremium && <AdBanner variant="default" />}
    </div>
  );
}
