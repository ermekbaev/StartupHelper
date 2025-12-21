'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import type { UserProfile } from '@/hooks/useDemoStore';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSave: (profile: UserProfile) => void;
  isPremium?: boolean;
  onTogglePremium?: (value: boolean) => Promise<void>;
}

export function ProfileModal({ isOpen, onClose, profile, onSave, isPremium = false, onTogglePremium }: ProfileModalProps) {
  const [premiumLoading, setPremiumLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    onSave({
      name: formData.get('name') as string,
      projectName: formData.get('projectName') as string,
      grantAmount: Number(formData.get('grantAmount')),
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      inn: formData.get('inn') as string,
      ogrn: formData.get('ogrn') as string,
    });
    onClose();
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
              required
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
          <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
            Отмена
          </button>
          <button type="submit" className="btn btn-primary flex-1">
            Сохранить
          </button>
        </div>
      </form>
    </Modal>
  );
}
