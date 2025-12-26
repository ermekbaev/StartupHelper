'use client';

import { useState, useEffect } from 'react';
import { Card, ProgressBar, AdBanner } from '@/components/ui';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';

interface Task {
  id: string;
  text: string;
  completed: boolean;
  deadline: string | null;
}

interface Checklist {
  id: string;
  title: string;
  category: 'HR' | 'FINANCE' | null;
  tasks: Task[];
}

export function ChecklistsTab() {
  const { token, user } = useAuth();
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddChecklistModal, setShowAddChecklistModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [selectedChecklistId, setSelectedChecklistId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchChecklists = async () => {
    if (!token) return;

    try {
      const response = await fetch('/api/checklists', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setChecklists(data.checklists);
      }
    } catch (error) {
      console.error('Error fetching checklists:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChecklists();
  }, [token]);

  const handleAddChecklist = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token || isSubmitting) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const category = formData.get('category') as string;
    const tasks: string[] = [];

    for (let i = 1; i <= 5; i++) {
      const taskText = formData.get(`task-${i}`) as string;
      if (taskText && taskText.trim()) {
        tasks.push(taskText.trim());
      }
    }

    if (!title || tasks.length === 0) {
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/checklists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, tasks, category: category || null }),
      });

      if (response.ok) {
        setShowAddChecklistModal(false);
        await fetchChecklists();
      }
    } catch (error) {
      console.error('Error creating checklist:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteChecklist = async (id: string) => {
    if (!token || !confirm('Удалить этот чек-лист?')) return;

    try {
      const response = await fetch(`/api/checklists?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        await fetchChecklists();
      }
    } catch (error) {
      console.error('Error deleting checklist:', error);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    if (!token) return;

    try {
      const response = await fetch('/api/checklists/tasks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ taskId }),
      });

      if (response.ok) {
        await fetchChecklists();
      }
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const handleAddTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token || !selectedChecklistId || isSubmitting) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const taskText = formData.get('taskText') as string;
    const deadline = formData.get('deadline') as string;

    if (!taskText || !taskText.trim()) {
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/checklists/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          checklistId: selectedChecklistId,
          text: taskText.trim(),
          deadline: deadline || null,
        }),
      });

      if (response.ok) {
        setShowAddTaskModal(false);
        setSelectedChecklistId(null);
        await fetchChecklists();
      }
    } catch (error) {
      console.error('Error adding task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!token) return;

    try {
      const response = await fetch(`/api/checklists/tasks?id=${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        await fetchChecklists();
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const openAddTaskModal = (checklistId: string) => {
    setSelectedChecklistId(checklistId);
    setShowAddTaskModal(true);
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
      <Card>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Чек-листы</h1>
          <button onClick={() => setShowAddChecklistModal(true)} className="btn btn-primary text-sm sm:text-base">
            <i className="ri-add-line mr-1"></i>
            Добавить чек-лист
          </button>
        </div>

        {checklists.length === 0 ? (
          <div className="text-center py-8 sm:py-12 text-gray-500">
            <i className="ri-checkbox-line text-3xl sm:text-4xl mb-2"></i>
            <p className="text-sm sm:text-base">Нет чек-листов</p>
            <p className="text-xs sm:text-sm">Создайте первый чек-лист</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-stretch">
            {checklists.map(checklist => {
              const completedTasks = checklist.tasks.filter(t => t.completed).length;
              const totalTasks = checklist.tasks.length;
              const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
              const categoryLabel = checklist.category === 'HR' ? 'Кадры' : checklist.category === 'FINANCE' ? 'Финансы' : null;
              const categoryColor = checklist.category === 'HR' ? 'bg-purple-100 text-purple-700' : checklist.category === 'FINANCE' ? 'bg-green-100 text-green-700' : '';

              return (
                <div key={checklist.id} className="border border-gray-200 rounded-lg p-4 sm:p-6 flex flex-col">
                  <div className="flex justify-between items-start mb-3 sm:mb-4 gap-2">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">{checklist.title}</h3>
                      {categoryLabel && (
                        <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full w-fit ${categoryColor}`}>
                          {categoryLabel}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteChecklist(checklist.id)}
                      className="text-gray-400 hover:text-red-600 transition p-1"
                    >
                      <i className="ri-delete-bin-line"></i>
                    </button>
                  </div>

                  <div className="space-y-2 sm:space-y-3 flex-1">
                    {checklist.tasks.map(task => {
                      const isOverdue = task.deadline && !task.completed && new Date(task.deadline) < new Date();
                      const deadlineDate = task.deadline ? new Date(task.deadline) : null;

                      return (
                        <div key={task.id} className="flex items-start space-x-2 sm:space-x-3 group">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => handleToggleTask(task.id)}
                            className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 cursor-pointer mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <span className={`text-sm sm:text-base ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                              {task.text}
                            </span>
                            {task.deadline && (
                              <div className={`text-[10px] sm:text-xs mt-0.5 flex items-center space-x-1 ${
                                isOverdue ? 'text-red-600' : 'text-gray-500'
                              }`}>
                                <i className="ri-calendar-line"></i>
                                <span>
                                  {deadlineDate?.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}
                                  {isOverdue && ' (просрочено)'}
                                </span>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="sm:opacity-0 sm:group-hover:opacity-100 text-gray-400 hover:text-red-600 transition p-1"
                          >
                            <i className="ri-close-line text-sm"></i>
                          </button>
                        </div>
                      );
                    })}

                    <button
                      onClick={() => openAddTaskModal(checklist.id)}
                      className="text-blue-600 text-xs sm:text-sm font-medium hover:text-blue-700 cursor-pointer flex items-center space-x-1 mt-2"
                    >
                      <i className="ri-add-line"></i>
                      <span>Добавить задачу</span>
                    </button>
                  </div>

                  <div className="mt-auto pt-4 sm:pt-6 border-t border-gray-200">
                    <div className="flex justify-between text-xs sm:text-sm mb-2">
                      <span className="text-gray-600">Прогресс:</span>
                      <span className="text-blue-600 font-medium">{completedTasks}/{totalTasks} выполнено</span>
                    </div>
                    <ProgressBar value={progress} color="blue" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Add Checklist Modal */}
      <Modal
        isOpen={showAddChecklistModal}
        onClose={() => setShowAddChecklistModal(false)}
        title="Новый чек-лист"
        maxWidth="lg"
      >
        <form onSubmit={handleAddChecklist} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Название чек-листа</label>
            <input name="title" type="text" required className="input w-full text-sm sm:text-base" placeholder="Например: Запуск проекта" />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Категория</label>
            <select name="category" className="input w-full text-sm sm:text-base">
              <option value="">Без категории (общий)</option>
              <option value="HR">Кадры</option>
              <option value="FINANCE">Финансы</option>
            </select>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
              <i className="ri-folder-line mr-1"></i>
              Чек-листы с категорией отображаются в соответствующих разделах
            </p>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Задачи</label>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <input
                  key={i}
                  name={`task-${i}`}
                  type="text"
                  className="input w-full text-sm sm:text-base"
                  placeholder={`Задача ${i}${i > 2 ? ' (опционально)' : ''}`}
                  required={i <= 2}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3 pt-2">
            <button type="button" onClick={() => setShowAddChecklistModal(false)} className="btn btn-secondary flex-1 text-sm sm:text-base">
              Отмена
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary flex-1 text-sm sm:text-base">
              {isSubmitting ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Task Modal */}
      <Modal
        isOpen={showAddTaskModal}
        onClose={() => { setShowAddTaskModal(false); setSelectedChecklistId(null); }}
        title="Добавить задачу"
      >
        <form onSubmit={handleAddTask} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Текст задачи</label>
            <input name="taskText" type="text" required className="input w-full text-sm sm:text-base" placeholder="Введите текст задачи" />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Дедлайн <span className="text-gray-400">(опционально)</span>
            </label>
            <input name="deadline" type="date" className="input w-full text-sm sm:text-base" />
            <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
              <i className="ri-calendar-line mr-1"></i>
              Задачи с дедлайном появятся в календаре
            </p>
          </div>
          <div className="flex gap-2 sm:gap-3 pt-2">
            <button type="button" onClick={() => { setShowAddTaskModal(false); setSelectedChecklistId(null); }} className="btn btn-secondary flex-1 text-sm sm:text-base">
              Отмена
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary flex-1 text-sm sm:text-base">
              {isSubmitting ? 'Добавление...' : 'Добавить'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Ad Banner */}
      {!user?.isPremium && <AdBanner variant="default" />}
    </div>
  );
}
