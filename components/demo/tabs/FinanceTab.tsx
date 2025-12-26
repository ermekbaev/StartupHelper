'use client';

import { useState, useEffect } from 'react';
import { Card, ProgressBar, AdBanner } from '@/components/ui';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';

type FinanceSubTab = 'salary' | 'taxes' | 'services' | 'equipment' | 'other';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: 'SALARY' | 'TAXES' | 'EQUIPMENT' | 'SERVICES' | 'OTHER';
  date: string;
  createdAt: string;
}

const subTabs: { id: FinanceSubTab; label: string; category: Transaction['category']; icon: string; color: string }[] = [
  { id: 'salary', label: 'Заработная плата', category: 'SALARY', icon: 'ri-user-line', color: 'blue' },
  { id: 'taxes', label: 'Налоги', category: 'TAXES', icon: 'ri-government-line', color: 'red' },
  { id: 'services', label: 'Услуги сторонних лиц', category: 'SERVICES', icon: 'ri-file-text-line', color: 'purple' },
  { id: 'equipment', label: 'Оборудование', category: 'EQUIPMENT', icon: 'ri-computer-line', color: 'green' },
  { id: 'other', label: 'Прочие расходы', category: 'OTHER', icon: 'ri-more-line', color: 'orange' },
];

const CATEGORY_LABELS: Record<string, string> = {
  SALARY: 'Заработная плата',
  TAXES: 'Налоги',
  EQUIPMENT: 'Оборудование',
  SERVICES: 'Услуги сторонних лиц',
  OTHER: 'Прочие расходы',
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  SALARY: 'Выплаты сотрудникам, премии, отпускные',
  TAXES: 'НДФЛ, страховые взносы, налог по УСН',
  EQUIPMENT: 'Компьютеры, оргтехника, мебель',
  SERVICES: 'Бухгалтерия, юридические услуги, консалтинг',
  OTHER: 'Командировки, канцелярия, прочее',
};

