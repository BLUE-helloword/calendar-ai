import React, { useState, useEffect, useMemo } from 'react';
import { Card, Select, Row, Col, Statistic, Typography, List, Button, Empty } from 'antd';
import { useNavigate } from 'react-router-dom';
import { Column } from '@ant-design/charts';
import { dashboardApi } from '../../api/dashboard';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import type { ReportVO } from '../../types/dashboard';

const ReportPage: React.FC = () => {
  const navigate = useNavigate();
  const [days, setDays] = useState(7);
  const [data, setData] = useState<ReportVO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await dashboardApi.report(days);
        setData(res);
      } finally { setLoading(false); }
    };
    fetch();
  }, [days]);

  const chartData = useMemo(() => {
    if (!data?.completedTasks?.length) return [];
    const grouped: Record<string, number> = {};
    data.completedTasks.forEach(t => {
      const day = (t.updatedAt || '').substring(0, 10);
      if (day) grouped[day] = (grouped[day] || 0) + 1;
    });
    return Object.entries(grouped).map(([date, count]) => ({ date, count }));
  }, [data]);

  const completionRate = data && data.totalCount > 0
    ? Math.round((data.completedCount / data.totalCount) * 100)
    : 0;

  if (loading) return <LoadingSkeleton rows={6} />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>周报统计</Typography.Title>
        <Select value={days} onChange={setDays} style={{ width: 120 }}
          options={[{ value: 7, label: '最近7天' }, { value: 14, label: '最近14天' }, { value: 30, label: '最近30天' }]} />
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card><Statistic title="已完成数量" value={data?.completedCount || 0} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="完成率" value={completionRate} suffix="%" /></Card></Col>
        <Col span={6}><Card><Statistic title="总任务" value={data?.totalCount || 0} /></Card></Col>
        <Col span={6}><Card><Statistic title="统计周期" value={data?.period || '-'} /></Card></Col>
      </Row>

      <Row gutter={16}>
        <Col span={16}>
          <Card title="任务完成趋势">
            {chartData.length > 0 ? (
              <Column data={chartData} xField="date" yField="count" columnWidthRatio={0.6}
                      label={{ position: 'top' }} color="#52c41a" height={300} />
            ) : (
              <Empty description="暂无完成数据" />
            )}
          </Card>
        </Col>
        <Col span={8}>
          <Card title="已完成任务" style={{ marginBottom: 16 }}>
            {data?.completedTasks?.length ? (
              <List size="small" dataSource={data.completedTasks}
                    renderItem={(t) => (
                      <List.Item style={{ cursor: 'pointer' }} onClick={() => navigate(`/tasks/${t.id}`)}>
                        {t.title}
                      </List.Item>
                    )} />
            ) : <Empty description="暂无已完成任务" />}
          </Card>
          <Card title="待办/逾期">
            {data?.totalCount && data.completedCount < data.totalCount ? (
              <List size="small" renderItem={() => null}>
                <div style={{ textAlign: 'center', padding: 20 }}>
                  <Typography.Text type="secondary">还有 {data.totalCount - data.completedCount} 个任务未完成</Typography.Text>
                  <br />
                  <Button type="link" onClick={() => navigate('/tasks')}>查看全部</Button>
                </div>
              </List>
            ) : <Empty description="所有任务已完成" />}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ReportPage;
