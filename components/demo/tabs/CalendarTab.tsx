'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, AdBanner } from '@/components/ui';
import { Modal } from '@/components/ui/Modal';
import { useCalendar } from '@/hooks/useCalendar';
import { useAuth } from '@/contexts/AuthContext';
import { MONTH_NAMES } from '@/lib/demo-data';

interface EmployeeBirthday {
  id: string;
  name: string;
  birthDate: string;
}

interface TaskDeadline {
  id: string;
  text: string;
  deadline: string;
  checklist: { title: string };
}

interface FinancialReminder {
  id: string;
  title: string;
  date: string;
  type: 'finance';
  priority: 'NORMAL' | 'IMPORTANT' | 'URGENT';
}

interface CustomEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  priority: 'NORMAL' | 'IMPORTANT' | 'URGENT';
  description?: string;
}

interface AggregatedEvent {
  id: string;
  title: string;
  date: Date;
  time?: string;
  location?: string;
  priority: 'NORMAL' | 'IMPORTANT' | 'URGENT';
  type: 'birthday' | 'deadline' | 'finance' | 'report' | 'custom';
  description?: string;
}

const EVENT_TYPE_CONFIG = {
  birthday: { icon: 'ri-cake-2-line', bgColor: 'bg-pink-100', textColor: 'text-pink-600', label: 'День рождения' },
  deadline: { icon: 'ri-checkbox-circle-line', bgColor: 'bg-orange-100', textColor: 'text-orange-600', label: 'Дедлайн' },
  finance: { icon: 'ri-money-dollar-circle-line', bgColor: 'bg-green-100', textColor: 'text-green-600', label: 'Финансы' },
  report: { icon: 'ri-file-list-3-line', bgColor: 'bg-red-100', textColor: 'text-red-600', label: 'Отчёт' },
  custom: { icon: 'ri-calendar-event-line', bgColor: 'bg-blue-100', textColor: 'text-blue-600', label: 'Событие' },
};

