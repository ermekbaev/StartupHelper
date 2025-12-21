'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface PricingTier {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  notIncluded?: string[];
  popular?: boolean;
  buttonText: string;
  buttonVariant: 'primary' | 'secondary' | 'outline';
}

const pricingTiers: PricingTier[] = [
  {
    id: 'free',
    name: 'Бесплатный',
    price: 0,
    period: 'навсегда',
    description: 'Для начинающих предпринимателей',
    features: [
      'До 3 сотрудников в системе',
      'Базовые шаблоны документов',
      '1 чек-лист',
      'Календарь событий',
      'Базовая аналитика',
    ],
    notIncluded: [
      'Загрузка своих документов',
      'Неограниченные чек-листы',
      'Приоритетная поддержка',
      'Без рекламы',
    ],
    buttonText: 'Текущий план',
    buttonVariant: 'outline',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 990,
    period: 'в месяц',
    description: 'Для растущего бизнеса',
    features: [
      'До 15 сотрудников',
      'Все шаблоны документов',
      'Неограниченные чек-листы',
      'Загрузка документов до 50 МБ',
      'Расширенная аналитика',
      'Экспорт отчётов',
      'Email-поддержка',
      'Без рекламы',
    ],
    popular: true,
    buttonText: 'Выбрать Pro',
    buttonVariant: 'primary',
  },
  {
    id: 'business',
    name: 'Business',
    price: 2490,
    period: 'в месяц',
    description: 'Для команд и компаний',
    features: [
      'Неограниченные сотрудники',
      'Все возможности Pro',
      'API-доступ',
      'Загрузка документов до 500 МБ',
      'Командная работа',
      'Приоритетная поддержка 24/7',
      'Персональный менеджер',
      'SLA гарантии',
      'Брендирование',
    ],
    buttonText: 'Выбрать Business',
    buttonVariant: 'secondary',
  },
];

const faqs = [
  {
    question: 'Могу ли я сменить тариф в любое время?',
    answer: 'Да, вы можете перейти на другой тариф в любое время. При переходе на более дорогой тариф изменения вступят в силу немедленно. При переходе на более дешёвый — со следующего расчётного периода.',
  },
  {
    question: 'Какие способы оплаты доступны?',
    answer: 'Мы принимаем банковские карты (Visa, Mastercard, МИР), электронные кошельки, а также оплату по счёту для юридических лиц.',
  },
  {
    question: 'Есть ли пробный период?',
    answer: 'Да, для тарифов Pro и Business доступен 14-дневный бесплатный пробный период. Карта не требуется для активации.',
  },
  {
    question: 'Что произойдёт с моими данными при отмене подписки?',
    answer: 'Ваши данные сохранятся, но доступ к премиум-функциям будет ограничен. Вы всегда сможете вернуться к платному тарифу и продолжить работу.',
  },
  {
    question: 'Есть ли скидки при годовой оплате?',
    answer: 'Да! При оплате за год вы получаете скидку 20%. Это 2 месяца бесплатно!',
  },
];

const comparisonFeatures = [
  { name: 'Сотрудники', free: 'До 3', pro: 'До 15', business: 'Безлимит' },
  { name: 'Чек-листы', free: '1', pro: 'Безлимит', business: 'Безлимит' },
  { name: 'Документы', free: 'Только шаблоны', pro: 'До 50 МБ', business: 'До 500 МБ' },
  { name: 'Аналитика', free: 'Базовая', pro: 'Расширенная', business: 'Полная + API' },
  { name: 'Экспорт', free: false, pro: true, business: true },
  { name: 'Без рекламы', free: false, pro: true, business: true },
  { name: 'Поддержка', free: 'FAQ', pro: 'Email', business: '24/7 + Менеджер' },
  { name: 'API доступ', free: false, pro: false, business: true },
  { name: 'Командная работа', free: false, pro: false, business: true },
  { name: 'SLA гарантии', free: false, pro: false, business: true },
];

