import request from '../utils/request';
import type { Task, TaskUpdateDTO, TaskStatusDTO } from '../types/task';

export const taskApi = {
  list: (params?: { status?: string; priority?: string }) =>
    request.get<Task[]>('/api/v1/tasks', { params } as Record<string, unknown>),

  detail: (id: number) =>
    request.get<Task>(`/api/v1/tasks/${id}`),

  update: (id: number, data: TaskUpdateDTO) =>
    request.put<Task>(`/api/v1/tasks/${id}`, data),

  updateStatus: (id: number, data: TaskStatusDTO) =>
    request.put<void>(`/api/v1/tasks/${id}/status`, data),

  remove: (id: number) =>
    request.delete<void>(`/api/v1/tasks/${id}`),
};
