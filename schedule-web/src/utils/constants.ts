export const PRIORITY_MAP: Record<number, { label: string; color: string }> = {
  1: { label: '高', color: '#f5222d' },
  2: { label: '中', color: '#fa8c16' },
  3: { label: '低', color: '#8c8c8c' },
};

export const STATUS_MAP: Record<string, { label: string; color: string }> = {
  TODO: { label: '待办', color: '#1677ff' },
  IN_PROGRESS: { label: '进行中', color: '#fa8c16' },
  DONE: { label: '已完成', color: '#52c41a' },
  DELAYED: { label: '已延期', color: '#f5222d' },
  CANCELLED: { label: '已取消', color: '#8c8c8c' },
};

export const REMINDER_CHANNEL_MAP: Record<string, string> = {
  IN_APP: '站内信',
  EMAIL: '邮箱',
  WECHAT: '微信',
  FEISHU: '飞书',
};

export const MAX_CLARIFY_ROUNDS = 5;
