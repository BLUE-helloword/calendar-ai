import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Button, Space, Typography, Timeline, Modal, DatePicker, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { taskApi } from '../../api/task';
import PriorityTag from '../../components/common/PriorityTag';
import StatusTag from '../../components/common/StatusTag';
import ConfirmModal from '../../components/common/ConfirmModal';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import type { Task } from '../../types/task';
import { STATUS_MAP } from '../../utils/constants';

const TaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const taskId = Number(id);
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmType, setConfirmType] = useState<'done' | 'delete' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [delayModalOpen, setDelayModalOpen] = useState(false);
  const [delayDate, setDelayDate] = useState<dayjs.Dayjs | null>(null);

  const fetchTask = async () => {
    setLoading(true);
    try {
      const res = await taskApi.detail(taskId);
      setTask(res);
    } catch { navigate('/tasks', { replace: true }); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTask(); }, [taskId]);

  const handleAction = async (action: string, extra?: Record<string, unknown>) => {
    setActionLoading(true);
    try {
      if (action === 'delete') {
        await taskApi.remove(taskId);
        message.success('任务已删除');
        navigate('/tasks', { replace: true });
      } else if (action === 'status') {
        await taskApi.updateStatus(taskId, extra as { status: string });
        message.success('状态已更新');
        fetchTask();
      } else if (action === 'delay') {
        await taskApi.update(taskId, {
          endTime: (extra!.endTime as string),
        });
        await taskApi.updateStatus(taskId, { status: 'DELAYED' });
        message.success('已设置延期');
        setDelayModalOpen(false);
        fetchTask();
      }
    } catch { /* handled */ }
    finally { setActionLoading(false); setConfirmType(null); }
  };

  if (loading) return <LoadingSkeleton rows={8} />;
  if (!task) return <Typography.Text>任务不存在</Typography.Text>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => navigate(-1)} />
        <Typography.Title level={4} style={{ margin: 0 }}>{task.title}</Typography.Title>
        <StatusTag status={task.status} />
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <Card title="任务信息">
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="优先级"><PriorityTag priority={task.priority} /></Descriptions.Item>
              <Descriptions.Item label="状态"><StatusTag status={task.status} /></Descriptions.Item>
              <Descriptions.Item label="开始时间">{task.startTime || '-'}</Descriptions.Item>
              <Descriptions.Item label="结束时间">{task.endTime || '-'}</Descriptions.Item>
              <Descriptions.Item label="预计耗时">{task.estimatedHours ? `${task.estimatedHours}小时` : '-'}</Descriptions.Item>
              <Descriptions.Item label="来源">{task.sourceType === 'AI_GENERATED' ? 'AI自动生成' : '手动创建'}</Descriptions.Item>
              <Descriptions.Item label="所属目标">
                {task.goalId ? <Button type="link" size="small" onClick={() => navigate(`/goals/${task.goalId}/plan`)}>查看目标</Button> : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">{task.createdAt || '-'}</Descriptions.Item>
            </Descriptions>
            {task.description && (
              <Typography.Paragraph style={{ marginTop: 16 }}>{task.description}</Typography.Paragraph>
            )}
          </Card>
        </div>

        <div style={{ width: 220 }}>
          <Card title="操作">
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              {task.status === 'TODO' && (
                <Button type="primary" block onClick={() => handleAction('status', { status: 'IN_PROGRESS' })} loading={actionLoading}>
                  开始执行
                </Button>
              )}
              {task.status !== 'DONE' && (
                <Button type="primary" block onClick={() => setConfirmType('done')}>
                  标记完成
                </Button>
              )}
              {task.status !== 'DELAYED' && task.status !== 'DONE' && (
                <Button block onClick={() => setDelayModalOpen(true)}>延期</Button>
              )}
              <Button block onClick={() => navigate(`/goals/${task.goalId}/plan`)}>重新规划</Button>
              <Button danger block onClick={() => setConfirmType('delete')}>删除任务</Button>
            </Space>
          </Card>
        </div>
      </div>

      <ConfirmModal open={confirmType === 'done'} title="确定标记为已完成？"
        onOk={() => handleAction('status', { status: 'DONE' })}
        onCancel={() => setConfirmType(null)} loading={actionLoading} />
      <ConfirmModal open={confirmType === 'delete'} title="确定删除该任务？" content="此操作不可撤销" danger
        onOk={() => handleAction('delete')}
        onCancel={() => setConfirmType(null)} loading={actionLoading} />

      <Modal title="延期设置" open={delayModalOpen}
        onOk={() => {
          if (!delayDate) return;
          handleAction('delay', { endTime: delayDate.format('YYYY-MM-DD HH:mm:ss') });
        }}
        onCancel={() => setDelayModalOpen(false)}>
        <DatePicker showTime value={delayDate} onChange={setDelayDate} style={{ width: '100%' }}
                    disabledDate={(d) => d && d.isBefore(dayjs(), 'day')} />
      </Modal>
    </div>
  );
};

export default TaskDetailPage;
