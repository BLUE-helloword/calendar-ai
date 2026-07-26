import React from 'react';
import { HOUR_HEIGHT, START_HOUR, TOTAL_HOURS } from '../../utils/calendar';
import HourLabels from './HourLabels';
import ScheduleBlock from './ScheduleBlock';
import type { DaySchedule } from '../../api/schedule';

interface Props {
  days: DaySchedule[];
}

const TimeGrid: React.FC<Props> = ({ days }) => {
  const gridHeight = TOTAL_HOURS * HOUR_HEIGHT;

  // Current time red line
  const now = new Date();
  const nowHour = now.getHours() + now.getMinutes() / 60;
  const todayStr = now.toISOString().slice(0, 10);
  const nowTop = (nowHour - START_HOUR) * HOUR_HEIGHT;

  // Detect which column is today
  const todayColIndex = days.findIndex((d) => d.date === todayStr);

  // Detect overlaps and compute width
  const computeLayout = (items: DaySchedule['items']) => {
    if (items.length === 0) return [];
    const result = items.map((item, idx) => {
      let hasOverlap = false;
      for (let j = 0; j < items.length; j++) {
        if (j === idx) continue;
        const a = item.startTime, b = item.endTime;
        const c = items[j].startTime, d = items[j].endTime;
        if (a < d && b > c) { hasOverlap = true; break; }
      }
      return {
        ...item,
        _width: hasOverlap ? 48 : 96,
        _left: idx % 2 === 0 || !hasOverlap ? 0 : 50,
      };
    });
    return result;
  };

  return (
    <div style={{ display: 'flex', overflowX: 'auto', paddingTop: 0 }}>
      <HourLabels />

      <div style={{ display: 'flex', flex: 1, position: 'relative', minWidth: 700 }}>
        {days.map((day, di) => (
          <div
            key={day.date}
            style={{
              flex: 1,
              position: 'relative',
              height: gridHeight,
              borderLeft: di > 0 ? '1px solid #f0f0f0' : 'none',
              borderRight: '1px solid #f0f0f0',
              backgroundColor: di >= 5 ? '#fafafa' : 'transparent',
            }}
          >
            {/* Hour grid lines */}
            {Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: i * HOUR_HEIGHT,
                  left: 0,
                  right: 0,
                  borderTop: '1px solid #f0f0f0',
                }}
              />
            ))}

            {/* Current time red line */}
            {di === todayColIndex && nowTop >= 0 && nowTop <= gridHeight && (
              <div style={{
                position: 'absolute',
                top: nowTop,
                left: 0,
                right: 0,
                height: 2,
                backgroundColor: '#ff4d4f',
                zIndex: 10,
              }}>
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: '#ff4d4f',
                  marginTop: -3,
                  marginLeft: -4,
                }} />
              </div>
            )}

            {/* Schedule blocks */}
            {computeLayout(day.items).map((item: any, idx) => (
              <ScheduleBlock
                key={idx}
                item={item}
                width={item._width}
                left={item._left}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimeGrid;
