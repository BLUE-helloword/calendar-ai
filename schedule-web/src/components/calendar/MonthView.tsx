import React from 'react';
import dayjs from 'dayjs';
import type { DaySchedule } from '../../api/schedule';

interface Props {
  year: number;
  month: number; // 0-indexed
  days: DaySchedule[];
  previewDays: DaySchedule[];
  onDayClick: (date: string) => void;
}

const MonthView: React.FC<Props> = ({ year, month, days, previewDays, onDayClick }) => {
  const firstDay = dayjs().year(year).month(month).startOf('month');
  const lastDay = firstDay.endOf('month');
  const startDayOfWeek = firstDay.day(); // 0=Sun
  const totalDays = lastDay.date();

  // Build grid: pad with empty cells for alignment
  const cells: (dayjs.Dayjs | null)[] = [];
  // Monday is day 1, Sunday is day 0 -> offset
  const offset = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) {
    cells.push(firstDay.date(d));
  }
  // Pad remaining to complete last week
  while (cells.length % 7 !== 0) cells.push(null);

  const today = dayjs().format('YYYY-MM-DD');

  // Build lookup maps
  const dayMap = new Map<string, DaySchedule>();
  days.forEach((d) => dayMap.set(d.date, d));
  const previewMap = new Map<string, DaySchedule>();
  previewDays.forEach((d) => previewMap.set(d.date, d));

  const weekDays = ['一', '二', '三', '四', '五', '六', '日'];

  return (
    <div style={{ padding: '8px 16px' }}>
      {/* Weekday headers */}
      <div style={{ display: 'flex', marginBottom: 4 }}>
        {weekDays.map((name, i) => (
          <div key={i} style={{
            flex: 1,
            textAlign: 'center',
            padding: '4px',
            fontSize: 12,
            color: i >= 5 ? '#f5222d' : '#999',
            fontWeight: 500,
          }}>
            {name}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {cells.map((cell, idx) => {
          if (!cell) {
            return <div key={`empty-${idx}`} style={{ flex: '1 0 14.28%', height: 100 }} />;
          }

          const dateStr = cell.format('YYYY-MM-DD');
          const isToday = dateStr === today;
          const isCurrentMonth = cell.month() === month;

          const dayData = dayMap.get(dateStr);
          const previewData = previewMap.get(dateStr);
          const allItems = [
            ...(dayData?.items || []),
            ...(previewData?.items || []),
          ];

          return (
            <div
              key={dateStr}
              onClick={() => onDayClick(dateStr)}
              style={{
                flex: '1 0 14.28%',
                height: 100,
                border: '1px solid #f0f0f0',
                padding: 2,
                cursor: 'pointer',
                opacity: isCurrentMonth ? 1 : 0.3,
                backgroundColor: isToday ? '#e6f4ff' : '#fff',
                overflow: 'hidden',
              }}
            >
              <div style={{
                fontSize: 13,
                fontWeight: isToday ? 700 : 400,
                marginBottom: 2,
                textAlign: 'center',
                width: 22,
                height: 22,
                lineHeight: '22px',
                borderRadius: '50%',
                background: isToday ? '#1677ff' : 'transparent',
                color: isToday ? '#fff' : '#333',
              }}>
                {cell.date()}
              </div>
              {allItems.slice(0, 3).map((item, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 10,
                    padding: '1px 3px',
                    marginBottom: 1,
                    borderRadius: 2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    backgroundColor: item.status === 'PREVIEW' ? 'transparent' : item.color,
                    color: item.status === 'PREVIEW' ? item.color : '#fff',
                    border: item.status === 'PREVIEW' ? `1px dashed ${item.color}` : 'none',
                  }}
                >
                  {item.title}
                </div>
              ))}
              {allItems.length > 3 && (
                <div style={{ fontSize: 10, color: '#999', padding: '1px 3px' }}>
                  +{allItems.length - 3} more
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthView;
