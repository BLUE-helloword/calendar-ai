export interface Reminder {
  id: number;
  userId: number;
  taskId: number;
  remindTime: string;
  remindType: string;
  channel: string;
  message: string;
  status: string;
  createdAt: string;
}

export interface ReminderUpdateDTO {
  remindTime?: string;
  remindType?: string;
  channel?: string;
  message?: string;
}
