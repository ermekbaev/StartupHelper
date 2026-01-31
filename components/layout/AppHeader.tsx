'use client';

import Link from 'next/link';

interface AppHeaderProps {
  userName: string;
  onProfileClick: () => void;
  onLogout?: () => void;
  onMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
}

export function AppHeader({ userName, onProfileClick, onLogout, onMenuToggle, isMobileMenuOpen }: AppHeaderProps) {
  const nameParts = userName.split(' ');
  const firstName = nameParts[1] || nameParts[0];

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center py-3 sm:py-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 transition"
            aria-label="Меню"
          >
            <i className={`${isMobileMenuOpen ? 'ri-close-line' : 'ri-menu-line'} text-xl text-gray-700`}></i>
          </button>

          {/* Logo */}
          <Link href="/" className="relative">
            <span className="text-xl sm:text-2xl font-bold text-blue-600" style={{fontFamily: '"Dancing Script", cursive'}}>
              StartupHelper
            </span>
            <span className="absolute -top-3 -right-9 px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-violet-600 via-purple-500 to-pink-500 text-white rounded-md uppercase shadow-lg transform rotate-12 border border-white/20 animate-pulse">
              beta
            </span>
          </Link>

          {/* Right side actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-200 transition">
              <i className="ri-notification-line text-blue-600"></i>
            </div>
            <button
              onClick={onProfileClick}
              className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 px-2 sm:px-3 py-2 rounded-lg transition"
            >
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <i className="ri-user-line text-gray-600"></i>
              </div>
              <span className="text-gray-700 font-medium hidden sm:inline">{firstName}</span>
            </button>
            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center cursor-pointer hover:bg-red-50 p-2 rounded-lg transition text-red-600"
                title="Выйти"
              >
                <i className="ri-logout-box-line"></i>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
