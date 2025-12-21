'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export type TabType = 'dashboard' | 'calendar' | 'checklists' | 'documents' | 'archive' | 'hr' | 'finance' | 'support';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const navItems: { id: TabType; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Главная', icon: 'ri-dashboard-line' },
  { id: 'calendar', label: 'Календарь', icon: 'ri-calendar-line' },
  { id: 'checklists', label: 'Чек-листы', icon: 'ri-checkbox-line' },
  { id: 'documents', label: 'Документы', icon: 'ri-file-text-line' },
  { id: 'archive', label: 'Архив документов', icon: 'ri-archive-line' },
  { id: 'hr', label: 'Кадры', icon: 'ri-team-line' },
  { id: 'finance', label: 'Финансы', icon: 'ri-pie-chart-line' },
  { id: 'support', label: 'Поддержка', icon: 'ri-customer-service-line' },
];

export function Sidebar({ activeTab, onTabChange, isOpen = false, onClose }: SidebarProps) {
  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleTabChange = (tab: TabType) => {
    onTabChange(tab);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto
          w-72 lg:w-auto
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          lg:transform-none
        `}
      >
        <div className="bg-white rounded-none lg:rounded-lg shadow-lg lg:shadow-sm h-full lg:h-auto p-4 sm:p-6 overflow-y-auto">
          {/* Mobile header */}
          <div className="flex items-center justify-between mb-6 lg:hidden">
            <span className="text-lg font-bold text-blue-600" style={{fontFamily: '"Dancing Script", cursive'}}>
              StartupHelper
            </span>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition"
            >
              <i className="ri-close-line text-xl text-gray-600"></i>
            </button>
          </div>

          <nav className="space-y-1 sm:space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`nav-item ${activeTab === item.id ? 'nav-item-active' : 'nav-item-inactive'}`}
              >
                <i className={`${item.icon} text-lg`}></i>
                <span className="text-sm sm:text-base">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
            <h3 className="font-semibold text-purple-900 mb-2 text-sm sm:text-base">
              <i className="ri-vip-crown-line mr-1 text-amber-500"></i>
              Premium
            </h3>
            <p className="text-xs sm:text-sm text-purple-700 mb-3">
              Расширенные возможности и приоритетная поддержка
            </p>
            <Link
              href="/premium"
              className="btn btn-primary text-xs sm:text-sm w-full py-2 text-center block"
              onClick={onClose}
            >
              Подробнее
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
