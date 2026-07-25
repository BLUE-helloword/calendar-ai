import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Alert, Popover, Modal, DatePicker, Typography, message } from 'antd';
import { WarningFilled } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { planApi } from '../../api/plan';
import StepProgress from '../../components/common/StepProgress';
import PriorityTag from '../../components/common/PriorityTag';
import type { PlanVO, PlanItem, PlanItemInput } from '../../types/plan';
import type { ColumnsType } from 'antd/es/table';

const PlanPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const goalId = Number(id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [plan, setPlan] = useState<PlanVO | null>(null);
  const [editItem, setEditItem] = useState<PlanItem | null>(null);
  const [editStart, setEditStart] = useState<dayjs.Dayjs | null>(null);
  const [editEnd, setEditEnd] = useState<dayjs.Dayjs | null>(null);

  const fetchPlan = async () => {
    setLoading(true);
    try {
      const res = await planApi.generate(goalId);
      setPlan(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlan(); }, [goalId]);

  const handleConfirm = async () => {
    if (!plan) return;
    const items: PlanItemInput[] = plan.planItems.map(item => ({
      title: item.title,
      startTime: item.startTime,
      endTime: item.endTime,
      priority: item.priority,
    }));
    Modal.confirm({
      title: '确认排期',
      content: `将创建 ${items.length} 个任务、${items.length} 个日程、${items.length} 个提醒，是否继续？`,
      onOk: async () => {
        setConfirming(true);
        try {
          await planApi.confirm(goalId, { items });
          message.success('排期已确认，任务已创建');
          navigate('/tasks', { replace: true });
        } catch { /* error handled by interceptor */ }
        finally { setConfirming(false); }
      },
    });
  };

  const handleEdit = (item: PlanItem) => {
    setEditItem(item);
    setEditStart(dayjs(item.startTime));
    setEditEnd(dayjs(item.endTime));
  };

  const handleEditSave = () => {
    if (!editItem || !editStart || !editEnd) return;
    setPlan(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        planItems: prev.planItems.map(i =>
          i.title === editItem.title
            ? { ...i, startTime: editStart.format('YYYY-MM-DD HH:mm:ss'), endTime: editEnd.format('YYYY-MM-DD HH:mm:ss') }
            : i
        ),
      };
    });
    setEditItem(null);
  };

  const columns: ColumnsType<PlanItem> = [
    { title: '序号', render: (_, __, i) => i + 1, width: 60 },
    { title: '事项名称', dataIndex: 'title' },
    { title: '预计耗时', dataIndex: 'estimatedHours', render: (v: number) => `${v}小时` },
    { title: '优先级', dataIndex: 'priority', render: (v: string) => <PriorityTag priority={v === 'HIGH' ? 1 : v === 'MEDIUM' ? 2 : 3} /> },
    {
      title: '时间',
      key: 'time',
      render: (_, r) => <span style={{ fontSize: 12 }}>{r.startTime} ~ {r.endTime}</span>,
    },
    {
      title: '状态',
      key: 'status',
      render: (_, r) =>
        r.hasConflict ? (
          <Popover title="时间冲突" content={r.conflictDetail || '与其他日程冲突'}>
            <span style={{ color: '#f5222d', cursor: 'pointer' }}>
              <WarningFilled /> 冲突
            </span>
          </Popover>
        ) : <span style={{ color: '#52c41a' }}>正常</span>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, r) => <Button size="small" type="link" onClick={() => handleEdit(r)}>调整</Button>,
    },
  ];

  const conflicts = plan?.planItems.filter(i => i.hasConflict) || [];

  return (
    <div>
      <StepProgress current={2} steps={['输入目标', '确认解析', '查看排期并确认']} />

      {loading && <Card><Typography.Text>正在生成排期方案...</Typography.Text></Card>}

      {!loading && plan && (
        <>
          <Card title="排期方案" style={{ marginBottom: 16 }}>
            <Table dataSource={plan.planItems} columns={columns} pagination={false} size="small"
                   rowKey={(_, i) => String(i)} />
          </Card>

          {conflicts.length > 0 && (
            <Card title="冲突提醒" style={{ marginBottom: 16 }}>
              {conflicts.map((c, i) => (
                <Alert
                  key={i}
                  type="warning"
                  showIcon
                  message={`"${c.title}" ${c.conflictDetail || '存在时间冲突'}`}
                  style={{ marginBottom: 8 }}
                />
              ))}
            </Card>
          )}

          <Space style={{ justifyContent: 'center', display: 'flex' }}>
            <Button type="primary" size="large" onClick={handleConfirm} loading={confirming}>
              确认排期
            </Button>
            <Button size="large" onClick={fetchPlan} loading={loading}>
              重新生成
            </Button>
          </Space>
        </>
      )}

      <Modal
        title="调整时间"
        open={!!editItem}
        onOk={handleEditSave}
        onCancel={() => setEditItem(null)}
        destroyOnClose
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Typography.Text>开始时间</Typography.Text>
            <DatePicker showTime value={editStart} onChange={setEditStart} style={{ width: '100%' }} />
          </div>
          <div>
            <Typography.Text>结束时间</Typography.Text>
            <DatePicker showTime value={editEnd} onChange={setEditEnd} style={{ width: '100%' }} />
          </div>
        </Space>
      </Modal>
    </div>
  );
};

export default PlanPage;
