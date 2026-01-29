'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import type { UserProfile, ReportDate } from '@/hooks/useDemoStore';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSave: (profile: UserProfile) => Promise<void>;
  isPremium?: boolean;
  onTogglePremium?: (value: boolean) => Promise<void>;
}

export function ProfileModal({ isOpen, onClose, profile, onSave, isPremium = false, onTogglePremium }: ProfileModalProps) {
  const [premiumLoading, setPremiumLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [reportDates, setReportDates] = useState<ReportDate[]>(profile.reportDates || []);

  // Синхронизация при открытии модалки
  useEffect(() => {
    if (isOpen) {
      setReportDates(profile.reportDates || []);
    }
  }, [isOpen, profile.reportDates]);

  const addReportDate = () => {
    setReportDates(prev => [...prev, { title: '', date: '' }]);
  };

  const updateReportDate = (index: number, field: 'title' | 'date', value: string) => {
    setReportDates(prev => prev.map((rd, i) => i === index ? { ...rd, [field]: value } : rd));
  };

  const removeReportDate = (index: number) => {
    setReportDates(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    const formData = new FormData(e.currentTarget);

    // Фильтруем только заполненные даты отчётности
    const validReportDates = reportDates.filter(rd => rd.title && rd.date);

    try {
      await onSave({
        name: formData.get('name') as string,
        projectName: formData.get('projectName') as string,
        grantAmount: Number(formData.get('grantAmount')),
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        inn: formData.get('inn') as string,
        ogrn: formData.get('ogrn') as string,
        reportDates: validReportDates,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePremium = async () => {
    if (!onTogglePremium) return;
    setPremiumLoading(true);
    try {
      await onTogglePremium(!isPremium);
    } finally {
      setPremiumLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Профиль" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">ФИО</label>
            <input
              name="name"
              type="text"
              defaultValue={profile.name}
              required
              className="input"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Название проекта</label>
            <input
              name="projectName"
              type="text"
              defaultValue={profile.projectName}
              required
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              name="email"
              type="email"
              defaultValue={profile.email}
              required
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
            <input
              name="phone"
              type="tel"
              defaultValue={profile.phone}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ИНН</label>
            <input
              name="inn"
              type="text"
              defaultValue={profile.inn}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ОГРН</label>
            <input
              name="ogrn"
              type="text"
              defaultValue={profile.ogrn}
              className="input"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Сумма гранта (₽)</label>
            <input
              name="grantAmount"
              type="number"
              defaultValue={profile.grantAmount}
              required
              className="input"
            />
          </div>

          {/* Даты отчётности */}
          <div className="col-span-2">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Этапы отчётности</label>
              <button
                type="button"
                onClick={addReportDate}
                className="text-blue-600 text-sm font-medium hover:text-blue-700 flex items-center"
              >
                <i className="ri-add-line mr-1"></i>
                Добавить
              </button>
            </div>

            {reportDates.length === 0 ? (
              <p className="text-sm text-gray-500 py-2">Нет этапов отчётности</p>
            ) : (
              <div className="space-y-2">
                {reportDates.map((rd, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <input
                      type="text"
                      value={rd.title}
                      onChange={(e) => updateReportDate(index, 'title', e.target.value)}
                      placeholder="Название этапа"
                      className="input flex-1"
                    />
                    <input
                      type="date"
                      value={rd.date ? rd.date.split('T')[0] : ''}
                      onChange={(e) => updateReportDate(index, 'date', e.target.value)}
                      className="input w-40"
                    />
                    <button
                      type="button"
                      onClick={() => removeReportDate(index)}
                      className="p-2 text-gray-400 hover:text-red-600 transition"
                    >
                      <i className="ri-delete-bin-line"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              <i className="ri-information-line mr-1"></i>
              Даты отчётности отображаются в календаре и на дашборде
            </p>
          </div>
        </div>

        {/* Premium Subscription Block */}
        <div className="border-t pt-4 mt-4">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <i className={`ri-vip-crown-line text-xl ${isPremium ? 'text-amber-600' : 'text-amber-400'}`}></i>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">
                  {isPremium ? 'Premium активен' : 'Premium подписка'}
                </h4>
                <p className="text-sm text-gray-600">
                  {isPremium ? 'Реклама отключена' : 'Отключите рекламу и получите доступ к премиум-функциям'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleTogglePremium}
              disabled={premiumLoading}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                isPremium
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-amber-500 text-white hover:bg-amber-600'
              } ${premiumLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {premiumLoading ? (
                <span className="flex items-center gap-2">
                  <i className="ri-loader-4-line animate-spin"></i>
                  Загрузка...
                </span>
              ) : isPremium ? (
                'Отключить'
              ) : (
                'Активировать'
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            <i className="ri-information-line mr-1"></i>
            В MVP подписка активируется без оплаты (демо-режим)
          </p>
        </div>

        <div className="flex gap-3 pt-4">
          <button type="button" onClick={onClose} disabled={isSaving} className="btn btn-secondary flex-1">
            Отмена
          </button>
          <button type="submit" disabled={isSaving} className="btn btn-primary flex-1">
            {isSaving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
