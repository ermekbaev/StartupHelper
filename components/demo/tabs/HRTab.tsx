'use client';

import { useState, useEffect } from 'react';
import { Card, Badge, AdBanner, ProgressBar } from '@/components/ui';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';

interface Employee {
  id: string;
  name: string;
  position: string;
  hireDate: string;
  birthDate: string | null;
  status: 'ACTIVE' | 'DISMISSED';
  militaryStatus: 'UPDATED' | 'NEEDS_UPDATE' | 'NOT_APPLICABLE';
}

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

const colors = ['blue', 'purple', 'green', 'orange', 'red', 'indigo'];

export function HRTab() {
  const { token, user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // HR Checklists state
  const [hrChecklists, setHrChecklists] = useState<Checklist[]>([]);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showAddChecklistModal, setShowAddChecklistModal] = useState(false);
  const [selectedChecklistId, setSelectedChecklistId] = useState<string | null>(null);
  const [isTaskSubmitting, setIsTaskSubmitting] = useState(false);
  const [newChecklistTasks, setNewChecklistTasks] = useState<string[]>(['']);

  const fetchEmployees = async () => {
    if (!token) return;

    try {
      const response = await fetch('/api/employees', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setEmployees(data.employees);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch HR checklists
  const fetchHrChecklists = async () => {
    if (!token) return;

    try {
      const response = await fetch('/api/checklists?category=HR', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setHrChecklists(data.checklists);
      }
    } catch (error) {
      console.error('Error fetching HR checklists:', error);
    }
  };

  // Create new HR checklist
  const handleAddChecklist = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token || isSubmitting) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const tasks = newChecklistTasks.filter(t => t.trim());

    if (!title) {
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
        body: JSON.stringify({
          title,
          tasks,
          category: 'HR',
        }),
      });

      if (response.ok) {
        setShowAddChecklistModal(false);
        setNewChecklistTasks(['']);
        await fetchHrChecklists();
      }
    } catch (error) {
      console.error('Error creating HR checklist:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete checklist
  const handleDeleteChecklist = async (id: string) => {
    if (!token || !confirm('Удалить этот чек-лист?')) return;

    try {
      const response = await fetch(`/api/checklists?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        await fetchHrChecklists();
      }
    } catch (error) {
      console.error('Error deleting checklist:', error);
    }
  };

  // Toggle task completion
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
        await fetchHrChecklists();
      }
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  // Add new task to HR checklist
  const handleAddTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token || !selectedChecklistId || isTaskSubmitting) return;

    setIsTaskSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const taskText = formData.get('taskText') as string;
    const deadline = formData.get('deadline') as string;

    if (!taskText?.trim()) {
      setIsTaskSubmitting(false);
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
        await fetchHrChecklists();
      }
    } catch (error) {
      console.error('Error adding task:', error);
    } finally {
      setIsTaskSubmitting(false);
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    if (!token) return;

    try {
      const response = await fetch(`/api/checklists/tasks?id=${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        await fetchHrChecklists();
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const openAddTaskModal = (checklistId: string) => {
    setSelectedChecklistId(checklistId);
    setShowAddTaskModal(true);
  };

  useEffect(() => {
    fetchEmployees();
    fetchHrChecklists();
  }, [token]);

  const handleAddEmployee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token || isSubmitting) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.get('name'),
          position: formData.get('position'),
          hireDate: formData.get('hireDate'),
          birthDate: formData.get('birthDate') || null,
          militaryStatus: formData.get('militaryStatus') || 'NOT_APPLICABLE',
        }),
      });

      if (response.ok) {
        setShowAddEmployeeModal(false);
        await fetchEmployees();
      }
    } catch (error) {
      console.error('Error creating employee:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!token || !confirm('Удалить этого сотрудника?')) return;

    try {
      const response = await fetch(`/api/employees?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        await fetchEmployees();
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
    }
  };

  const handleUpdateStatus = async (id: string, status: 'ACTIVE' | 'DISMISSED') => {
    if (!token) return;

    try {
      const response = await fetch('/api/employees', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, status }),
      });

      if (response.ok) {
        await fetchEmployees();
      }
    } catch (error) {
      console.error('Error updating employee:', error);
    }
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : name.substring(0, 2).toUpperCase();
  };

  const getColor = (index: number) => colors[index % colors.length];

  const getMilitaryBadge = (status: Employee['militaryStatus']) => {
    switch (status) {
      case 'UPDATED':
        return <Badge variant="green">Актуален</Badge>;
      case 'NEEDS_UPDATE':
        return <Badge variant="yellow">Требует обновления</Badge>;
      case 'NOT_APPLICABLE':
        return <Badge variant="gray">Не применимо</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Get upcoming birthdays
  const upcomingBirthdays = employees
    .filter(emp => emp.birthDate && emp.status === 'ACTIVE')
    .map(emp => {
      const birthDate = new Date(emp.birthDate!);
      const today = new Date();
      const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());

      // If birthday already passed this year, use next year
      if (thisYearBirthday < today) {
        thisYearBirthday.setFullYear(today.getFullYear() + 1);
      }

      const daysUntil = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      return { ...emp, daysUntil, nextBirthday: thisYearBirthday };
    })
    .filter(emp => emp.daysUntil <= 30)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Upcoming Birthdays */}
      {upcomingBirthdays.length > 0 && (
        <Card>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
            <i className="ri-cake-2-line text-pink-500 mr-2"></i>
            Ближайшие дни рождения
          </h2>
          <div className="space-y-2 sm:space-y-3">
            {upcomingBirthdays.map(emp => (
              <div key={emp.id} className="flex items-center justify-between p-2 sm:p-3 bg-pink-50 rounded-lg border border-pink-100 gap-2">
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0`}>
                    <span className="text-pink-600 font-medium text-xs sm:text-sm">{getInitials(emp.name)}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{emp.name}</p>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">{emp.position}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-medium text-pink-600 text-xs sm:text-sm">
                    {emp.daysUntil === 0 ? 'Сегодня!' : emp.daysUntil === 1 ? 'Завтра' : `Через ${emp.daysUntil} дн.`}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {emp.nextBirthday.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Employees */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Сотрудники</h1>
          <button onClick={() => setShowAddEmployeeModal(true)} className="btn btn-primary text-sm sm:text-base">
            <i className="ri-add-line mr-1"></i>
            Добавить сотрудника
          </button>
        </div>

        {employees.length === 0 ? (
          <div className="text-center py-8 sm:py-12 text-gray-500">
            <i className="ri-user-line text-3xl sm:text-4xl mb-2"></i>
            <p className="text-sm sm:text-base">Нет сотрудников</p>
            <p className="text-xs sm:text-sm">Добавьте первого сотрудника</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-header">Сотрудник</th>
                    <th className="table-header">Должность</th>
                    <th className="table-header">Дата приёма</th>
                    <th className="table-header">День рождения</th>
                    <th className="table-header">Воинский учёт</th>
                    <th className="table-header">Статус</th>
                    <th className="table-header"></th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee, index) => (
                    <tr key={employee.id}>
                      <td className="table-cell">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 bg-${getColor(index)}-100 rounded-full flex items-center justify-center`}>
                            <span className={`text-${getColor(index)}-600 font-medium`}>{getInitials(employee.name)}</span>
                          </div>
                          <span className="font-medium text-gray-900">{employee.name}</span>
                        </div>
                      </td>
                      <td className="table-cell text-gray-600">{employee.position}</td>
                      <td className="table-cell text-gray-600">{formatDate(employee.hireDate)}</td>
                      <td className="table-cell text-gray-600">
                        {employee.birthDate ? (
                          <span className="flex items-center space-x-1">
                            <i className="ri-cake-2-line text-pink-500"></i>
                            <span>{formatDate(employee.birthDate)}</span>
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="table-cell">{getMilitaryBadge(employee.militaryStatus)}</td>
                      <td className="table-cell">
                        <button
                          onClick={() => handleUpdateStatus(employee.id, employee.status === 'ACTIVE' ? 'DISMISSED' : 'ACTIVE')}
                          className="cursor-pointer"
                        >
                          <Badge variant={employee.status === 'ACTIVE' ? 'green' : 'gray'}>
                            {employee.status === 'ACTIVE' ? 'Работает' : 'Уволен'}
                          </Badge>
                        </button>
                      </td>
                      <td className="table-cell">
                        <button onClick={() => handleDeleteEmployee(employee.id)} className="btn btn-danger p-1">
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-3">
              {employees.map((employee, index) => (
                <div key={employee.id} className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                      <div className={`w-10 h-10 bg-${getColor(index)}-100 rounded-full flex items-center justify-center flex-shrink-0`}>
                        <span className={`text-${getColor(index)}-600 font-medium text-sm`}>{getInitials(employee.name)}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{employee.name}</p>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">{employee.position}</p>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteEmployee(employee.id)} className="text-gray-400 hover:text-red-600 p-1">
                      <i className="ri-delete-bin-line"></i>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                    <div>
                      <span className="text-gray-500">Принят:</span>
                      <span className="ml-1 text-gray-900">{formatDate(employee.hireDate)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">ДР:</span>
                      <span className="ml-1">
                        {employee.birthDate ? formatDate(employee.birthDate) : '—'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getMilitaryBadge(employee.militaryStatus)}
                      <button
                        onClick={() => handleUpdateStatus(employee.id, employee.status === 'ACTIVE' ? 'DISMISSED' : 'ACTIVE')}
                        className="cursor-pointer"
                      >
                        <Badge variant={employee.status === 'ACTIVE' ? 'green' : 'gray'}>
                          {employee.status === 'ACTIVE' ? 'Работает' : 'Уволен'}
                        </Badge>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* HR Checklists */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Кадровые чек-листы</h2>
          <button onClick={() => setShowAddChecklistModal(true)} className="btn btn-primary text-sm sm:text-base">
            <i className="ri-add-line mr-1"></i>
            Добавить чек-лист
          </button>
        </div>

        {hrChecklists.length === 0 ? (
          <div className="text-center py-8 sm:py-12 text-gray-500">
            <i className="ri-checkbox-line text-3xl sm:text-4xl mb-2"></i>
            <p className="text-sm sm:text-base">Нет кадровых чек-листов</p>
            <p className="text-xs sm:text-sm">Создайте первый чек-лист для кадров</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-stretch">
            {hrChecklists.map(checklist => {
              const completedTasks = checklist.tasks.filter(t => t.completed).length;
              const totalTasks = checklist.tasks.length;
              const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

              return (
                <div key={checklist.id} className="border border-gray-200 rounded-lg p-4 sm:p-6 flex flex-col">
                  <div className="flex justify-between items-start mb-3 sm:mb-4 gap-2">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">{checklist.title}</h3>
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
        onClose={() => { setShowAddChecklistModal(false); setNewChecklistTasks(['']); }}
        title="Новый кадровый чек-лист"
        maxWidth="lg"
      >
        <form onSubmit={handleAddChecklist} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Название чек-листа</label>
            <input name="title" type="text" required className="input w-full text-sm sm:text-base" placeholder="Например: Приём нового сотрудника" />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700">Задачи</label>
              <span className="text-xs text-gray-500">(опционально)</span>
            </div>
            <div className="space-y-2">
              {newChecklistTasks.map((task, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={task}
                    onChange={(e) => {
                      const updated = [...newChecklistTasks];
                      updated[index] = e.target.value;
                      setNewChecklistTasks(updated);
                    }}
                    className="input w-full text-sm sm:text-base"
                    placeholder={`Задача ${index + 1}`}
                  />
                  {newChecklistTasks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setNewChecklistTasks(prev => prev.filter((_, i) => i !== index))}
                      className="p-2 text-gray-400 hover:text-red-600 transition"
                    >
                      <i className="ri-delete-bin-line"></i>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setNewChecklistTasks(prev => [...prev, ''])}
              className="mt-2 text-blue-600 text-xs sm:text-sm font-medium hover:text-blue-700 flex items-center"
            >
              <i className="ri-add-line mr-1"></i>
              Добавить задачу
            </button>
          </div>
          <div className="flex gap-2 sm:gap-3 pt-2">
            <button type="button" onClick={() => { setShowAddChecklistModal(false); setNewChecklistTasks(['']); }} className="btn btn-secondary flex-1 text-sm sm:text-base">
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
            <button type="submit" disabled={isTaskSubmitting} className="btn btn-primary flex-1 text-sm sm:text-base">
              {isTaskSubmitting ? 'Добавление...' : 'Добавить'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Employee Modal */}
      <Modal
        isOpen={showAddEmployeeModal}
        onClose={() => setShowAddEmployeeModal(false)}
        title="Добавить сотрудника"
        maxWidth="lg"
      >
        <form onSubmit={handleAddEmployee} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">ФИО</label>
            <input name="name" type="text" required className="input w-full text-sm sm:text-base" placeholder="Иванов Иван Иванович" />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Должность</label>
            <input name="position" type="text" required className="input w-full text-sm sm:text-base" placeholder="Должность" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Дата приёма</label>
              <input name="hireDate" type="date" required className="input w-full text-sm sm:text-base" />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Дата рождения <span className="text-gray-400">(опционально)</span>
              </label>
              <input name="birthDate" type="date" className="input w-full text-sm sm:text-base" />
            </div>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Воинский учёт</label>
            <select name="militaryStatus" className="select w-full text-sm sm:text-base" defaultValue="NOT_APPLICABLE">
              <option value="NOT_APPLICABLE">Не применимо</option>
              <option value="UPDATED">Актуален</option>
              <option value="NEEDS_UPDATE">Требует обновления</option>
            </select>
          </div>
          <p className="text-[10px] sm:text-xs text-gray-500">
            <i className="ri-calendar-line mr-1"></i>
            Дни рождения сотрудников будут отображаться в календаре
          </p>
          <div className="flex gap-2 sm:gap-3 pt-2">
            <button type="button" onClick={() => setShowAddEmployeeModal(false)} className="btn btn-secondary flex-1 text-sm sm:text-base">
              Отмена
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary flex-1 text-sm sm:text-base">
              {isSubmitting ? 'Добавление...' : 'Добавить'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Ad Banner */}
      {!user?.isPremium && <AdBanner variant="hr" />}
    </div>
  );
}
