import { Task } from './task';

export interface DashboardVO {
  todayTasks: Task[];
  upcomingTasks: Task[];
  todaySchedules: Schedule[];
  totalTasks: number;
  completedTasks: number;
  delayedTasks: number;
  highPriorityTasks: Task[];
}

export interface Schedule {
  id: number;
  userId: number;
  taskId: number;
  title: string;
  startTime: string;
  endTime: string;
  isAllDay: number;
  color: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportVO {
  completedTasks: Task[];
  completedCount: number;
  totalCount: number;
  period: string;
}
