import React from 'react';
import { calcPosition } from '../../utils/calendar';
import type { CalendarItem } from '../../api/schedule';

interface Props {
  item: CalendarItem;
  width: number;
  left: number;
}

const ScheduleBlock: React.FC<Props> = ({ item, width, left }) => {
  const { top, height } = calcPosition(item.startTime, item.endTime);
  if (top < -10 || top + height < 0) return null;

  const isPreview = item.status === 'PREVIEW';

  return (
    <div
      title={`${item.title}\n${item.startTime} ~ ${item.endTime}${isPreview ? '\n(AI 预览)' : ''}`}
      style={{
        position: 'absolute',
        top,
        height: Math.max(height, 20),
        left: `${left}%`,
        width: `${width}%`,
        padding: '2px 4px',
        backgroundColor: isPreview ? 'transparent' : (item.color || '#1677ff'),
        opacity: item.status === 'DONE' ? 0.5 : 0.85,
        borderRadius: 4,
        fontSize: 11,
        color: isPreview ? (item.color || '#1677ff') : '#fff',
        overflow: 'hidden',
        cursor: 'default',
        border: isPreview ? `2px dashed ${item.color}` : '1px solid rgba(255,255,255,0.2)',
        boxSizing: 'border-box',
        zIndex: isPreview ? 2 : 1,
        lineHeight: 1.3,
      }}
    >
      <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {item.title}
      </div>
      {height > 30 && (
        <div style={{ fontSize: 10, opacity: 0.8 }}>
          {item.startTime.slice(11, 16)}-{item.endTime.slice(11, 16)}
        </div>
      )}
    </div>
  );
};

export default ScheduleBlock;
