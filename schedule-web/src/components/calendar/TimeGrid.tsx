import React from 'react';
import { HOUR_HEIGHT, TOTAL_HOURS } from '../../utils/calendar';
import HourLabels from './HourLabels';
import ScheduleBlock from './ScheduleBlock';
import type { DaySchedule } from '../../api/schedule';

interface Props {
  days: DaySchedule[];
}

const TimeGrid: React.FC<Props> = ({ days }) => {
  const gridHeight = TOTAL_HOURS * HOUR_HEIGHT;

  // 检测重叠并计算宽度位置
  const computeLayout = (items: DaySchedule['items']) => {
    if (items.length === 0) return [];
    // 简化处理：按时间分组，最多2列
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
            {/* 小时刻度线 */}
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
            {/* 日程块 */}
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
