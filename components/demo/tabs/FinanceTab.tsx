'use client';

import { useState, useEffect } from 'react';
import { Card, ProgressBar, AdBanner } from '@/components/ui';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: 'SALARY' | 'TAXES' | 'EQUIPMENT' | 'SERVICES' | 'OTHER';
  date: string;
  createdAt: string;
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

const CATEGORY_COLORS: Record<string, 'blue' | 'green' | 'purple' | 'orange' | 'red'> = {
  SALARY: 'blue',
  TAXES: 'red',
  EQUIPMENT: 'green',
  SERVICES: 'purple',
  OTHER: 'orange',
};

const CATEGORY_ICONS: Record<string, { icon: string; bg: string; color: string }> = {
  SALARY: { icon: 'ri-user-line', bg: 'bg-blue-100', color: 'text-blue-600' },
  TAXES: { icon: 'ri-government-line', bg: 'bg-red-100', color: 'text-red-600' },
  EQUIPMENT: { icon: 'ri-computer-line', bg: 'bg-green-100', color: 'text-green-600' },
  SERVICES: { icon: 'ri-file-text-line', bg: 'bg-purple-100', color: 'text-purple-600' },
  OTHER: { icon: 'ri-more-line', bg: 'bg-orange-100', color: 'text-orange-600' },
};

export function FinanceTab() {
  const { user, token, refreshUser } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totals, setTotals] = useState<CategoryTotal[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'OTHER' as Transaction['category'],
    date: new Date().toISOString().split('T')[0],
  });

  const grantAmount = user?.project?.grantAmount || 500000;
  const remainingGrant = grantAmount - totalSpent;
  const spentPercentage = (totalSpent / grantAmount) * 100;

  const fetchTransactions = async () => {
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
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/finance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          description: formData.description,
          amount: parseInt(formData.amount),
          category: formData.category,
          date: formData.date,
        }),
      });

      if (response.ok) {
        setFormData({
          description: '',
          amount: '',
          category: 'OTHER',
          date: new Date().toISOString().split('T')[0],
        });
        setShowAddModal(false);
        await fetchTransactions();
        await refreshUser();
      }
    } catch (error) {
      console.error('Error creating transaction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token || !confirm('Удалить эту транзакцию?')) return;

    try {
      const response = await fetch(`/api/finance?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        await fetchTransactions();
        await refreshUser();
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Calculate category percentages
  const categoryExpenses = totals.map((t) => ({
    category: t.category,
    amount: t._sum.amount || 0,
    percentage: totalSpent > 0 ? ((t._sum.amount || 0) / totalSpent) * 100 : 0,
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
        <Card className="p-4 sm:p-6">
          <div className="text-center sm:text-left flex sm:flex-col items-center justify-between sm:justify-start">
            <p className="text-xs sm:text-sm text-gray-600 sm:mb-1">Сумма гранта</p>
            <p className="text-xl sm:text-3xl font-bold text-gray-900">{grantAmount.toLocaleString()} ₽</p>
          </div>
        </Card>
        <Card className="p-4 sm:p-6">
          <div className="text-center sm:text-left flex sm:flex-col items-center justify-between sm:justify-start">
            <p className="text-xs sm:text-sm text-gray-600 sm:mb-1">Потрачено</p>
            <p className="text-xl sm:text-3xl font-bold text-red-600">{totalSpent.toLocaleString()} ₽</p>
          </div>
        </Card>
        <Card className="p-4 sm:p-6">
          <div className="text-center sm:text-left flex sm:flex-col items-center justify-between sm:justify-start">
            <p className="text-xs sm:text-sm text-gray-600 sm:mb-1">Остаток</p>
            <p className="text-xl sm:text-3xl font-bold text-green-600">{remainingGrant.toLocaleString()} ₽</p>
          </div>
        </Card>
      </div>

      {/* Spending Progress */}
      <Card>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Использование гранта</h2>
        <div className="mb-4">
          <div className="flex justify-between text-xs sm:text-sm mb-2">
            <span className="text-gray-600">Потрачено</span>
            <span className="font-medium">{spentPercentage.toFixed(1)}%</span>
          </div>
          <ProgressBar value={spentPercentage} color="blue" />
        </div>
      </Card>

      {/* Expenses by Category */}
      {categoryExpenses.length > 0 && (
        <Card>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Расходы по категориям</h2>
          <div className="space-y-3 sm:space-y-4">
            {categoryExpenses.map((expense) => (
              <div key={expense.category}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm sm:text-base text-gray-700">{CATEGORY_LABELS[expense.category]}</span>
                  <span className="text-sm sm:text-base font-medium">{expense.amount.toLocaleString()} ₽</span>
                </div>
                <ProgressBar
                  value={expense.percentage}
                  color={CATEGORY_COLORS[expense.category]}
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Transactions List */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Операции</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary text-sm sm:text-base"
          >
            <i className="ri-add-line mr-1 sm:mr-2"></i>
            Добавить расход
          </button>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-6 sm:py-8 text-gray-500">
            <i className="ri-wallet-line text-3xl sm:text-4xl mb-2"></i>
            <p className="text-sm sm:text-base">Нет операций</p>
            <p className="text-xs sm:text-sm">Добавьте первый расход</p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {transactions.map((tx) => {
              const iconInfo = CATEGORY_ICONS[tx.category];
              return (
                <div
                  key={tx.id}
                  className="flex items-start sm:items-center justify-between p-3 bg-gray-50 rounded-lg group gap-2"
                >
                  <div className="flex items-start sm:items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconInfo.bg}`}>
                      <i className={`${iconInfo.icon} ${iconInfo.color} text-sm sm:text-base`}></i>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{tx.description}</p>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">
                        {formatDate(tx.date)} • {CATEGORY_LABELS[tx.category]}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                    <span className="font-semibold text-red-600 text-sm sm:text-base whitespace-nowrap">
                      -{tx.amount.toLocaleString()} ₽
                    </span>
                    <button
                      onClick={() => handleDelete(tx.id)}
                      className="sm:opacity-0 sm:group-hover:opacity-100 text-gray-400 hover:text-red-600 transition p-1"
                    >
                      <i className="ri-delete-bin-line"></i>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Ad Banner */}
      {!user?.isPremium && <AdBanner variant="finance" />}

      {/* Add Transaction Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Добавить расход"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание
            </label>
            <input
              type="text"
              className="input w-full"
              placeholder="Например: Заработная плата за январь"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Сумма (₽)
            </label>
            <input
              type="number"
              className="input w-full"
              placeholder="10000"
              min="1"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Категория
            </label>
            <select
              className="input w-full"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as Transaction['category'] })}
            >
              <option value="SALARY">Заработная плата</option>
              <option value="TAXES">Налоги</option>
              <option value="EQUIPMENT">Оборудование</option>
              <option value="SERVICES">Услуги сторонних лиц</option>
              <option value="OTHER">Прочие расходы</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Дата
            </label>
            <input
              type="date"
              className="input w-full"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="btn btn-secondary flex-1"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary flex-1"
            >
              {isSubmitting ? 'Сохранение...' : 'Добавить'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
