'use client';

import { useState, useCallback } from 'react';
import {
  INITIAL_USER_PROFILE,
  INITIAL_SERVICES,
  INITIAL_EQUIPMENT,
  INITIAL_EMPLOYEES,
} from '@/lib/demo-data';

export interface ReportDate {
  id?: string;
  title: string;
  date: string;
}

export interface UserProfile {
  name: string;
  projectName: string;
  grantAmount: number;
  email: string;
  phone: string;
  inn: string;
  ogrn: string;
  reportDates?: ReportDate[];
}

export interface ChecklistTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Checklist {
  id: number;
  title: string;
  tasks: ChecklistTask[];
}

export interface CalendarEvent {
  id: number;
  title: string;
  time: string;
  location: string;
  priority: 'normal' | 'important' | 'urgent';
  description?: string;
  year: number;
  month: number;
  day: number;
}

export interface Service {
  id: number;
  name: string;
  amount: number;
  documents: string[];
}

export interface Equipment {
  id: number;
  name: string;
  amount: number;
  date: string;
  documents: string[];
}

export interface Employee {
  id: number;
  name: string;
  initials: string;
  position: string;
  hireDate: string;
  militaryStatus: 'updated' | 'needs_update' | 'not_applicable';
  status: 'active' | 'dismissed';
  color: string;
}

export function useDemoStore() {
  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_USER_PROFILE);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<Record<string, CalendarEvent[]>>({});
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [equipment, setEquipment] = useState<Equipment[]>(INITIAL_EQUIPMENT);
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);

  // Profile
  const updateProfile = useCallback((profile: UserProfile) => {
    setUserProfile(profile);
  }, []);

  // Checklists
  const addChecklist = useCallback((title: string, tasks: string[]) => {
    const newChecklist: Checklist = {
      id: Date.now(),
      title,
      tasks: tasks.map((text, i) => ({
        id: `checklist-${Date.now()}-task-${i}`,
        text,
        completed: false,
      })),
    };
    setChecklists(prev => [...prev, newChecklist]);
  }, []);

  const deleteChecklist = useCallback((id: number) => {
    setChecklists(prev => prev.filter(c => c.id !== id));
  }, []);

  const toggleTask = useCallback((checklistId: number, taskId: string) => {
    setChecklists(prev =>
      prev.map(cl =>
        cl.id === checklistId
          ? {
              ...cl,
              tasks: cl.tasks.map(t =>
                t.id === taskId ? { ...t, completed: !t.completed } : t
              ),
            }
          : cl
      )
    );
  }, []);

  const addTask = useCallback((checklistId: number, text: string) => {
    setChecklists(prev =>
      prev.map(cl =>
        cl.id === checklistId
          ? {
              ...cl,
              tasks: [...cl.tasks, { id: `task-${Date.now()}`, text, completed: false }],
            }
          : cl
      )
    );
  }, []);

  const deleteTask = useCallback((checklistId: number, taskId: string) => {
    setChecklists(prev =>
      prev.map(cl =>
        cl.id === checklistId
          ? { ...cl, tasks: cl.tasks.filter(t => t.id !== taskId) }
          : cl
      )
    );
  }, []);

  // Calendar Events
  const addEvent = useCallback((event: Omit<CalendarEvent, 'id'>) => {
    const key = `${event.year}-${event.month}-${event.day}`;
    const newEvent = { ...event, id: Date.now() };
    setCalendarEvents(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), newEvent],
    }));
  }, []);

  const deleteEvent = useCallback((year: number, month: number, day: number, eventId: number) => {
    const key = `${year}-${month}-${day}`;
    setCalendarEvents(prev => ({
      ...prev,
      [key]: (prev[key] || []).filter(e => e.id !== eventId),
    }));
  }, []);

  const getDateEvents = useCallback((year: number, month: number, day: number) => {
    const key = `${year}-${month}-${day}`;
    return calendarEvents[key] || [];
  }, [calendarEvents]);

  // Services
  const addService = useCallback((name: string, amount: number) => {
    setServices(prev => [...prev, { id: Date.now(), name, amount, documents: [] }]);
  }, []);

  const deleteService = useCallback((id: number) => {
    setServices(prev => prev.filter(s => s.id !== id));
  }, []);

  const addServiceDocument = useCallback((serviceId: number, docType: string) => {
    setServices(prev =>
      prev.map(s =>
        s.id === serviceId ? { ...s, documents: [...s.documents, docType] } : s
      )
    );
  }, []);

  const deleteServiceDocument = useCallback((serviceId: number, docIndex: number) => {
    setServices(prev =>
      prev.map(s =>
        s.id === serviceId
          ? { ...s, documents: s.documents.filter((_, i) => i !== docIndex) }
          : s
      )
    );
  }, []);

  // Equipment
  const addEquipment = useCallback((name: string, amount: number, date: string) => {
    setEquipment(prev => [...prev, { id: Date.now(), name, amount, date, documents: [] }]);
  }, []);

  const deleteEquipment = useCallback((id: number) => {
    setEquipment(prev => prev.filter(e => e.id !== id));
  }, []);

  const addEquipmentDocument = useCallback((equipmentId: number, docType: string) => {
    setEquipment(prev =>
      prev.map(e =>
        e.id === equipmentId ? { ...e, documents: [...e.documents, docType] } : e
      )
    );
  }, []);

  const deleteEquipmentDocument = useCallback((equipmentId: number, docIndex: number) => {
    setEquipment(prev =>
      prev.map(e =>
        e.id === equipmentId
          ? { ...e, documents: e.documents.filter((_, i) => i !== docIndex) }
          : e
      )
    );
  }, []);

  // Employees
  const addEmployee = useCallback((employee: Omit<Employee, 'id'>) => {
    setEmployees(prev => [...prev, { ...employee, id: Date.now() }]);
  }, []);

  const deleteEmployee = useCallback((id: number) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
  }, []);

  // Computed values
  const totalServicesAmount = services.reduce((sum, s) => sum + s.amount, 0);
  const totalEquipmentAmount = equipment.reduce((sum, e) => sum + e.amount, 0);
  const spentAmount = 215500; // Fixed demo value
  const remainingGrant = userProfile.grantAmount - spentAmount;

  return {
    // State
    userProfile,
    checklists,
    calendarEvents,
    services,
    equipment,
    employees,

    // Computed
    totalServicesAmount,
    totalEquipmentAmount,
    spentAmount,
    remainingGrant,

    // Actions
    updateProfile,
    addChecklist,
    deleteChecklist,
    toggleTask,
    addTask,
    deleteTask,
    addEvent,
    deleteEvent,
    getDateEvents,
    addService,
    deleteService,
    addServiceDocument,
    deleteServiceDocument,
    addEquipment,
    deleteEquipment,
    addEquipmentDocument,
    deleteEquipmentDocument,
    addEmployee,
    deleteEmployee,
  };
}