export default function PremiumPage() {
  const router = useRouter();
  const { user, token, isAuthenticated, refreshUser } = useAuth();
  const [isAnnual, setIsAnnual] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const getPrice = (price: number) => {
    if (price === 0) return 0;
    return isAnnual ? Math.round(price * 12 * 0.8) : price;
  };

  const handleSubscribe = async (tierId: string) => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/premium');
      return;
    }

    if (tierId === 'free') return;

    setIsProcessing(tierId);

    try {
      const response = await fetch('/api/premium/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tierId,
          isAnnual,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await refreshUser();
        router.push('/dashboard?premium=activated');
      } else {
        alert(data.error || 'Ошибка при оформлении подписки');
      }
    } catch (error) {
      console.error('Subscribe error:', error);
      alert('Произошла ошибка. Попробуйте позже.');
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <i className="ri-rocket-line text-white text-sm"></i>
              </div>
              <span className="text-lg sm:text-xl font-bold text-blue-600" style={{fontFamily: '"Dancing Script", cursive'}}>
                StartupHelper
              </span>
            </Link>

            <div className="flex items-center space-x-2 sm:space-x-4">
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 text-sm sm:text-base">
                    <i className="ri-arrow-left-line mr-1"></i>
                    <span className="hidden sm:inline">В Dashboard</span>
                  </Link>
                  <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1.5 rounded-full">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-medium">
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-gray-700 hidden sm:inline">{user?.name}</span>
                    {user?.isPremium && (
                      <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                        PRO
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-gray-600 hover:text-gray-900 text-sm sm:text-base">
                    Войти
                  </Link>
                  <Link href="/register" className="btn btn-primary text-sm">
                    Регистрация
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm mb-6">
            <i className="ri-sparkle-line"></i>
            <span>Скидка 20% при годовой оплате</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
            Выберите подходящий тариф
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-8 sm:mb-10">
            Расширьте возможности вашего бизнеса с Premium-функциями.
            Начните с бесплатного плана или выберите Pro для максимальной эффективности.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-10 sm:mb-12">
            <span className={`text-sm sm:text-base ${!isAnnual ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
              Ежемесячно
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                isAnnual ? 'bg-purple-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                  isAnnual ? 'translate-x-7' : 'translate-x-0.5'
                }`}
              />
            </button>
            <span className={`text-sm sm:text-base ${isAnnual ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
              Ежегодно
              <span className="ml-2 text-green-600 text-xs sm:text-sm font-medium">-20%</span>
            </span>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-16 sm:pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {pricingTiers.map((tier) => (
              <div
                key={tier.id}
                className={`relative bg-white rounded-2xl shadow-lg overflow-hidden transition-transform hover:scale-[1.02] ${
                  tier.popular ? 'ring-2 ring-purple-500 lg:scale-105' : ''
                }`}
              >
                {tier.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-center py-2 text-sm font-medium">
                    <i className="ri-star-fill mr-1"></i>
                    Популярный выбор
                  </div>
                )}

                <div className={`p-6 sm:p-8 ${tier.popular ? 'pt-12 sm:pt-14' : ''}`}>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                  <p className="text-gray-600 text-sm sm:text-base mb-4">{tier.description}</p>

                  <div className="mb-6">
                    <span className="text-4xl sm:text-5xl font-bold text-gray-900">
                      {getPrice(tier.price).toLocaleString('ru-RU')}
                    </span>
                    <span className="text-gray-500 ml-2">
                      ₽ {isAnnual && tier.price > 0 ? 'в год' : tier.period}
                    </span>
                  </div>

                  <button
                    onClick={() => handleSubscribe(tier.id)}
                    disabled={isProcessing !== null || (tier.id === 'free' && !user?.isPremium)}
                    className={`w-full py-3 px-6 rounded-xl font-semibold text-sm sm:text-base transition mb-6 ${
                      tier.buttonVariant === 'primary'
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                        : tier.buttonVariant === 'secondary'
                        ? 'bg-gray-900 text-white hover:bg-gray-800'
                        : 'border-2 border-gray-300 text-gray-700 hover:border-gray-400'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isProcessing === tier.id ? (
                      <span className="flex items-center justify-center">
                        <i className="ri-loader-4-line animate-spin mr-2"></i>
                        Обработка...
                      </span>
                    ) : user?.isPremium && tier.id !== 'free' ? (
                      tier.id === 'pro' ? 'Текущий план' : tier.buttonText
                    ) : (
                      tier.buttonText
                    )}
                  </button>

                  <ul className="space-y-3">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start text-sm sm:text-base">
                        <i className="ri-check-line text-green-500 mr-2 mt-0.5 flex-shrink-0"></i>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                    {tier.notIncluded?.map((feature, idx) => (
                      <li key={`not-${idx}`} className="flex items-start text-sm sm:text-base text-gray-400">
                        <i className="ri-close-line mr-2 mt-0.5 flex-shrink-0"></i>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center text-gray-900 mb-4">
            Сравнение тарифов
          </h2>
          <p className="text-gray-600 text-center mb-10 sm:mb-12 max-w-2xl mx-auto">
            Подробное сравнение возможностей каждого тарифного плана
          </p>

          <div className="max-w-4xl mx-auto overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-4 px-4 text-gray-600 font-medium">Возможность</th>
                  <th className="text-center py-4 px-4 text-gray-900 font-semibold">Бесплатный</th>
                  <th className="text-center py-4 px-4 text-purple-600 font-semibold bg-purple-50 rounded-t-lg">Pro</th>
                  <th className="text-center py-4 px-4 text-gray-900 font-semibold">Business</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feature, idx) => (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="py-4 px-4 text-gray-700 text-sm sm:text-base">{feature.name}</td>
                    <td className="py-4 px-4 text-center">
                      {typeof feature.free === 'boolean' ? (
                        feature.free ? (
                          <i className="ri-check-line text-green-500 text-lg"></i>
                        ) : (
                          <i className="ri-close-line text-gray-300 text-lg"></i>
                        )
                      ) : (
                        <span className="text-gray-600 text-sm sm:text-base">{feature.free}</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center bg-purple-50">
                      {typeof feature.pro === 'boolean' ? (
                        feature.pro ? (
                          <i className="ri-check-line text-green-500 text-lg"></i>
                        ) : (
                          <i className="ri-close-line text-gray-300 text-lg"></i>
                        )
                      ) : (
                        <span className="text-purple-700 font-medium text-sm sm:text-base">{feature.pro}</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {typeof feature.business === 'boolean' ? (
                        feature.business ? (
                          <i className="ri-check-line text-green-500 text-lg"></i>
                        ) : (
                          <i className="ri-close-line text-gray-300 text-lg"></i>
                        )
                      ) : (
                        <span className="text-gray-600 text-sm sm:text-base">{feature.business}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center text-gray-900 mb-4">
            Частые вопросы
          </h2>
          <p className="text-gray-600 text-center mb-10 sm:mb-12 max-w-2xl mx-auto">
            Ответы на популярные вопросы о тарифах и подписке
          </p>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-4 sm:p-6 text-left"
                >
                  <span className="font-semibold text-gray-900 text-sm sm:text-base pr-4">
                    {faq.question}
                  </span>
                  <i
                    className={`ri-arrow-down-s-line text-xl text-gray-500 transition-transform ${
                      openFaq === idx ? 'rotate-180' : ''
                    }`}
                  ></i>
                </button>
                {openFaq === idx && (
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                    <p className="text-gray-600 text-sm sm:text-base">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
            Готовы начать?
          </h2>
          <p className="text-purple-100 text-lg mb-8 max-w-2xl mx-auto">
            Присоединяйтесь к тысячам предпринимателей, которые уже используют StartupHelper для развития своего бизнеса
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => handleSubscribe('pro')}
              className="w-full sm:w-auto bg-white text-purple-600 px-8 py-3 rounded-xl font-semibold hover:bg-purple-50 transition"
            >
              Попробовать Pro бесплатно
            </button>
            <Link
              href="/register"
              className="w-full sm:w-auto border-2 border-white text-white px-8 py-3 rounded-xl font-semibold hover:bg-white/10 transition text-center"
            >
              Создать аккаунт
            </Link>
          </div>
          <p className="text-purple-200 text-sm mt-4">
            <i className="ri-shield-check-line mr-1"></i>
            14 дней бесплатно • Отмена в любое время • Без привязки карты
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <i className="ri-rocket-line text-white text-sm"></i>
              </div>
              <span className="text-white font-bold" style={{fontFamily: '"Dancing Script", cursive'}}>
                StartupHelper
              </span>
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <Link href="/" className="hover:text-white transition">Главная</Link>
              <Link href="/dashboard" className="hover:text-white transition">Dashboard</Link>
              <a href="#" className="hover:text-white transition">Поддержка</a>
            </div>
            <p className="text-sm">© 2025 StartupHelper</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
