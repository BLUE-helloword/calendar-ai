import React, { useState } from 'react';
import { Card, Checkbox, Dropdown, Button, message } from 'antd';
import { MoreOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import PriorityTag from './PriorityTag';
import StatusTag from './StatusTag';
import TimeRangeBadge from './TimeRangeBadge';
import ConfirmModal from './ConfirmModal';
import { taskApi } from '../../api/task';
import type { Task } from '../../types/task';

interface Props {
  task: Task;
  onRefresh: () => void;
  onClick: (id: number) => void;
  showCheckbox?: boolean;
}

const TaskCard: React.FC<Props> = ({ task, onRefresh, onClick, showCheckbox = false }) => {
  const [confirmType, setConfirmType] = useState<'done' | 'delete' | null>(null);
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (status: string) => {
    setLoading(true);
    try {
      await taskApi.updateStatus(task.id, { status });
      message.success(status === 'DONE' ? '已标记完成' : '状态已更新');
      onRefresh();
    } catch { /* error handled by interceptor */ }
    finally { setLoading(false); setConfirmType(null); }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await taskApi.remove(task.id);
      message.success('任务已删除');
      onRefresh();
    } catch { /* error handled by interceptor */ }
    finally { setLoading(false); setConfirmType(null); }
  };

  const menuItems: MenuProps['items'] = [
    { key: 'start', label: '开始执行' },
    { key: 'done', label: '标记完成' },
    { key: 'delete', label: '删除', danger: true },
  ];

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'start') handleStatusChange('IN_PROGRESS');
    else if (key === 'done') setConfirmType('done');
    else if (key === 'delete') setConfirmType('delete');
  };

  return (
    <>
      <Card
        hoverable
        size="small"
        style={{ marginBottom: 8 }}
        onClick={() => onClick(task.id)}
        extra={
          <Dropdown menu={{ items: menuItems, onClick: handleMenuClick }} trigger={['click']}>
            <Button icon={<MoreOutlined />} type="text" size="small" onClick={(e) => e.stopPropagation()} />
          </Dropdown>
        }
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {showCheckbox && (
            <Checkbox
              checked={task.status === 'DONE'}
              disabled={task.status === 'DONE'}
              onChange={(e) => { e.stopPropagation(); if (e.target.checked) setConfirmType('done'); }}
            />
          )}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontWeight: 500 }}>{task.title}</span>
              <PriorityTag priority={task.priority} />
              <StatusTag status={task.status} />
            </div>
            {task.description && (
              <div style={{ fontSize: 12, color: '#999', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 400 }}>
                {task.description}
              </div>
            )}
            <TimeRangeBadge start={task.startTime} end={task.endTime} />
          </div>
        </div>
      </Card>
      <ConfirmModal
        open={confirmType === 'done'}
        title="确定标记为已完成？"
        onOk={() => handleStatusChange('DONE')}
        onCancel={() => setConfirmType(null)}
        loading={loading}
      />
      <ConfirmModal
        open={confirmType === 'delete'}
        title="确定删除该任务？"
        content="此操作不可撤销"
        danger
        onOk={handleDelete}
        onCancel={() => setConfirmType(null)}
        loading={loading}
      />
    </>
  );
};

export default TaskCard;
