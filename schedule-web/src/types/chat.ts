import type { CalendarItem } from '../api/schedule';

export interface ChatResponse {
  sessionId: string;
  type: 'text' | 'clarify' | 'schedule_card' | 'task_created';
  text: string;
  schedule?: ScheduleData;
  conflicts?: ConflictData[];
  questions?: string[];
  taskCreated?: TaskCreatedData;
}

export interface ScheduleData {
  title: string;
  deadline?: string;
  items: ScheduleItemData[];
}

export interface ScheduleItemData {
  title: string;
  startTime: string;
  endTime: string;
  estimatedHours: number;
  priority: string;
  hasConflict: boolean;
  conflictDetail: string;
}

export interface ConflictData {
  item: string;
  overlapWith: string;
  suggestion: string;
}

export interface TaskCreatedData {
  createdTasks: number;
  createdSchedules: number;
  createdReminders: number;
}

export interface ChatMessage {
  role: 'user' | 'agent';
  content: string;
  type?: 'text' | 'clarify' | 'schedule_card' | 'task_created';
  schedule?: ScheduleData;
  conflicts?: ConflictData[];
  questions?: string[];
  taskCreated?: TaskCreatedData;
}

/** Convert a ChatResponse into a ChatMessage for the store */
export function toChatMessage(res: ChatResponse): ChatMessage {
  return {
    role: 'agent',
    content: res.text,
    type: res.type,
    schedule: res.schedule,
    conflicts: res.conflicts,
    questions: res.questions,
    taskCreated: res.taskCreated,
  };
}

/** Convert schedule items from chat response to calendar preview items */
export function toPreviewItems(schedule: ScheduleData): CalendarItem[] {
  if (!schedule?.items) return [];
  return schedule.items.map((item, idx) => ({
    id: -(idx + 1), // negative IDs for preview items
    type: 'SCHEDULE' as const,
    title: item.title,
    startTime: item.startTime,
    endTime: item.endTime,
    color: item.hasConflict ? '#ff4d4f' : item.priority === 'HIGH' ? '#ff7a45' : item.priority === 'LOW' ? '#95de64' : '#ffc53d',
    status: 'PREVIEW',
    priority: item.priority === 'HIGH' ? 1 : item.priority === 'LOW' ? 3 : 2,
  }));
}
