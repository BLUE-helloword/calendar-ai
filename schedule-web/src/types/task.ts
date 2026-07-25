export interface Task {
  id: number;
  goalId: number;
  userId: number;
  title: string;
  description: string;
  priority: 1 | 2 | 3;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'DELAYED' | 'CANCELLED';
  startTime: string;
  endTime: string;
  estimatedHours: number;
  parentTaskId: number;
  dependencyType: string;
  sourceType: 'MANUAL' | 'AI_GENERATED';
  createdAt: string;
  updatedAt: string;
}

export interface TaskUpdateDTO {
  title?: string;
  description?: string;
  priority?: number;
  startTime?: string;
  endTime?: string;
}

export interface TaskStatusDTO {
  status: string;
}
