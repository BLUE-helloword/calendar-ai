import request from '../utils/request';

export interface WeekScheduleVO {
  weekStart: string;
  weekEnd: string;
  days: DaySchedule[];
}

export interface DaySchedule {
  date: string;
  dayOfWeek: string;
  items: CalendarItem[];
}

export interface CalendarItem {
  id: number;
  type: 'SCHEDULE' | 'TASK';
  title: string;
  startTime: string;
  endTime: string;
  color: string;
  status: string;
  priority?: number;
}

export const scheduleApi = {
  getWeek: (date?: string) =>
    request.get<WeekScheduleVO>('/api/v1/schedules/week', { params: { date } }),
};
