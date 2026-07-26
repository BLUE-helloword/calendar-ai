import request from '../utils/request';
import type { PlanVO, PlanConfirmDTO, PlanRefineDTO } from '../types/plan';

export const planApi = {
  generate: (goalId: number) =>
    request.post<PlanVO>(`/api/v1/goals/${goalId}/plan/generate`),

  optimize: (goalId: number) =>
    request.post<PlanVO>(`/api/v1/goals/${goalId}/plan/optimize`),

  refine: (goalId: number, data: PlanRefineDTO) =>
    request.post<PlanVO>(`/api/v1/goals/${goalId}/plan/refine`, data),

  preview: (goalId: number) =>
    request.get<PlanVO>(`/api/v1/goals/${goalId}/plan/preview`),

  confirm: (goalId: number, data: PlanConfirmDTO) =>
    request.post<void>(`/api/v1/goals/${goalId}/plan/confirm`, data),
};
