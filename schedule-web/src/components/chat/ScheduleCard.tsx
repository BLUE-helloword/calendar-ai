import React from 'react';
import { Typography, Tag, Space } from 'antd';
import { ClockCircleOutlined, WarningFilled } from '@ant-design/icons';
import type { ScheduleData, ConflictData } from '../../types/chat';

interface Props {
  schedule: ScheduleData;
  conflicts?: ConflictData[];
}

const priorityConfig: Record<string, { color: string; label: string }> = {
  HIGH: { color: '#ff4d4f', label: '高' },
  MEDIUM: { color: '#faad14', label: '中' },
  LOW: { color: '#52c41a', label: '低' },
};

const ScheduleCard: React.FC<Props> = ({ schedule, conflicts }) => {
  return (
    <div style={{
      background: '#fafafa',
      borderRadius: 8,
      padding: '12px 16px',
      marginTop: 8,
      border: '1px solid #f0f0f0',
    }}>
      {/* Title */}
      <div style={{ marginBottom: 8 }}>
        <Typography.Text strong style={{ fontSize: 15 }}>
          📋 {schedule.title || '排期方案'}
        </Typography.Text>
        {schedule.deadline && (
          <Tag color="blue" style={{ marginLeft: 8 }}>
            截止 {schedule.deadline}
          </Tag>
        )}
      </div>

      {/* Items */}
      <div style={{ marginBottom: 8 }}>
        {schedule.items.map((item, i) => {
          const pconfig = priorityConfig[item.priority] || priorityConfig.MEDIUM;
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '6px 8px',
                background: '#fff',
                borderRadius: 4,
                marginBottom: 4,
                border: item.hasConflict ? '1px solid #ff4d4f' : '1px solid #f0f0f0',
              }}
            >
              <ClockCircleOutlined style={{ color: '#999', marginRight: 8, fontSize: 13 }} />
              <Typography.Text style={{ fontSize: 13, flex: 1 }}>
                {item.startTime?.slice(5, 10) || '?'} - {item.endTime?.slice(5, 10) || '?'}
              </Typography.Text>
              <Typography.Text strong style={{ fontSize: 13, flex: 2 }}>
                {item.title}
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12, marginRight: 8 }}>
                {item.estimatedHours > 0 ? `${item.estimatedHours}h` : ''}
              </Typography.Text>
              <Tag color={pconfig.color} style={{ fontSize: 11, lineHeight: '18px' }}>
                {pconfig.label}
              </Tag>
            </div>
          );
        })}
      </div>

      {/* Conflicts */}
      {conflicts && conflicts.length > 0 && (
        <div style={{
          background: '#fff7e6',
          borderRadius: 4,
          padding: '8px 12px',
          marginBottom: 8,
        }}>
          {conflicts.map((c, i) => (
            <div key={i} style={{ fontSize: 12, color: '#faad14', marginBottom: 2 }}>
              <WarningFilled style={{ marginRight: 4 }} />
              {c.item && `"${c.item}" `}与「{c.overlapWith}」重叠
              {c.suggestion && ` — ${c.suggestion}`}
            </div>
          ))}
        </div>
      )}

      {/* Confirm hint */}
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        在下方点击「确认排期」创建任务，或在输入框中继续调整
      </Typography.Text>
    </div>
  );
};

export default ScheduleCard;
