import dayjs from 'dayjs';

export function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm');
}

export function formatShortDate(dateStr?: string): string {
  if (!dateStr) return '';
  return dayjs(dateStr).format('MM/DD');
}

export function formatTime(dateStr?: string): string {
  if (!dateStr) return '';
  return dayjs(dateStr).format('HH:mm');
}
