import { create } from 'zustand';
import dayjs, { Dayjs } from 'dayjs';
import type { ChatMessage } from '../types/chat';
import type { CalendarItem } from '../api/schedule';
import { chatApi } from '../api/chat';
import { toPreviewItems } from '../types/chat';

interface AppState {
  // Chat
  messages: ChatMessage[];
  currentSessionId: string | null;
  isProcessing: boolean;

  // Calendar
  currentView: 'month' | 'week' | 'day';
  currentDate: Dayjs;
  schedules: CalendarItem[];        // confirmed
  previewSchedules: CalendarItem[]; // AI preview (dashed)

  // Actions
  sendMessage: (text: string) => Promise<void>;
  confirmSchedules: () => Promise<void>;
  setCurrentView: (view: 'month' | 'week' | 'day') => void;
  setCurrentDate: (date: Dayjs) => void;
  goToPrevWeek: () => void;
  goToNextWeek: () => void;
  goToPrevMonth: () => void;
  goToNextMonth: () => void;
  goToToday: () => void;
  clearSession: () => void;
  addMessage: (msg: ChatMessage) => void;
  setPreviewSchedules: (items: CalendarItem[]) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  messages: [],
  currentSessionId: null,
  isProcessing: false,

  currentView: 'week',
  currentDate: dayjs(),
  schedules: [],
  previewSchedules: [],

  sendMessage: async (text: string) => {
    const { currentSessionId, messages } = get();
    const userMsg: ChatMessage = { role: 'user', content: text };
    set({ messages: [...messages, userMsg], isProcessing: true });

    try {
      const res = await chatApi.sendMessage(currentSessionId, text);
      const agentMsg: ChatMessage = {
        role: 'agent',
        content: res.text,
        type: res.type,
        schedule: res.schedule,
        conflicts: res.conflicts,
        questions: res.questions,
        taskCreated: res.taskCreated,
      };

      const updates: Partial<AppState> = {
        messages: [...get().messages, agentMsg],
        isProcessing: false,
        currentSessionId: res.sessionId,
      };

      // Update preview schedules if we got a schedule_card
      if (res.type === 'schedule_card' && res.schedule) {
        updates.previewSchedules = toPreviewItems(res.schedule);
      }

      // Clear preview on task_created
      if (res.type === 'task_created') {
        updates.previewSchedules = [];
      }

      set(updates);
    } catch {
      set({ isProcessing: false });
    }
  },

  confirmSchedules: async () => {
    const { currentSessionId, previewSchedules } = get();
    if (!currentSessionId || previewSchedules.length === 0) return;

    set({ isProcessing: true });
    try {
      const items = previewSchedules.map((p) => ({
        title: p.title,
        startTime: p.startTime,
        endTime: p.endTime,
        priority: p.priority === 1 ? 'HIGH' : p.priority === 3 ? 'LOW' : 'MEDIUM',
      }));

      const res = await chatApi.confirm(currentSessionId, items);
      const agentMsg: ChatMessage = {
        role: 'agent',
        content: res.text,
        type: 'task_created',
        taskCreated: res.taskCreated,
      };

      set({
        messages: [...get().messages, agentMsg],
        isProcessing: false,
        previewSchedules: [],
        // Move previews to confirmed schedules
        schedules: [...get().schedules, ...get().previewSchedules.map(p => ({ ...p, status: 'ACTIVE' }))],
      });
    } catch {
      set({ isProcessing: false });
    }
  },

  setCurrentView: (view) => set({ currentView: view }),
  setCurrentDate: (date) => set({ currentDate: date }),

  goToPrevWeek: () => set((s) => ({ currentDate: s.currentDate.subtract(1, 'week') })),
  goToNextWeek: () => set((s) => ({ currentDate: s.currentDate.add(1, 'week') })),
  goToPrevMonth: () => set((s) => ({ currentDate: s.currentDate.subtract(1, 'month') })),
  goToNextMonth: () => set((s) => ({ currentDate: s.currentDate.add(1, 'month') })),
  goToToday: () => set({ currentDate: dayjs() }),

  clearSession: () => set({
    messages: [],
    currentSessionId: null,
    previewSchedules: [],
  }),

  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setPreviewSchedules: (items) => set({ previewSchedules: items }),
}));