export function CalendarTab() {
  const { token, user } = useAuth();
  const { currentYear, currentMonth, daysInMonth, firstDayOfMonth, goToPreviousMonth, goToNextMonth, isToday } = useCalendar();

  const [employees, setEmployees] = useState<EmployeeBirthday[]>([]);
  const [tasks, setTasks] = useState<TaskDeadline[]>([]);
  const [financialReminders, setFinancialReminders] = useState<FinancialReminder[]>([]);
  const [customEvents, setCustomEvents] = useState<CustomEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'birthday' | 'deadline' | 'finance' | 'report' | 'custom'>('all');

  // New event form state
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [newEventPriority, setNewEventPriority] = useState<'NORMAL' | 'IMPORTANT' | 'URGENT'>('NORMAL');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCalendarData = async () => {
    if (!token) return;

    try {
      const response = await fetch('/api/calendar', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setEmployees(data.employees || []);
        setTasks(data.tasks || []);
        setFinancialReminders(data.financialReminders || []);
        setCustomEvents(data.customEvents || []);
      }
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEvent = async () => {
    if (!token || !newEventTitle || !newEventDate) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newEventTitle,
          date: newEventDate,
          time: newEventTime,
          location: newEventLocation,
          priority: newEventPriority,
          description: newEventDescription,
        }),
      });

      if (response.ok) {
        // Reset form
        setNewEventTitle('');
        setNewEventDate('');
        setNewEventTime('');
        setNewEventLocation('');
        setNewEventPriority('NORMAL');
        setNewEventDescription('');
        setShowAddEventModal(false);
        // Refresh data
        fetchCalendarData();
      }
    } catch (error) {
      console.error('Error adding event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!token) return;

    try {
      const response = await fetch(`/api/calendar?id=${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        fetchCalendarData();
      }
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const openAddEventForDate = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setNewEventDate(dateStr);
    setShowAddEventModal(true);
    setShowDateModal(false);
  };

  useEffect(() => {
    fetchCalendarData();
  }, [token]);

  // Aggregate all events into a unified format
  const aggregatedEvents = useMemo((): AggregatedEvent[] => {
    const allEvents: AggregatedEvent[] = [];

    // Birthday events (recurring yearly)
    employees.forEach(emp => {
      if (emp.birthDate) {
        const birthDate = new Date(emp.birthDate);
        const thisYearBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
        allEvents.push({
          id: `birthday-${emp.id}`,
          title: `День рождения: ${emp.name}`,
          date: thisYearBirthday,
          priority: 'NORMAL',
          type: 'birthday',
        });
      }
    });

    // Task deadlines
    tasks.forEach(task => {
      if (task.deadline) {
        allEvents.push({
          id: `deadline-${task.id}`,
          title: `${task.checklist.title}: ${task.text}`,
          date: new Date(task.deadline),
          priority: 'IMPORTANT',
          type: 'deadline',
        });
      }
    });

    // Financial reminders
    financialReminders.forEach(reminder => {
      allEvents.push({
        id: reminder.id,
        title: reminder.title,
        date: new Date(reminder.date),
        priority: reminder.priority,
        type: 'finance',
      });
    });

    // Report date reminders (5 days before and the day itself)
    const project = user?.project as { reportDates?: Array<{ id: string; title: string; date: string }> } | null;
    if (project?.reportDates) {
      project.reportDates.forEach(reportDate => {
        const reportDay = new Date(reportDate.date);

        // Add the report day itself
        allEvents.push({
          id: `report-${reportDate.id}`,
          title: `Сдача отчёта: ${reportDate.title}`,
          date: reportDay,
          priority: 'URGENT',
          type: 'report',
        });

        // Add reminders for 5, 4, 3, 2, 1 days before
        for (let daysBefore = 5; daysBefore >= 1; daysBefore--) {
          const reminderDate = new Date(reportDay);
          reminderDate.setDate(reminderDate.getDate() - daysBefore);

          allEvents.push({
            id: `report-reminder-${reportDate.id}-${daysBefore}`,
            title: `${reportDate.title}: осталось ${daysBefore} ${daysBefore === 1 ? 'день' : daysBefore < 5 ? 'дня' : 'дней'}`,
            date: reminderDate,
            priority: daysBefore <= 2 ? 'URGENT' : 'IMPORTANT',
            type: 'report',
          });
        }
      });
    }

    // Custom user events
    customEvents.forEach(event => {
      allEvents.push({
        id: `custom-${event.id}`,
        title: event.title,
        date: new Date(event.date),
        time: event.time,
        location: event.location,
        priority: event.priority,
        type: 'custom',
        description: event.description,
      });
    });

    return allEvents;
  }, [employees, tasks, financialReminders, customEvents, currentYear, user]);

  // Filter events based on active filter
  const filteredEvents = useMemo(() => {
    if (activeFilter === 'all') return aggregatedEvents;
    return aggregatedEvents.filter(e => e.type === activeFilter);
  }, [aggregatedEvents, activeFilter]);

  // Get events for a specific date
  const getDateEvents = (day: number): AggregatedEvent[] => {
    return filteredEvents.filter(event => {
      const eventDate = event.date;
      return (
        eventDate.getDate() === day &&
        eventDate.getMonth() === currentMonth &&
        eventDate.getFullYear() === currentYear
      );
    });
  };

  const hasEvents = (day: number) => getDateEvents(day).length > 0;
  const getEventsCount = (day: number) => getDateEvents(day).length;

  const getHighestPriority = (day: number): 'NORMAL' | 'IMPORTANT' | 'URGENT' | null => {
    const dayEvents = getDateEvents(day);
    if (dayEvents.length === 0) return null;
    if (dayEvents.some(e => e.priority === 'URGENT')) return 'URGENT';
    if (dayEvents.some(e => e.priority === 'IMPORTANT')) return 'IMPORTANT';
    return 'NORMAL';
  };

  const getDayEventTypes = (day: number): Set<AggregatedEvent['type']> => {
    const dayEvents = getDateEvents(day);
    return new Set(dayEvents.map(e => e.type));
  };

  const handleDateClick = (day: number) => {
    setSelectedDate(day);
    setShowDateModal(true);
  };

  // Get all upcoming events sorted by date
  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return filteredEvents
      .filter(event => event.date >= today)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 10);
  }, [filteredEvents]);

  const formatEventDate = (date: Date) => {
    return `${date.getDate()} ${MONTH_NAMES[date.getMonth()].toLowerCase()} ${date.getFullYear()}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
    <Card>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Календарь напоминаний</h1>
        <div className="flex items-center justify-center space-x-2 sm:space-x-4">
          <button onClick={goToPreviousMonth} className="btn btn-ghost w-8 h-8 p-0">
            <i className="ri-arrow-left-s-line text-xl text-gray-600"></i>
          </button>
          <div className="text-base sm:text-lg font-semibold text-gray-900 min-w-[140px] sm:min-w-[200px] text-center">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </div>
          <button onClick={goToNextMonth} className="btn btn-ghost w-8 h-8 p-0">
            <i className="ri-arrow-right-s-line text-xl text-gray-600"></i>
          </button>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 -mx-1 px-1 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition whitespace-nowrap ${
            activeFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Все
        </button>
        {Object.entries(EVENT_TYPE_CONFIG).map(([type, config]) => (
          <button
            key={type}
            onClick={() => setActiveFilter(type as typeof activeFilter)}
            className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition flex items-center space-x-1 whitespace-nowrap ${
              activeFilter === type ? `${config.bgColor} ${config.textColor}` : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <i className={`${config.icon} text-xs sm:text-sm`}></i>
            <span>{config.label}</span>
          </button>
        ))}
        <button
          onClick={() => setShowAddEventModal(true)}
          className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition flex items-center space-x-1 whitespace-nowrap bg-blue-600 text-white hover:bg-blue-700 ml-auto"
        >
          <i className="ri-add-line text-xs sm:text-sm"></i>
          <span>Добавить</span>
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 sm:gap-4 mb-4 sm:mb-6 text-xs sm:text-sm text-gray-600">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
          <span>Отчёт</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span>
          <span>День рождения</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
          <span>Дедлайн</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
          <span>Финансы</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
          <span>Событие</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-4 sm:mb-6">
        {['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'].map(day => (
          <div key={day} className="text-center text-xs sm:text-sm font-medium text-gray-600 py-1 sm:py-2">{day}</div>
        ))}

        {Array.from({ length: firstDayOfMonth }, (_, i) => (
          <div key={`empty-${i}`} className="text-center py-2 sm:py-3 text-xs sm:text-sm"></div>
        ))}

        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dayHasEvents = hasEvents(day);
          const priority = getHighestPriority(day);
          const isTodayDate = isToday(day);
          const eventsCount = getEventsCount(day);
          const eventTypes = getDayEventTypes(day);

          return (
            <div
              key={day}
              onClick={() => handleDateClick(day)}
              className={`relative text-center py-2 sm:py-3 text-xs sm:text-sm rounded-lg cursor-pointer transition ${
                isTodayDate ? 'bg-blue-600 text-white font-semibold' :
                dayHasEvents ?
                  priority === 'URGENT' ? 'bg-red-100 text-red-600 font-medium' :
                  priority === 'IMPORTANT' ? 'bg-yellow-100 text-yellow-600 font-medium' :
                  'bg-green-100 text-green-600 font-medium' :
                'hover:bg-gray-100'
              }`}
            >
              {day}
              {eventsCount > 0 && (
                <span className={`absolute top-0.5 sm:top-1 right-0.5 sm:right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full text-[10px] sm:text-xs flex items-center justify-center ${
                  isTodayDate ? 'bg-white text-blue-600' : 'bg-gray-700 text-white'
                }`}>
                  {eventsCount}
                </span>
              )}
              {/* Event type indicators */}
              {dayHasEvents && !isTodayDate && (
                <div className="absolute bottom-0.5 sm:bottom-1 left-1/2 transform -translate-x-1/2 flex space-x-0.5">
                  {eventTypes.has('report') && <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-red-500"></span>}
                  {eventTypes.has('birthday') && <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-pink-500"></span>}
                  {eventTypes.has('deadline') && <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-orange-500"></span>}
                  {eventTypes.has('finance') && <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-green-500"></span>}
                  {eventTypes.has('custom') && <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-blue-500"></span>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Upcoming Events */}
      <div className="space-y-3 sm:space-y-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Предстоящие события</h3>

        {upcomingEvents.length > 0 ? (
          <div className="space-y-2 sm:space-y-3">
            {upcomingEvents.map(event => {
              const typeConfig = EVENT_TYPE_CONFIG[event.type];
              return (
                <div
                  key={event.id}
                  className={`p-3 sm:p-4 rounded-lg border ${
                    event.priority === 'URGENT' ? 'border-red-200 bg-red-50' :
                    event.priority === 'IMPORTANT' ? 'border-yellow-200 bg-yellow-50' :
                    'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-2 sm:gap-4">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${typeConfig.bgColor}`}>
                      <i className={`${typeConfig.icon} ${typeConfig.textColor} text-base sm:text-lg`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm sm:text-base">{event.title}</p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {formatEventDate(event.date)}
                        {event.time && ` • ${event.time}`}
                        {event.location && ` • ${event.location}`}
                      </p>
                    </div>
                    <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${typeConfig.bgColor} ${typeConfig.textColor} hidden xs:inline-block flex-shrink-0`}>
                      {typeConfig.label}
                    </span>
                  </div>
                  {event.description && (
                    <div className="mt-2 ml-10 sm:ml-14 text-xs sm:text-sm text-gray-600 bg-white/50 p-2 rounded border border-gray-200">
                      {event.description}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8 text-gray-500">
            <i className="ri-calendar-line text-3xl sm:text-4xl mb-2"></i>
            <p className="text-sm sm:text-base">Нет запланированных событий</p>
            <p className="text-xs sm:text-sm">Добавьте даты отчётов в профиле или задачи в чек-листах</p>
          </div>
        )}
      </div>

      {/* Date Modal */}
      <Modal
        isOpen={showDateModal}
        onClose={() => setShowDateModal(false)}
        title={selectedDate ? `${selectedDate} ${MONTH_NAMES[currentMonth]} ${currentYear}` : 'Выбрать дату'}
      >
        {selectedDate && (
          <>
            {getDateEvents(selectedDate).length > 0 ? (
              <div className="space-y-3">
                {getDateEvents(selectedDate).map(event => {
                  const typeConfig = EVENT_TYPE_CONFIG[event.type];
                  const isCustomEvent = event.type === 'custom';
                  const eventId = isCustomEvent ? event.id.replace('custom-', '') : null;
                  return (
                    <div key={event.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${typeConfig.bgColor}`}>
                          <i className={`${typeConfig.icon} ${typeConfig.textColor}`}></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-gray-600">
                            {event.time && `${event.time} • `}
                            {event.location && `${event.location} • `}
                            {typeConfig.label}
                          </p>
                        </div>
                        {isCustomEvent && eventId && (
                          <button
                            onClick={() => handleDeleteEvent(eventId)}
                            className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-full flex-shrink-0"
                            title="Удалить"
                          >
                            <i className="ri-delete-bin-line"></i>
                          </button>
                        )}
                      </div>
                      {event.description && (
                        <div className="mt-2 ml-11 text-sm text-gray-600 bg-white p-2 rounded border border-gray-200">
                          {event.description}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-4">Нет событий на эту дату</p>
            )}
            <button
              onClick={() => openAddEventForDate(selectedDate)}
              className="mt-4 w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center space-x-2"
            >
              <i className="ri-add-line"></i>
              <span>Добавить событие</span>
            </button>
          </>
        )}
      </Modal>

      {/* Add Event Modal */}
      <Modal
        isOpen={showAddEventModal}
        onClose={() => setShowAddEventModal(false)}
        title="Добавить событие"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название *
            </label>
            <input
              type="text"
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Введите название события"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Дата *
            </label>
            <input
              type="date"
              value={newEventDate}
              onChange={(e) => setNewEventDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Время
              </label>
              <input
                type="time"
                value={newEventTime}
                onChange={(e) => setNewEventTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Приоритет
              </label>
              <select
                value={newEventPriority}
                onChange={(e) => setNewEventPriority(e.target.value as 'NORMAL' | 'IMPORTANT' | 'URGENT')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="NORMAL">Обычный</option>
                <option value="IMPORTANT">Важный</option>
                <option value="URGENT">Срочный</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Место
            </label>
            <input
              type="text"
              value={newEventLocation}
              onChange={(e) => setNewEventLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Введите место проведения"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание
            </label>
            <textarea
              value={newEventDescription}
              onChange={(e) => setNewEventDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Введите описание события"
            />
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              onClick={() => setShowAddEventModal(false)}
              className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Отмена
            </button>
            <button
              onClick={handleAddEvent}
              disabled={!newEventTitle || !newEventDate || isSubmitting}
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Сохранить'
              )}
            </button>
          </div>
        </div>
      </Modal>
    </Card>

    {/* Ad Banner */}
    {!user?.isPremium && <AdBanner variant="calendar" />}
    </>
  );
}
