'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div className="text-xl sm:text-2xl font-bold text-blue-600" style={{fontFamily: '"Dancing Script", cursive'}}>
              StartupHelper
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/premium" className="text-gray-600 hover:text-purple-600 transition text-xs sm:text-sm hidden sm:inline-flex items-center">
                <i className="ri-vip-crown-line mr-1 text-amber-500"></i>
                Тарифы
              </Link>
              {!isLoading && isAuthenticated ? (
                <Link href="/dashboard" className="btn btn-primary text-xs sm:text-sm px-3 sm:px-4 py-2">
                  Личный кабинет
                </Link>
              ) : (
                <>
                  <Link href="/login" className="btn btn-primary text-xs sm:text-sm px-3 sm:px-4 py-2">
                    Войти
                  </Link>
                  <Link href="/register" className="btn btn-secondary text-xs sm:text-sm px-3 sm:px-4 py-2 hidden xs:inline-flex">
                    Регистрация
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-12 sm:py-16 lg:py-20 px-4 bg-cover bg-center" style={{
        backgroundImage: `url('https://readdy.ai/api/search-image?query=Modern%20office%20workspace%20with%20young%20entrepreneurs%20working%20on%20laptops%2C%20business%20planning%20documents%20on%20desk%2C%20bright%20natural%20lighting%2C%20professional%20atmosphere%2C%20clean%20minimalist%20design%2C%20successful%20startup%20environment%2C%20collaborative%20workspace&width=1200&height=600&seq=hero-main&orientation=landscape')`,
      }}>
        <div className="absolute inset-0 bg-blue-900/70 sm:bg-blue-900/60"></div>
        <div className="relative max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
              ИП помощник для студентов-грантополучателей
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-blue-100 mb-6 sm:mb-8">
              Упростите ведение бизнеса после получения гранта. Автоматические напоминания, чек-листы и инструкции для успешного развития вашего стартапа.
            </p>
            <div className="flex flex-col xs:flex-row gap-3 sm:gap-4">
              {!isLoading && isAuthenticated ? (
                <Link href="/dashboard" className="bg-white text-blue-600 px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-blue-50 transition text-center text-sm sm:text-base">
                  Перейти в личный кабинет
                </Link>
              ) : (
                <>
                  <Link href="/register" className="bg-white text-blue-600 px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-blue-50 transition text-center text-sm sm:text-base">
                    Начать бесплатно
                  </Link>
                  <Link href="/login" className="border-2 border-white text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition text-center text-sm sm:text-base">
                    Войти в систему
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Advantages Section */}
      <section className="py-10 sm:py-12 lg:py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">Почему выбирают StartupHelper?</h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600">Простые решения сложных задач для молодых предпринимателей</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            <AdvantageCard
              icon="ri-lightbulb-line"
              iconBg="bg-blue-100"
              iconColor="text-blue-600"
              title="Простота"
              description="Интуитивно понятный интерфейс, созданный специально для студентов без опыта ведения бизнеса"
            />
            <AdvantageCard
              icon="ri-money-dollar-circle-line"
              iconBg="bg-green-100"
              iconColor="text-green-600"
              title="Низкая стоимость"
              description="Доступные тарифы для студентов с бесплатным базовым функционалом"
            />
            <AdvantageCard
              icon="ri-robot-line"
              iconBg="bg-purple-100"
              iconColor="text-purple-600"
              title="Автоматизация"
              description="Автоматические напоминания о сроках, готовые шаблоны и чек-листы"
            />
            <AdvantageCard
              icon="ri-time-line"
              iconBg="bg-orange-100"
              iconColor="text-orange-600"
              title="Доступность 24/7"
              description="Круглосуточный доступ к информации и инструментам управления бизнесом"
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-10 sm:py-12 lg:py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">Как это работает</h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600">Три простых шага к успешному ведению бизнеса</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            <StepCard number={1} title="Регистрация" description="Создайте аккаунт и укажите информацию о вашем гранте и проекте" />
            <StepCard number={2} title="Настройка" description="Система автоматически создаст персональный календарь и чек-листы" />
            <StepCard number={3} title="Управление" description="Получайте напоминания, выполняйте задачи и отслеживайте прогресс" />
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section className="py-10 sm:py-12 lg:py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">Основные возможности</h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600">Всё необходимое для ведения бизнеса в одном месте</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <FeatureCard icon="ri-calendar-check-line" iconBg="bg-blue-100" iconColor="text-blue-600" title="Календарь-напоминальник" description="Персональный календарь с автоматическими уведомлениями о важных сроках" />
            <FeatureCard icon="ri-checkbox-line" iconBg="bg-green-100" iconColor="text-green-600" title="Чек-листы" description="Готовые списки задач для разных этапов развития бизнеса" />
            <FeatureCard icon="ri-file-text-line" iconBg="bg-purple-100" iconColor="text-purple-600" title="Шаблоны документов" description="Готовые шаблоны договоров, актов и других необходимых документов" />
            <FeatureCard icon="ri-team-line" iconBg="bg-orange-100" iconColor="text-orange-600" title="Кадровый учёт" description="Упрощённое ведение кадрового учёта и воинского учёта сотрудников" />
            <FeatureCard icon="ri-pie-chart-line" iconBg="bg-red-100" iconColor="text-red-600" title="Финансовый контроль" description="Отслеживание доходов, расходов и остатка грантовых средств" />
            <FeatureCard icon="ri-customer-service-2-line" iconBg="bg-indigo-100" iconColor="text-indigo-600" title="Поддержка" description="Online-чат и возможность получить профессиональную консультацию" />
          </div>
        </div>
      </section>

      {/* Video/Demo Section */}
      <section className="py-10 sm:py-12 lg:py-16 px-4 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6">Посмотрите, как работает StartupHelper</h2>
          <p className="text-base sm:text-lg lg:text-xl text-blue-100 mb-6 sm:mb-8">Короткое видео о том, как наша платформа поможет вам успешно вести бизнес</p>

          <div className="bg-white rounded-lg p-4 sm:p-6 lg:p-8 shadow-xl">
            <div
              className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-4 sm:mb-6 bg-cover bg-center"
              style={{
                backgroundImage: `url('https://readdy.ai/api/search-image?query=Professional%20video%20presentation%20screenshot%20showing%20business%20dashboard%20interface%2C%20modern%20web%20application%20design%2C%20startup%20management%20tools%2C%20calendar%20and%20checklist%20features%2C%20clean%20user%20interface%20mockup&width=800&height=450&seq=video-preview&orientation=landscape')`,
              }}
            >
              <button
                onClick={() => setIsVideoModalOpen(true)}
                className="w-14 h-14 sm:w-20 sm:h-20 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition cursor-pointer"
              >
                <i className="ri-play-fill text-xl sm:text-2xl text-white ml-0.5 sm:ml-1"></i>
              </button>
            </div>
            <p className="text-sm sm:text-base text-gray-600">Видео-обзор основных функций платформы (3 минуты)</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10 sm:py-12 lg:py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
            {!isLoading && isAuthenticated ? 'Продолжите работу' : 'Готовы начать?'}
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8">
            {!isLoading && isAuthenticated
              ? 'Вернитесь в личный кабинет для управления вашим проектом'
              : 'Присоединяйтесь к сотням студентов, которые уже успешно ведут свой бизнес с нашей помощью'
            }
          </p>

          <div className="flex flex-col xs:flex-row gap-3 sm:gap-4 justify-center">
            {!isLoading && isAuthenticated ? (
              <Link href="/dashboard" className="btn btn-primary px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base">
                Перейти в личный кабинет
              </Link>
            ) : (
              <>
                <Link href="/register" className="btn btn-primary px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base">
                  Создать аккаунт бесплатно
                </Link>
                <Link href="/contact" className="btn btn-secondary px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base">
                  Связаться с нами
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 sm:py-10 lg:py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="col-span-2 sm:col-span-2 lg:col-span-1">
              <div className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4" style={{fontFamily: '"Dancing Script", cursive'}}>StartupHelper</div>
              <p className="text-sm sm:text-base text-gray-400">Платформа для успешного ведения бизнеса студентами-грантополучателями</p>
            </div>

            <div>
              <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Платформа</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-400">
                <li><Link href="/features" className="hover:text-white">Возможности</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Тарифы</Link></li>
                <li><Link href="/templates" className="hover:text-white">Шаблоны</Link></li>
                <li><Link href="/support" className="hover:text-white">Поддержка</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Ресурсы</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-400">
                <li><Link href="/guides" className="hover:text-white">Руководства</Link></li>
                <li><Link href="/blog" className="hover:text-white">Блог</Link></li>
                <li><Link href="/webinars" className="hover:text-white">Вебинары</Link></li>
                <li><Link href="/faq" className="hover:text-white">Вопросы и ответы</Link></li>
              </ul>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Контакты</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-sm sm:text-base text-gray-400">
                <li>Email: support@startuphelper.ru</li>
                <li>Телефон: +7 (999) 123-45-67</li>
                <li>Telegram: @startuphelper_bot</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-sm sm:text-base text-gray-400">
            <p>&copy; 2024 StartupHelper. Все права защищены.</p>
          </div>
        </div>
      </footer>

      {/* Video Modal */}
      <Modal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        title="Обзор StartupHelper"
        maxWidth="2xl"
      >
        <div className="aspect-video bg-gray-900 rounded-lg mb-6">
          <iframe
            width="100%"
            height="100%"
            src={isVideoModalOpen ? "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1" : ""}
            title="StartupHelper Demo"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="rounded-lg"
          ></iframe>
        </div>

        <div className="text-center">
          <h4 className="text-xl font-semibold text-gray-900 mb-3">Обзор основных возможностей</h4>
          <p className="text-gray-600 mb-6">
            В этом видео мы покажем, как StartupHelper поможет вам эффективно управлять бизнесом после получения гранта
          </p>

          <div className="grid md:grid-cols-3 gap-4 text-left mb-6">
            <ModalFeatureCard icon="ri-calendar-line" iconBg="bg-blue-600" bgColor="bg-blue-50" title="Календарь напоминаний" description="Автоматические уведомления о важных датах" />
            <ModalFeatureCard icon="ri-checkbox-line" iconBg="bg-green-600" bgColor="bg-green-50" title="Чек-листы" description="Пошаговые инструкции для каждого этапа" />
            <ModalFeatureCard icon="ri-file-text-line" iconBg="bg-purple-600" bgColor="bg-purple-50" title="Шаблоны" description="Готовые документы для вашего бизнеса" />
          </div>

          <Link href={isAuthenticated ? "/dashboard" : "/register"} className="btn btn-primary px-8 py-3">
            {isAuthenticated ? 'Перейти в кабинет' : 'Начать использовать'}
          </Link>
        </div>
      </Modal>
    </div>
  );
}

// Sub-components
function AdvantageCard({ icon, iconBg, iconColor, title, description }: {
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg text-center">
      <div className={`w-12 h-12 sm:w-16 sm:h-16 ${iconBg} rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4`}>
        <i className={`${icon} text-xl sm:text-2xl ${iconColor}`}></i>
      </div>
      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">{title}</h3>
      <p className="text-sm sm:text-base text-gray-600">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="w-14 h-14 sm:w-20 sm:h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
        <span className="text-xl sm:text-2xl font-bold text-white">{number}</span>
      </div>
      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-4">{title}</h3>
      <p className="text-sm sm:text-base text-gray-600">{description}</p>
    </div>
  );
}

function FeatureCard({ icon, iconBg, iconColor, title, description }: {
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
      <div className={`w-10 h-10 sm:w-12 sm:h-12 ${iconBg} rounded-lg flex items-center justify-center mb-3 sm:mb-4`}>
        <i className={`${icon} text-lg sm:text-xl ${iconColor}`}></i>
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">{title}</h3>
      <p className="text-sm sm:text-base text-gray-600">{description}</p>
    </div>
  );
}

function ModalFeatureCard({ icon, iconBg, bgColor, title, description }: {
  icon: string;
  iconBg: string;
  bgColor: string;
  title: string;
  description: string;
}) {
  return (
    <div className={`${bgColor} p-3 sm:p-4 rounded-lg`}>
      <div className={`w-7 h-7 sm:w-8 sm:h-8 ${iconBg} rounded-full flex items-center justify-center mb-2 sm:mb-3`}>
        <i className={`${icon} text-white text-xs sm:text-sm`}></i>
      </div>
      <h5 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">{title}</h5>
      <p className="text-xs sm:text-sm text-gray-600">{description}</p>
    </div>
  );
}
