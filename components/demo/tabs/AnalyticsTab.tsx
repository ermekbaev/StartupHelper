'use client';

import { useState, useEffect } from 'react';
import { Card, ProgressBar, AdBanner } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: 'SALARY' | 'TAXES' | 'EQUIPMENT' | 'SERVICES' | 'OTHER';
  date: string;
}

interface CategoryTotal {
  category: string;
  _sum: { amount: number | null };
}

const CATEGORY_LABELS: Record<string, string> = {
  SALARY: 'Заработная плата',
  TAXES: 'Налоги',
  EQUIPMENT: 'Оборудование',
  SERVICES: 'Услуги сторонних лиц',
  OTHER: 'Прочие расходы',
};

const CATEGORY_COLORS: Record<string, string> = {
  SALARY: '#3B82F6',
  TAXES: '#EF4444',
  EQUIPMENT: '#10B981',
  SERVICES: '#8B5CF6',
  OTHER: '#F59E0B',
};

const PIE_COLORS = ['#3B82F6', '#EF4444', '#10B981', '#8B5CF6', '#F59E0B'];

export function AnalyticsTab() {
  const { user, token } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totals, setTotals] = useState<CategoryTotal[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const grantAmount = user?.project?.grantAmount || 500000;
  const remainingGrant = grantAmount - totalSpent;
  const spentPercentage = (totalSpent / grantAmount) * 100;

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;

      try {
        const response = await fetch('/api/finance', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setTransactions(data.transactions);
          setTotals(data.totals);
          setTotalSpent(data.totalSpent);
        }
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // Prepare data for pie chart
  const pieData = totals.map((t) => ({
    name: CATEGORY_LABELS[t.category] || t.category,
    value: t._sum.amount || 0,
    category: t.category,
  }));

  // Prepare monthly data for bar chart
  const getMonthlyData = () => {
    const monthlyMap: Record<string, number> = {};

    transactions.forEach((tx) => {
      const date = new Date(tx.date);
      const monthKey = date.toLocaleDateString('ru-RU', { month: 'short', year: '2-digit' });
      monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + tx.amount;
    });

    return Object.entries(monthlyMap)
      .map(([month, amount]) => ({ month, amount }))
      .slice(-6); // Last 6 months
  };

  const monthlyData = getMonthlyData();

  // Category expenses with percentages
  const categoryExpenses = totals.map((t) => ({
    category: t.category,
    amount: t._sum.amount || 0,
    percentage: totalSpent > 0 ? ((t._sum.amount || 0) / totalSpent) * 100 : 0,
  }));

  // Recent transactions (last 5)
  const recentTransactions = transactions.slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Финансовая аналитика</h1>
          <p className="text-sm text-gray-600">Статистика расходов по вашему гранту</p>
        </div>
        <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500">
          <i className="ri-refresh-line"></i>
          <span>Обновлено только что</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Сумма гранта</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{grantAmount.toLocaleString()} ₽</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <i className="ri-bank-line text-blue-600"></i>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Потрачено</p>
              <p className="text-lg sm:text-2xl font-bold text-red-600">{totalSpent.toLocaleString()} ₽</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <i className="ri-arrow-down-line text-red-600"></i>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Остаток</p>
              <p className="text-lg sm:text-2xl font-bold text-green-600">{remainingGrant.toLocaleString()} ₽</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <i className="ri-wallet-line text-green-600"></i>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Использовано</p>
              <p className="text-lg sm:text-2xl font-bold text-purple-600">{spentPercentage.toFixed(1)}%</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <i className="ri-percent-line text-purple-600"></i>
            </div>
          </div>
        </Card>
      </div>

      {/* Grant Usage Progress */}
      <Card>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Использование гранта</h2>
        <div className="mb-2">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">
              Израсходовано: {totalSpent.toLocaleString()} ₽ из {grantAmount.toLocaleString()} ₽
            </span>
            <span className={`font-medium ${spentPercentage > 80 ? 'text-red-600' : spentPercentage > 50 ? 'text-yellow-600' : 'text-green-600'}`}>
              {spentPercentage.toFixed(1)}%
            </span>
          </div>
          <ProgressBar
            value={spentPercentage}
            color={spentPercentage > 80 ? 'red' : spentPercentage > 50 ? 'yellow' : 'blue'}
          />
        </div>
        {spentPercentage > 80 && (
          <div className="mt-3 p-3 bg-red-50 rounded-lg text-sm text-red-700 flex items-center">
            <i className="ri-alert-line mr-2"></i>
            Внимание! Использовано более 80% гранта
          </div>
        )}
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Pie Chart */}
        <Card>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Расходы по категориям</h2>
          {pieData.length > 0 && totalSpent > 0 ? (
            <div className="h-64 sm:h-80">
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
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CATEGORY_COLORS[entry.category] || PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${Number(value).toLocaleString()} ₽`} />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ paddingTop: '20px' }}
                    formatter={(value) => <span className="text-sm text-gray-700">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <i className="ri-pie-chart-line text-4xl mb-2"></i>
                <p>Нет данных о расходах</p>
                <p className="text-sm">Добавьте расходы в разделе "Финансы"</p>
              </div>
            </div>
          )}
        </Card>

        {/* Bar Chart */}
        <Card>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Расходы по месяцам</h2>
          {monthlyData.length > 0 ? (
            <div className="h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}к`}
                    width={45}
                  />
                  <Tooltip
                    formatter={(value) => [`${Number(value).toLocaleString()} ₽`, 'Расходы']}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Расходы" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <i className="ri-bar-chart-line text-4xl mb-2"></i>
                <p>Нет данных о расходах</p>
                <p className="text-sm">Добавьте расходы в разделе "Финансы"</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Детализация по категориям</h2>
        {categoryExpenses.length > 0 ? (
          <div className="space-y-4">
            {categoryExpenses.map((expense) => (
              <div key={expense.category} className="flex items-center space-x-4">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: CATEGORY_COLORS[expense.category] }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {CATEGORY_LABELS[expense.category]}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {expense.amount.toLocaleString()} ₽
                    </span>
                  </div>
                  <ProgressBar
                    value={expense.percentage}
                    color={
                      expense.category === 'SALARY' ? 'blue' :
                      expense.category === 'TAXES' ? 'red' :
                      expense.category === 'EQUIPMENT' ? 'green' :
                      expense.category === 'SERVICES' ? 'purple' : 'orange'
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {expense.percentage.toFixed(1)}% от общих расходов
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <i className="ri-list-check text-4xl mb-2"></i>
            <p>Нет данных о расходах</p>
          </div>
        )}
      </Card>

      {/* Recent Transactions */}
      <Card>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Последние операции</h2>
        {recentTransactions.length > 0 ? (
          <div className="space-y-3">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLORS[tx.category] }}
                  />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{tx.description}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(tx.date).toLocaleDateString('ru-RU')} • {CATEGORY_LABELS[tx.category]}
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-red-600 text-sm">
                  -{tx.amount.toLocaleString()} ₽
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <i className="ri-file-list-line text-4xl mb-2"></i>
            <p>Нет операций</p>
            <p className="text-sm">Добавьте расходы в разделе "Финансы"</p>
          </div>
        )}
      </Card>

      {/* Ad Banner */}
      {!user?.isPremium && <AdBanner variant="finance" />}
    </div>
  );
}
