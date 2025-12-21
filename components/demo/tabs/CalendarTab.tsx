'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, AdBanner } from '@/components/ui';
import { Modal } from '@/components/ui/Modal';
import { useCalendar } from '@/hooks/useCalendar';
import { useAuth } from '@/contexts/AuthContext';
import { MONTH_NAMES } from '@/lib/demo-data';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  priority: 'NORMAL' | 'IMPORTANT' | 'URGENT';
  description?: string;
  completed: boolean;
  type: 'user';
}

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

interface AggregatedEvent {
  id: string;
  title: string;
  date: Date;
  time?: string;
  location?: string;
  priority: 'NORMAL' | 'IMPORTANT' | 'URGENT';
  type: 'user' | 'birthday' | 'deadline' | 'finance';
  description?: string;
  completed?: boolean;
}

const EVENT_TYPE_CONFIG = {
  user: { icon: 'ri-calendar-event-line', bgColor: 'bg-blue-100', textColor: 'text-blue-600', label: 'Событие' },
  birthday: { icon: 'ri-cake-2-line', bgColor: 'bg-pink-100', textColor: 'text-pink-600', label: 'День рождения' },
  deadline: { icon: 'ri-checkbox-circle-line', bgColor: 'bg-orange-100', textColor: 'text-orange-600', label: 'Дедлайн' },
  finance: { icon: 'ri-money-dollar-circle-line', bgColor: 'bg-green-100', textColor: 'text-green-600', label: 'Финансы' },
};

export function CalendarTab() {
  const { token, user } = useAuth();
  const { currentYear, currentMonth, daysInMonth, firstDayOfMonth, goToPreviousMonth, goToNextMonth, isToday } = useCalendar();

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [employees, setEmployees] = useState<EmployeeBirthday[]>([]);
  const [tasks, setTasks] = useState<TaskDeadline[]>([]);
  const [financialReminders, setFinancialReminders] = useState<FinancialReminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'user' | 'birthday' | 'deadline' | 'finance'>('all');

  const fetchCalendarData = async () => {
    if (!token) return;

    try {
      const response = await fetch('/api/calendar', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
        setEmployees(data.employees || []);
        setTasks(data.tasks || []);
        setFinancialReminders(data.financialReminders || []);
      }
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, [token]);

  // Aggregate all events into a unified format
  const aggregatedEvents = useMemo((): AggregatedEvent[] => {
    const allEvents: AggregatedEvent[] = [];

    // User events
    events.forEach(event => {
      allEvents.push({
        id: event.id,
        title: event.title,
        date: new Date(event.date),
        time: event.time,
        location: event.location,
        priority: event.priority,
        type: 'user',
        description: event.description,
        completed: event.completed,
      });
    });

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

    return allEvents;
  }, [events, employees, tasks, financialReminders, currentYear]);

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

  const handleAddEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token || isSubmitting || !selectedDate) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    const eventDate = new Date(currentYear, currentMonth, selectedDate);

    try {
      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.get('title'),
          date: eventDate.toISOString(),
          time: formData.get('time'),
          location: formData.get('location'),
          priority: formData.get('priority'),
          description: formData.get('description'),
        }),
      });

      if (response.ok) {
        setShowAddEventModal(false);
        await fetchCalendarData();
      }
    } catch (error) {
      console.error('Error creating event:', error);
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
        await fetchCalendarData();
      }
    } catch (error) {
      console.error('Error deleting event:', error);
    }
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
      <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-6 -mx-1 px-1 overflow-x-auto pb-2">
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
            <span className="hidden xs:inline">{config.label}</span>
          </button>
        ))}
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
                  {eventTypes.has('birthday') && <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-pink-500"></span>}
                  {eventTypes.has('deadline') && <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-orange-500"></span>}
                  {eventTypes.has('finance') && <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-green-500"></span>}
                  {eventTypes.has('user') && <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-blue-500"></span>}
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
                  className={`flex items-start sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 rounded-lg cursor-pointer border ${
                    event.priority === 'URGENT' ? 'border-red-200 bg-red-50' :
                    event.priority === 'IMPORTANT' ? 'border-yellow-200 bg-yellow-50' :
                    'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${typeConfig.bgColor}`}>
                    <i className={`${typeConfig.icon} ${typeConfig.textColor} text-base sm:text-lg`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{event.title}</p>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                      {formatEventDate(event.date)}
                      {event.time && ` • ${event.time}`}
                      {event.location && ` • ${event.location}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${typeConfig.bgColor} ${typeConfig.textColor} hidden xs:inline-block`}>
                      {typeConfig.label}
                    </span>
                    {event.type === 'user' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event.id); }}
                        className="text-gray-400 hover:text-red-600 transition p-1"
                      >
                        <i className="ri-delete-bin-line text-sm sm:text-base"></i>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8 text-gray-500">
            <i className="ri-calendar-line text-3xl sm:text-4xl mb-2"></i>
            <p className="text-sm sm:text-base">Нет запланированных событий</p>
            <p className="text-xs sm:text-sm">Кликните на дату в календаре, чтобы добавить событие</p>
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
              <div className="space-y-3 mb-4">
                {getDateEvents(selectedDate).map(event => {
                  const typeConfig = EVENT_TYPE_CONFIG[event.type];
                  return (
                    <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${typeConfig.bgColor}`}>
                          <i className={`${typeConfig.icon} ${typeConfig.textColor}`}></i>
                        </div>
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-gray-600">
                            {event.time && `${event.time} • `}
                            {typeConfig.label}
                          </p>
                        </div>
                      </div>
                      {event.type === 'user' && (
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="btn btn-danger p-2"
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-600 mb-4">Нет событий на эту дату</p>
            )}
            <button
              onClick={() => { setShowDateModal(false); setShowAddEventModal(true); }}
              className="btn btn-primary w-full"
            >
              <i className="ri-add-line"></i>
              Добавить событие
            </button>
          </>
        )}
      </Modal>

      {/* Add Event Modal */}
      <Modal
        isOpen={showAddEventModal}
        onClose={() => setShowAddEventModal(false)}
        title="Добавить событие"
        maxWidth="lg"
      >
        <form onSubmit={handleAddEvent} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Название</label>
            <input name="title" type="text" required className="input w-full text-sm sm:text-base" placeholder="Название события" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Время</label>
              <input name="time" type="time" required className="input w-full text-sm sm:text-base" />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Место</label>
              <input name="location" type="text" className="input w-full text-sm sm:text-base" placeholder="Место" />
            </div>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Приоритет</label>
            <select name="priority" className="select w-full text-sm sm:text-base" defaultValue="NORMAL">
              <option value="NORMAL">Плановое</option>
              <option value="IMPORTANT">Важное</option>
              <option value="URGENT">Срочное</option>
            </select>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Описание</label>
            <textarea name="description" className="input w-full text-sm sm:text-base" rows={3} placeholder="Описание события"></textarea>
          </div>
          <div className="flex gap-2 sm:gap-3 pt-2">
            <button type="button" onClick={() => setShowAddEventModal(false)} className="btn btn-secondary flex-1 text-sm sm:text-base">
              Отмена
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary flex-1 text-sm sm:text-base">
              {isSubmitting ? 'Добавление...' : 'Добавить'}
            </button>
          </div>
        </form>
      </Modal>
    </Card>

    {/* Ad Banner */}
    {!user?.isPremium && <AdBanner variant="calendar" />}
    </>
  );
}
