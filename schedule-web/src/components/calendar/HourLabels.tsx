import React from 'react';
import { START_HOUR, END_HOUR, HOUR_HEIGHT, TOTAL_HOURS } from '../../utils/calendar';

const HourLabels: React.FC = () => {
  const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i);

  return (
    <div style={{ width: 56, flexShrink: 0, position: 'relative' }}>
      {hours.map((h) => (
        <div
          key={h}
          style={{
            position: 'absolute',
            top: (h - START_HOUR) * HOUR_HEIGHT,
            width: '100%',
            textAlign: 'right',
            paddingRight: 8,
            fontSize: 11,
            color: '#999',
            transform: 'translateY(-50%)',
          }}
        >
          {String(h).padStart(2, '0')}:00
        </div>
      ))}
    </div>
  );
};

export default HourLabels;
