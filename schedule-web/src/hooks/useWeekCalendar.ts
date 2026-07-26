import { useState, useEffect, useCallback } from 'react';
import { scheduleApi, type WeekScheduleVO } from '../api/schedule';

export const useWeekCalendar = (initialDate?: string) => {
  const [data, setData] = useState<WeekScheduleVO | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(initialDate);

  const fetch = useCallback(async (date?: string) => {
    setLoading(true);
    try {
      const res = await scheduleApi.getWeek(date);
      setData(res);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(currentDate); }, [fetch, currentDate]);

  const goToWeek = (date: string) => setCurrentDate(date);

  return { data, loading, currentDate, goToWeek, refresh: () => fetch(currentDate) };
};
