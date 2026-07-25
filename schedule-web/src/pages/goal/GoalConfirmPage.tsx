import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Table, Button, Space, Typography, message, Tag } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { goalApi } from '../../api/goal';
import StepProgress from '../../components/common/StepProgress';
import type { ColumnsType } from 'antd/es/table';

interface ParsedItem {
  title: string;
  estimatedDays?: number;
  priority?: string;
  dependency?: string;
}

const GoalConfirmPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const goalId = Number(id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [parsedTarget, setParsedTarget] = useState('');
  const [parsedDeadline, setParsedDeadline] = useState('');
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await goalApi.getResult(goalId);
        if (data.status !== 'PARSED' && data.status !== 'CONFIRMED') {
          message.warning('目标尚未解析完成，请返回补充信息');
          navigate(`/goals/${goalId}/clarify`, { replace: true });
          return;
        }
        setParsedTarget(data.parsedTarget || '');
        setParsedDeadline(data.parsedDeadline || '');
        setParsedItems(data.parsedItems ? JSON.parse(data.parsedItems) : []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [goalId, navigate]);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await goalApi.confirm(goalId);
      message.success('目标已确认，即将进入排期');
      setTimeout(() => navigate(`/goals/${goalId}/plan`), 500);
    } catch {
      // error handled by interceptor
    } finally {
      setConfirming(false);
    }
  };

  const columns: ColumnsType<ParsedItem> = [
    { title: '序号', render: (_, __, i) => i + 1, width: 60 },
    { title: '事项名称', dataIndex: 'title' },
    { title: '预计耗时', dataIndex: 'estimatedDays', render: (v: number) => v ? `${v}天` : '-' },
    {
      title: '优先级',
      dataIndex: 'priority',
      render: (v: string) => {
        const color = v === 'HIGH' ? 'red' : v === 'MEDIUM' ? 'orange' : 'default';
        return v ? <Tag color={color}>{v}</Tag> : '-';
      },
    },
    { title: '依赖', dataIndex: 'dependency', render: (v: string) => v || '无' },
  ];

  if (loading) {
    return <Card><Typography.Text>加载中...</Typography.Text></Card>;
  }

  return (
    <div>
      <StepProgress current={1} steps={['输入目标', '确认解析', '查看排期']} />

      <Card title="目标解析结果确认">
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="目标名称">{parsedTarget || '-'}</Descriptions.Item>
          <Descriptions.Item label="截止时间">{parsedDeadline || '-'}</Descriptions.Item>
          <Descriptions.Item label="事项数量">{parsedItems.length}</Descriptions.Item>
          <Descriptions.Item label="总预估耗时">
            {parsedItems.reduce((sum, i) => sum + (i.estimatedDays || 0), 0)}天
          </Descriptions.Item>
        </Descriptions>

        <Table
          dataSource={parsedItems}
          columns={columns}
          pagination={false}
          size="small"
          rowKey={(_, i) => String(i)}
          style={{ marginTop: 16 }}
        />

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Space>
            <Button type="primary" size="large" onClick={handleConfirm} loading={confirming}>
              确认无误
            </Button>
            <Button size="large" onClick={() => navigate(`/goals/${goalId}/clarify`)}>
              返回修改目标
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default GoalConfirmPage;
