'use client';

import { useState, useCallback, useMemo } from 'react';

export function useCalendar() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  const goToPreviousMonth = useCallback(() => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  }, [currentMonth]);

  const goToNextMonth = useCallback(() => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  }, [currentMonth]);

  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentYear, currentMonth]);

  const firstDayOfMonth = useMemo(() => {
    const day = new Date(currentYear, currentMonth, 1).getDay();
    return day === 0 ? 6 : day - 1; // Monday = 0
  }, [currentYear, currentMonth]);

  const isToday = useCallback((day: number) => {
    const todayDate = new Date();
    return (
      day === todayDate.getDate() &&
      currentMonth === todayDate.getMonth() &&
      currentYear === todayDate.getFullYear()
    );
  }, [currentMonth, currentYear]);

  return {
    currentYear,
    currentMonth,
    daysInMonth,
    firstDayOfMonth,
    goToPreviousMonth,
    goToNextMonth,
    isToday,
  };
}
