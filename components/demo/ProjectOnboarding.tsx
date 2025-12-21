'use client';

import { useState } from 'react';
import { Card } from '@/components/ui';

interface ProjectOnboardingProps {
  onCreateProject: (name: string, grantAmount: number) => Promise<void>;
}

export function ProjectOnboarding({ onCreateProject }: ProjectOnboardingProps) {
  const [projectName, setProjectName] = useState('');
  const [grantAmount, setGrantAmount] = useState(500000);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await onCreateProject(projectName, grantAmount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Создайте свой проект</h1>
          <p className="text-gray-600 mt-2">
            Для начала работы укажите информацию о вашем грантовом проекте
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-1">
                Название проекта
              </label>
              <input
                id="projectName"
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder='Например: ИТ-стартап "EcoDelivery"'
              />
            </div>

            <div>
              <label htmlFor="grantAmount" className="block text-sm font-medium text-gray-700 mb-1">
                Сумма гранта (руб.)
              </label>
              <input
                id="grantAmount"
                type="number"
                value={grantAmount}
                onChange={(e) => setGrantAmount(Number(e.target.value))}
                required
                min={1}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
              <p className="text-sm text-gray-500 mt-1">
                Стандартная сумма гранта: 500 000 руб.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Создание...' : 'Создать проект'}
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
