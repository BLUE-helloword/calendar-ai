import dayjs from 'dayjs';

export const START_HOUR = 8;
export const END_HOUR = 20;
export const HOUR_HEIGHT = 60;
export const TOTAL_HOURS = END_HOUR - START_HOUR;

/** 获取指定日期所在周的周一至周日 */
export const getWeekDays = (date: Date | string): dayjs.Dayjs[] => {
  const d = dayjs(date);
  const monday = d.startOf('week').add(1, 'day'); // dayjs周日为一周起点，+1转为周一
  return Array.from({ length: 7 }, (_, i) => monday.add(i, 'day'));
};

/** 格式化周范围 */
export const formatWeekRange = (weekStart: string, weekEnd: string): string => {
  const start = dayjs(weekStart);
  const end = dayjs(weekEnd);
  const sameYear = start.year() === end.year();
  const sameMonth = start.month() === end.month();
  if (sameYear && sameMonth) {
    return `${start.format('MMM')} ${start.format('D')} - ${end.format('D')}, ${start.format('YYYY')}`;
  }
  if (sameYear) {
    return `${start.format('MMM D')} - ${end.format('MMM D')}, ${start.format('YYYY')}`;
  }
  return `${start.format('MMM D, YYYY')} - ${end.format('MMM D, YYYY')}`;
};

/** 根据开始/结束时间计算像素位置 */
export const calcPosition = (startTime: string, endTime: string) => {
  const start = dayjs(startTime);
  const end = dayjs(endTime);
  const startHour = start.hour() + start.minute() / 60;
  const endHour = end.hour() + end.minute() / 60;
  const top = (startHour - START_HOUR) * HOUR_HEIGHT;
  const height = Math.max((endHour - startHour) * HOUR_HEIGHT, 20);
  return { top: Math.max(top, 0), height };
};
