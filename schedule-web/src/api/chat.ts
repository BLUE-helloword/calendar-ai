import request from '../utils/request';
import type { ChatResponse } from '../types/chat';
import type { PlanConfirmDTO } from '../types/plan';

export const chatApi = {
  sendMessage: (sessionId: string | null, message: string) =>
    request.post<ChatResponse>('/api/v1/chat/message', {
      sessionId,
      message,
    }),

  confirm: (sessionId: string, items: PlanConfirmDTO['items']) =>
    request.post<ChatResponse>('/api/v1/chat/confirm', {
      sessionId,
      items,
    }),
};
