'use client';

import { Card, AdBanner } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

export function SupportTab() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Chat */}
      <Card>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Поддержка</h1>

        <div className="border border-gray-200 rounded-lg">
          {/* Chat Messages */}
          <div className="h-80 p-4 overflow-y-auto space-y-4">
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                <p className="text-sm text-gray-900">Здравствуйте! Чем могу помочь?</p>
                <p className="text-xs text-gray-500 mt-1">Поддержка • 10:30</p>
              </div>
            </div>
            <div className="flex justify-end">
              <div className="bg-blue-600 text-white rounded-lg p-3 max-w-[80%]">
                <p className="text-sm">Как правильно оформить отчёт о расходах?</p>
                <p className="text-xs text-blue-200 mt-1">Вы • 10:32</p>
              </div>
            </div>
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                <p className="text-sm text-gray-900">
                  Для оформления отчёта о расходах перейдите в раздел «Архив документов» и выберите категорию расходов.
                  Там вы найдёте все необходимые шаблоны и инструкции.
                </p>
                <p className="text-xs text-gray-500 mt-1">Поддержка • 10:35</p>
              </div>
            </div>
          </div>

          {/* Chat Input */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex space-x-3">
              <input
                type="text"
                className="input flex-1"
                placeholder="Введите сообщение..."
              />
              <button className="btn btn-primary">
                <i className="ri-send-plane-line"></i>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Обычно мы отвечаем в течение нескольких часов в рабочее время.
            </p>
          </div>
        </div>
      </Card>

      {/* Contact Info */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Контакты</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <i className="ri-mail-line text-blue-600"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">support@startuphelper.ru</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <i className="ri-phone-line text-green-600"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Телефон</p>
              <p className="font-medium">+7 (999) 123-45-67</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <i className="ri-telegram-line text-purple-600"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Telegram</p>
              <p className="font-medium">@startuphelper_bot</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Additional Services */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Дополнительные услуги</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <i className="ri-user-star-line text-indigo-600"></i>
              </div>
              <h3 className="font-semibold text-gray-900">Персональный консультант</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Индивидуальное сопровождение вашего проекта опытным специалистом
            </p>
            <p className="text-blue-600 font-medium">от 5 000 ₽/мес</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <i className="ri-book-open-line text-amber-600"></i>
              </div>
              <h3 className="font-semibold text-gray-900">Обучающие вебинары</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Регулярные онлайн-занятия по ведению бизнеса и отчётности
            </p>
            <p className="text-blue-600 font-medium">Бесплатно</p>
          </div>
        </div>
      </Card>

      {/* Ad Banner */}
      {!user?.isPremium && <AdBanner variant="default" />}
    </div>
  );
}
