import request from '../utils/request';
import type { Reminder, ReminderUpdateDTO } from '../types/reminder';

export const reminderApi = {
  list: () =>
    request.get<Reminder[]>('/api/v1/reminders'),

  update: (id: number, data: ReminderUpdateDTO) =>
    request.put<Reminder>(`/api/v1/reminders/${id}`, data),

  remove: (id: number) =>
    request.delete<void>(`/api/v1/reminders/${id}`),
};
