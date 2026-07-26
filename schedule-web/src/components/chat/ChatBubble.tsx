import React from 'react';
import { UserOutlined, RobotOutlined, CheckCircleFilled } from '@ant-design/icons';
import { Typography, Button, Space, Tag } from 'antd';
import ScheduleCard from './ScheduleCard';
import type { ScheduleData, ConflictData, TaskCreatedData } from '../../types/chat';

interface Props {
  role: 'user' | 'agent';
  content: string;
  questions?: string[];
  type?: 'text' | 'clarify' | 'schedule_card' | 'task_created';
  schedule?: ScheduleData;
  conflicts?: ConflictData[];
  taskCreated?: TaskCreatedData;
}

const ChatBubble: React.FC<Props> = ({ role, content, questions, type, schedule, conflicts, taskCreated }) => {
  const isSchedule = type === 'schedule_card';

  return (
    <div className={`chat-bubble chat-bubble--${role}`} style={{ marginBottom: 16 }}>
      <div className="chat-bubble__avatar">
        {role === 'user' ? <UserOutlined /> : <RobotOutlined />}
      </div>
      <div className="chat-bubble__body" style={{
        maxWidth: isSchedule ? '95%' : '90%',
        background: isSchedule ? 'transparent' : undefined,
        padding: isSchedule ? 0 : undefined,
        borderRadius: isSchedule ? 0 : undefined,
      }}>
        {/* Text content */}
        {content && !isSchedule && (
          <div className="chat-bubble__text" style={{ whiteSpace: 'pre-wrap' }}>
            {content}
          </div>
        )}

        {/* Clarify: question list */}
        {type === 'clarify' && questions && questions.length > 0 && (
          <div style={{ marginTop: 8 }}>
            {questions.map((q, i) => (
              <div key={i} style={{
                padding: '4px 8px',
                marginBottom: 4,
                fontSize: 13,
                color: '#1677ff',
              }}>
                {i + 1}. {q}
              </div>
            ))}
          </div>
        )}

        {/* Schedule card — rendered cleanly without grey bubble */}
        {isSchedule && schedule && (
          <div>
            {content && (
              <div style={{
                fontSize: 13,
                color: '#666',
                marginBottom: 10,
                padding: '4px 0',
                whiteSpace: 'pre-wrap',
              }}>
                {content}
              </div>
            )}
            <ScheduleCard schedule={schedule} conflicts={conflicts} />
          </div>
        )}

        {/* Task created */}
        {type === 'task_created' && taskCreated && (
          <div style={{
            background: '#f6ffed',
            borderRadius: 8,
            padding: '12px 16px',
            marginTop: 8,
            border: '1px solid #b7eb8f',
          }}>
            <div style={{ fontSize: 14, marginBottom: 8 }}>
              <CheckCircleFilled style={{ color: '#52c41a', marginRight: 8 }} />
              {content}
            </div>
            <Space size={8}>
              <Tag color="blue">{taskCreated.createdTasks} 个任务</Tag>
              <Tag color="green">{taskCreated.createdSchedules} 个日程</Tag>
              <Tag color="orange">{taskCreated.createdReminders} 个提醒</Tag>
            </Space>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatBubble;
