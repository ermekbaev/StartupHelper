'use client';

import Link from 'next/link';

interface AdBannerProps {
  variant?: 'default' | 'finance' | 'hr' | 'legal' | 'calendar';
  className?: string;
}

const adVariants = {
  default: {
    gradient: 'from-indigo-500 via-purple-500 to-pink-500',
    icon: 'ri-calculator-line',
    title: 'Бухгалтерские услуги для стартапов',
    description: 'Профессиональное ведение бухгалтерии. Первый месяц бесплатно!',
    button: 'Узнать подробнее',
  },
  finance: {
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
    icon: 'ri-bank-line',
    title: 'Расчётный счёт для бизнеса',
    description: 'Откройте счёт за 5 минут. Бесплатное обслуживание 3 месяца!',
    button: 'Открыть счёт',
  },
  hr: {
    gradient: 'from-orange-500 via-amber-500 to-yellow-500',
    icon: 'ri-team-line',
    title: 'Кадровый аутсорсинг',
    description: 'Доверьте кадровый учёт профессионалам. Скидка 20% новым клиентам!',
    button: 'Подробнее',
  },
  legal: {
    gradient: 'from-blue-500 via-indigo-500 to-violet-500',
    icon: 'ri-scales-3-line',
    title: 'Юридическое сопровождение',
    description: 'Консультации и документы для вашего бизнеса. Первая консультация бесплатно!',
    button: 'Получить консультацию',
  },
  calendar: {
    gradient: 'from-rose-500 via-pink-500 to-fuchsia-500',
    icon: 'ri-calendar-check-line',
    title: 'Автоматизация бизнес-процессов',
    description: 'CRM-система для стартапов. 14 дней бесплатного тестирования!',
    button: 'Попробовать',
  },
};

export function AdBanner({ variant = 'default', className = '' }: AdBannerProps) {
  const ad = adVariants[variant];

  return (
    <div className={`relative bg-gradient-to-r ${ad.gradient} rounded-xl p-5 text-white overflow-hidden ${className}`}>
      <div className="absolute top-2 right-2 bg-white/20 px-2 py-0.5 rounded text-xs">
        Реклама
      </div>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-base font-semibold mb-1">{ad.title}</h3>
          <p className="text-white/80 text-sm mb-3">
            {ad.description}
          </p>
          <button className="bg-white text-gray-800 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-white/90 transition">
            {ad.button}
          </button>
        </div>
        <div className="hidden md:block ml-4">
          <i className={`${ad.icon} text-5xl text-white/30`}></i>
        </div>
      </div>
      <Link
        href="/premium"
        className="inline-flex items-center text-xs text-white/60 mt-3 hover:text-white/90 transition"
      >
        <i className="ri-star-line mr-1"></i>
        Оформите Premium, чтобы убрать рекламу
        <i className="ri-arrow-right-line ml-1"></i>
      </Link>
    </div>
  );
}
