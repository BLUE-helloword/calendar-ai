import React from 'react';
import { Button, Typography, Space } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getWeekDays, formatWeekRange } from '../../utils/calendar';

interface Props {
  weekStart: string;
  weekEnd: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

const WeekHeader: React.FC<Props> = ({ weekStart, weekEnd, onPrev, onNext, onToday }) => {
  const days = getWeekDays(weekStart);
  const range = formatWeekRange(weekStart, weekEnd);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Space>
          <Button icon={<LeftOutlined />} size="small" onClick={onPrev} />
          <Button icon={<RightOutlined />} size="small" onClick={onNext} />
        </Space>
        <Typography.Title level={4} style={{ margin: 0 }}>{range}</Typography.Title>
        <Button size="small" onClick={onToday}>本周</Button>
      </div>

      {/* 日期头 */}
      <div style={{ display: 'flex', borderBottom: '2px solid #1677ff' }}>
        <div style={{ width: 56, flexShrink: 0 }} />
        {days.map((d, i) => {
          const isToday = d.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD');
          return (
            <div
              key={i}
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '8px 4px',
                backgroundColor: isToday ? '#e6f4ff' : 'transparent',
                borderRadius: isToday ? '4px 4px 0 0' : 0,
              }}
            >
              <div style={{ fontSize: 12, color: '#999' }}>
                {['周一','周二','周三','周四','周五','周六','周日'][i]}
              </div>
              <div style={{
                fontSize: 18,
                fontWeight: isToday ? 700 : 400,
                color: d.day() === 0 || d.day() === 6 ? '#f5222d' : '#333',
              }}>
                {d.format('D')}
              </div>
              <div style={{ fontSize: 11, color: '#bbb' }}>{d.format('M')}月</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeekHeader;
