import request from '../utils/request';
import type { PlanVO, PlanConfirmDTO } from '../types/plan';

export const planApi = {
  generate: (goalId: number) =>
    request.post<PlanVO>(`/api/v1/goals/${goalId}/plan/generate`),

  preview: (goalId: number) =>
    request.get<PlanVO>(`/api/v1/goals/${goalId}/plan/preview`),

  confirm: (goalId: number, data: PlanConfirmDTO) =>
    request.post<void>(`/api/v1/goals/${goalId}/plan/confirm`, data),
};
