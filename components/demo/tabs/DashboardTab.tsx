'use client';

import { useState, useEffect } from 'react';
import { Card, ProgressBar, AdBanner } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  employeesCount: number;
  totalSpent: number;
  remainingGrant: number;
  grantAmount: number;
  daysUntilReport: number | null;
  nextReportTitle: string | null;
}

interface ExpenseByCategory {
  category: string;
  amount: number;
}

interface MonthlyExpense {
  month: string;
  amount: number;
}

interface UpcomingTask {
  id: string;
  text: string;
  deadline: string | null;
  checklistTitle: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  priority: 'NORMAL' | 'IMPORTANT' | 'URGENT';
}

const CATEGORY_LABELS: Record<string, string> = {
  SALARY: 'Зарплата',
  TAXES: 'Налоги',
  EQUIPMENT: 'Оборудование',
  SERVICES: 'Услуги',
  OTHER: 'Прочее',
};

const CATEGORY_COLORS: Record<string, string> = {
  SALARY: '#3B82F6',
  TAXES: '#EF4444',
  EQUIPMENT: '#10B981',
  SERVICES: '#8B5CF6',
  OTHER: '#F59E0B',
};

const PIE_COLORS = ['#3B82F6', '#EF4444', '#10B981', '#8B5CF6', '#F59E0B'];

