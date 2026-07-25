import request from '../utils/request';
import type { GoalParseVO, GoalParseDTO, GoalReplyDTO } from '../types/goal';

export const goalApi = {
  parse: (data: GoalParseDTO) =>
    request.post<GoalParseVO>('/api/v1/goals/parse', data),

  getResult: (id: number) =>
    request.get<GoalParseVO>(`/api/v1/goals/${id}/result`),

  reply: (id: number, data: GoalReplyDTO) =>
    request.post<GoalParseVO>(`/api/v1/goals/${id}/reply`, data),

  confirm: (id: number) =>
    request.put<GoalParseVO>(`/api/v1/goals/${id}/confirm`),
};
