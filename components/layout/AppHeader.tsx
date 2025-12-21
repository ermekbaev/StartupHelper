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
  const firstName = userName.split(' ')[0];

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
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 cursor-pointer">
              <div className="relative">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center transform rotate-12">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-lg flex items-center justify-center">
                    <i className="ri-lightbulb-flash-line text-blue-600 text-xs sm:text-sm"></i>
                  </div>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-orange-400 rounded-full flex items-center justify-center">
                  <i className="ri-star-fill text-white text-[8px] sm:text-xs"></i>
                </div>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-blue-600 hidden xs:inline" style={{fontFamily: '"Dancing Script", cursive'}}>
                StartupHelper
              </span>
            </Link>
          </div>

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