export function DashboardTab() {
  const { user, token } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [expensesByCategory, setExpensesByCategory] = useState<ExpenseByCategory[]>([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState<MonthlyExpense[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<UpcomingTask[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!token) return;

      try {
        const response = await fetch('/api/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
          setExpensesByCategory(data.expensesByCategory);
          setMonthlyExpenses(data.monthlyExpenses);
          setUpcomingTasks(data.upcomingTasks);
          setCalendarEvents(data.calendarEvents);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [token]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'red';
      case 'IMPORTANT': return 'yellow';
      default: return 'blue';
    }
  };

  // Данные для круговой диаграммы
  const pieData = expensesByCategory.map(item => ({
    name: CATEGORY_LABELS[item.category] || item.category,
    value: item.amount,
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const grantAmount = stats?.grantAmount || user?.project?.grantAmount || 500000;
  const remainingGrant = stats?.remainingGrant ?? grantAmount;
  const spentPercentage = stats ? ((stats.totalSpent / grantAmount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <Card>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Добро пожаловать, {user?.name?.split(' ')[1] || user?.name?.split(' ')[0] || 'Пользователь'}!
        </h1>
        <p className="text-gray-600">
          Проект: {user?.project?.name || 'Мой проект'} • Грант: {grantAmount.toLocaleString()} ₽
        </p>
      </Card>

      {/* Ad Banner - hidden for premium users */}
      {!user?.isPremium && <AdBanner variant="default" />}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <StatCard
          title="Выполнено задач"
          value={stats ? `${stats.completedTasks}/${stats.totalTasks}` : '0/0'}
          icon="ri-checkbox-circle-line"
          iconBg="bg-green-100"
          iconColor="text-green-600"
        />
        <StatCard
          title="Остаток гранта"
          value={`${remainingGrant.toLocaleString()} ₽`}
          icon="ri-money-dollar-circle-line"
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Сотрудников"
          value={String(stats?.employeesCount || 0)}
          icon="ri-team-line"
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
        />
        {stats?.daysUntilReport !== null && stats?.nextReportTitle ? (
          <StatCard
            title={`До: ${stats.nextReportTitle}`}
            value={`${stats.daysUntilReport} дн.`}
            valueColor={stats.daysUntilReport < 14 ? 'text-orange-600' : 'text-gray-900'}
            icon="ri-alarm-warning-line"
            iconBg="bg-orange-100"
            iconColor="text-orange-600"
          />
        ) : (
          <StatCard
            title="Дата отчёта"
            value="—"
            subtitle="Не указана"
            icon="ri-calendar-check-line"
            iconBg="bg-gray-100"
            iconColor="text-gray-400"
          />
        )}
      </div>

      {/* Grant Progress */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Использование гранта</h2>
        <div className="mb-2">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Израсходовано: {(stats?.totalSpent || 0).toLocaleString()} ₽</span>
            <span className="font-medium">{spentPercentage.toFixed(1)}%</span>
          </div>
          <ProgressBar value={spentPercentage} color={spentPercentage > 80 ? 'red' : spentPercentage > 50 ? 'yellow' : 'blue'} />
        </div>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Pie Chart - Expenses by Category */}
        <Card>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Расходы по категориям</h2>
          {pieData.length > 0 ? (
            <div className="h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="40%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${(value ?? 0).toLocaleString()} ₽`} />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ paddingTop: '16px' }}
                    formatter={(value) => <span className="text-xs sm:text-sm text-gray-700">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 sm:h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <i className="ri-pie-chart-line text-3xl sm:text-4xl mb-2"></i>
                <p className="text-sm sm:text-base">Нет данных о расходах</p>
              </div>
            </div>
          )}
        </Card>

        {/* Bar Chart - Monthly Expenses */}
        <Card>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Расходы по месяцам</h2>
          {monthlyExpenses.length > 0 ? (
            <div className="h-56 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyExpenses}>
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(value) => `${(value / 1000).toFixed(0)}к`} width={35} />
                  <Tooltip formatter={(value) => `${(value ?? 0).toLocaleString()} ₽`} />
                  <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Расходы" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 sm:h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <i className="ri-bar-chart-line text-3xl sm:text-4xl mb-2"></i>
                <p className="text-sm sm:text-base">Нет данных о расходах</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Tasks and Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <Card>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Ближайшие задачи</h2>
          {upcomingTasks.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {upcomingTasks.map(task => (
                <TaskItem
                  key={task.id}
                  title={task.text}
                  deadline={task.deadline ? `До ${formatDate(task.deadline)}` : 'Без срока'}
                  priority={task.deadline && new Date(task.deadline) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? 'red' : 'blue'}
                  subtitle={task.checklistTitle}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-4 sm:py-6 text-gray-500">
              <i className="ri-checkbox-circle-line text-2xl sm:text-3xl mb-2"></i>
              <p className="text-sm sm:text-base">Нет задач с дедлайнами</p>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Предстоящие события</h2>
          {calendarEvents.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {calendarEvents.map(event => (
                <TaskItem
                  key={event.id}
                  title={event.title}
                  deadline={formatDate(event.date)}
                  priority={getPriorityColor(event.priority)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-4 sm:py-6 text-gray-500">
              <i className="ri-calendar-line text-2xl sm:text-3xl mb-2"></i>
              <p className="text-sm sm:text-base">Нет предстоящих событий</p>
            </div>
          )}
        </Card>
      </div>

      {/* Vacancies Block - Visual Only (Stage 2) */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900">Вакансии и специалисты</h2>
            <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full font-medium">
              Скоро
            </span>
          </div>
          <i className="ri-briefcase-line text-2xl text-gray-400"></i>
        </div>
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-user-search-line text-2xl text-gray-400"></i>
          </div>
          <h3 className="text-gray-700 font-medium mb-2">Найдите специалистов для вашего проекта</h3>
          <p className="text-gray-500 text-sm mb-4">
            Размещайте вакансии и находите талантливых специалистов для вашей команды
          </p>
          <button
            disabled
            className="bg-gray-300 text-gray-500 px-6 py-2 rounded-lg text-sm font-medium cursor-not-allowed"
          >
            Доступно в Stage 2
          </button>
        </div>
      </Card>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  valueColor?: string;
  subtitle?: string;
}

function StatCard({ title, value, icon, iconBg, iconColor, valueColor = 'text-gray-900', subtitle }: StatCardProps) {
  return (
    <Card className="p-3 sm:p-4 lg:p-6">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm text-gray-600">{title}</p>
          <p className={`text-base sm:text-lg lg:text-xl font-bold ${valueColor}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
        <div className={`w-8 h-8 sm:w-10 sm:h-10 ${iconBg} rounded-full flex items-center justify-center flex-shrink-0`}>
          <i className={`${icon} ${iconColor} text-sm sm:text-lg`}></i>
        </div>
      </div>
    </Card>
  );
}

interface TaskItemProps {
  title: string;
  deadline: string;
  priority: 'yellow' | 'red' | 'blue' | 'green';
  subtitle?: string;
}

function TaskItem({ title, deadline, priority, subtitle }: TaskItemProps) {
  const dotColors = {
    yellow: 'bg-yellow-400',
    red: 'bg-red-400',
    blue: 'bg-blue-400',
    green: 'bg-green-400',
  };

  return (
    <div className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50">
      <div className={`w-2 h-2 ${dotColors[priority]} rounded-full mt-2`}></div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
        <p className="text-xs text-gray-500">{deadline}</p>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
    </div>
  );
}
