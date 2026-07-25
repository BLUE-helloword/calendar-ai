import request from '../utils/request';
import type { DashboardVO, ReportVO } from '../types/dashboard';

export const dashboardApi = {
  overview: () =>
    request.get<DashboardVO>('/api/v1/dashboard'),

  report: (days: number = 7) =>
    request.get<ReportVO>('/api/v1/dashboard/report', { params: { days } } as Record<string, unknown>),
};
