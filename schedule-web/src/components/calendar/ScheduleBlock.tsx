import React from 'react';
import { useNavigate } from 'react-router-dom';
import { calcPosition } from '../../utils/calendar';
import type { CalendarItem } from '../../api/schedule';

interface Props {
  item: CalendarItem;
  width: number;
  left: number;
}

const ScheduleBlock: React.FC<Props> = ({ item, width, left }) => {
  const navigate = useNavigate();
  const { top, height } = calcPosition(item.startTime, item.endTime);

  // 超出显示范围的日程截断提示
  if (top < -10 || top + height < 0) return null;

  const handleClick = () => {
    if (item.type === 'TASK') {
      navigate(`/tasks/${item.id}`);
    }
  };

  const isPreview = item.status === 'PREVIEW';

  return (
    <div
      onClick={handleClick}
      title={`${item.title}\n${item.startTime} ~ ${item.endTime}${isPreview ? '\n(AI 预览)' : ''}`}
      style={{
        position: 'absolute',
        top,
        height,
        left: `${left}%`,
        width: `${width}%`,
        padding: '2px 4px',
        backgroundColor: isPreview ? 'transparent' : item.color,
        opacity: item.status === 'DONE' ? 0.5 : 0.85,
        borderRadius: 4,
        fontSize: 11,
        color: isPreview ? item.color : '#fff',
        overflow: 'hidden',
        cursor: item.type === 'TASK' || isPreview ? 'pointer' : 'default',
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
