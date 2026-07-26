import React from 'react';
import { Empty } from 'antd';
import { HOUR_HEIGHT, START_HOUR, TOTAL_HOURS } from '../../utils/calendar';
import HourLabels from './HourLabels';
import type { CalendarItem } from '../../api/schedule';

interface Props {
  date: string;
  items: CalendarItem[];
}

const DayView: React.FC<Props> = ({ date, items }) => {
  const gridHeight = TOTAL_HOURS * HOUR_HEIGHT;

  if (items.length === 0) {
    return <Empty description={`${date} 暂无日程`} style={{ marginTop: 80 }} />;
  }

  // Current time indicator
  const now = new Date();
  const nowHour = now.getHours() + now.getMinutes() / 60;
  const showNowLine = date === new Date().toISOString().slice(0, 10);
  const nowTop = (nowHour - START_HOUR) * HOUR_HEIGHT;

  return (
    <div style={{ display: 'flex', overflowX: 'auto', paddingTop: 0 }}>
      <HourLabels />
      <div style={{ flex: 1, position: 'relative', minWidth: 300, height: gridHeight }}>
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
        {showNowLine && nowTop >= 0 && nowTop <= gridHeight && (
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

        {/* Event blocks */}
        {items.map((item, idx) => {
          const startTime = new Date(item.startTime);
          const endTime = new Date(item.endTime);
          const startH = startTime.getHours() + startTime.getMinutes() / 60;
          const endH = endTime.getHours() + endTime.getMinutes() / 60;
          const top = (startH - START_HOUR) * HOUR_HEIGHT;
          const height = Math.max((endH - startH) * HOUR_HEIGHT, 20);
          const isPreview = item.status === 'PREVIEW';

          if (top + height < 0) return null;

          return (
            <div
              key={idx}
              title={`${item.title}\n${item.startTime.slice(11)} - ${item.endTime.slice(11)}${isPreview ? '\n(AI 预览)' : ''}`}
              style={{
                position: 'absolute',
                top: Math.max(top, 0),
                height,
                left: '4%',
                width: '92%',
                padding: '4px 8px',
                backgroundColor: isPreview ? 'transparent' : item.color,
                opacity: item.status === 'DONE' ? 0.5 : 0.85,
                borderRadius: 4,
                fontSize: 13,
                color: isPreview ? item.color : '#fff',
                overflow: 'hidden',
                cursor: 'pointer',
                border: isPreview ? `2px dashed ${item.color}` : '1px solid rgba(255,255,255,0.2)',
                boxSizing: 'border-box',
                zIndex: isPreview ? 2 : 1,
              }}
            >
              <div style={{ fontWeight: 500 }}>{item.title}</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>
                {startTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                {' - '}
                {endTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DayView;