export function FinanceTab() {
  const { user, token, refreshUser } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<FinanceSubTab>('salary');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
  });

  const grantAmount = user?.project?.grantAmount || 500000;
  const remainingGrant = grantAmount - totalSpent;

  // Get current category from active subtab
  const currentTab = subTabs.find((t) => t.id === activeSubTab)!;
  const currentCategory = currentTab.category;

  // Filter transactions by current category
  const categoryTransactions = transactions.filter((tx) => tx.category === currentCategory);
  const categoryTotal = categoryTransactions.reduce((sum, tx) => sum + tx.amount, 0);

  // Calculate percentage of grant for this category
  const categoryPercentage = (categoryTotal / grantAmount) * 100;

  // Limits for services (25% max according to grant rules)
  const servicesLimit = currentCategory === 'SERVICES' ? 25 : null;
  const isOverLimit = servicesLimit && categoryPercentage > servicesLimit;

  const fetchTransactions = async () => {
    if (!token) return;

    try {
      const response = await fetch('/api/finance', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions);
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
          category: currentCategory,
          date: formData.date,
        }),
      });

      if (response.ok) {
        setFormData({
          description: '',
          amount: '',
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
    if (!token || !confirm('Удалить эту операцию?')) return;

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
      month: 'short',
      year: 'numeric',
    });
  };

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
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Финансы</h1>
        <p className="text-sm text-gray-600">Учёт расходов по категориям грантовых средств</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-600">Сумма гранта</p>
          <p className="text-lg sm:text-xl font-bold text-gray-900">{grantAmount.toLocaleString()} ₽</p>
        </Card>
        <Card className="p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-600">Потрачено</p>
          <p className="text-lg sm:text-xl font-bold text-red-600">{totalSpent.toLocaleString()} ₽</p>
        </Card>
        <Card className="p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-600">Остаток</p>
          <p className="text-lg sm:text-xl font-bold text-green-600">{remainingGrant.toLocaleString()} ₽</p>
        </Card>
      </div>

      {/* Category Tabs */}
      <Card>
        <div className="flex flex-wrap gap-2 mb-6">
          {subTabs.map((tab) => {
            const tabTransactions = transactions.filter((tx) => tx.category === tab.category);
            const tabTotal = tabTransactions.reduce((sum, tx) => sum + tx.amount, 0);

            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeSubTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <i className={tab.icon}></i>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                {tabTotal > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeSubTab === tab.id ? 'bg-white/20' : 'bg-gray-200'
                  }`}>
                    {tabTransactions.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Category Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center space-x-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-${currentTab.color}-100`}>
                <i className={`${currentTab.icon} text-${currentTab.color}-600`}></i>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{currentTab.label}</h2>
                <p className="text-sm text-gray-500">{CATEGORY_DESCRIPTIONS[currentCategory]}</p>
              </div>
            </div>
          </div>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            <i className="ri-add-line mr-1"></i>
            Добавить расход
          </button>
        </div>

        {/* Category Stats */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Потрачено на {currentTab.label.toLowerCase()}</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{categoryTotal.toLocaleString()} ₽</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Операций</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{categoryTransactions.length}</p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-sm text-gray-600">
                {servicesLimit ? `Лимит (${servicesLimit}% от гранта)` : 'От суммы гранта'}
              </p>
              <p className={`text-xl sm:text-2xl font-bold ${isOverLimit ? 'text-red-600' : 'text-gray-900'}`}>
                {categoryPercentage.toFixed(1)}%
              </p>
            </div>
          </div>

          {servicesLimit && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Использовано от лимита</span>
                <span className={isOverLimit ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                  {categoryPercentage.toFixed(1)}% / {servicesLimit}%
                </span>
              </div>
              <ProgressBar
                value={categoryPercentage}
                max={servicesLimit}
                color={isOverLimit ? 'red' : categoryPercentage > servicesLimit * 0.8 ? 'orange' : 'green'}
              />
              {isOverLimit && (
                <p className="text-xs text-red-600 mt-2 flex items-center">
                  <i className="ri-alert-line mr-1"></i>
                  Превышен лимит расходов на услуги сторонних лиц!
                </p>
              )}
            </div>
          )}
        </div>

        {/* Transactions List */}
        {categoryTransactions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <i className={`${currentTab.icon} text-4xl mb-3`}></i>
            <p className="font-medium">Нет операций в категории "{currentTab.label}"</p>
            <p className="text-sm mt-1">Нажмите "Добавить расход" чтобы добавить первую операцию</p>
          </div>
        ) : (
          <div className="space-y-3">
            {categoryTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition group"
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-${currentTab.color}-100 flex-shrink-0`}>
                    <i className={`${currentTab.icon} text-${currentTab.color}-600`}></i>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">{tx.description}</p>
                    <p className="text-sm text-gray-500">{formatDate(tx.date)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 flex-shrink-0">
                  <span className="font-bold text-lg text-gray-900">{tx.amount.toLocaleString()} ₽</span>
                  <button
                    onClick={() => handleDelete(tx.id)}
                    className="sm:opacity-0 sm:group-hover:opacity-100 text-gray-400 hover:text-red-600 transition p-2"
                  >
                    <i className="ri-delete-bin-line"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Ad Banner */}
      {!user?.isPremium && <AdBanner variant="finance" />}

      {/* Add Transaction Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title={`Добавить расход: ${currentTab.label}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg mb-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-${currentTab.color}-100`}>
              <i className={`${currentTab.icon} text-${currentTab.color}-600`}></i>
            </div>
            <div>
              <p className="font-medium text-gray-900">{currentTab.label}</p>
              <p className="text-sm text-gray-500">{CATEGORY_DESCRIPTIONS[currentCategory]}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Сумма (₽)</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Дата</label>
            <input
              type="date"
              className="input w-full"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary flex-1">
              Отмена
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary flex-1">
              {isSubmitting ? 'Сохранение...' : 'Добавить'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
