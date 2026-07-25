import React from 'react';
import { Row, Col, Card, Statistic, Button, Typography, List, Tag, message } from 'antd';
import { PlusOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDashboard } from '../../hooks/useDashboard';
import { taskApi } from '../../api/task';
import TaskCard from '../../components/common/TaskCard';
import StatusTag from '../../components/common/StatusTag';
import PriorityTag from '../../components/common/PriorityTag';
import TimeRangeBadge from '../../components/common/TimeRangeBadge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, loading, refresh } = useDashboard();

  if (loading) {
    return (
      <Row gutter={16}>
        {[1, 2, 3, 4].map((i) => (
          <Col span={12} key={i}><Card><LoadingSkeleton rows={3} /></Card></Col>
        ))}
      </Row>
    );
  }

  if (!data) {
    return <EmptyState description="加载失败，请刷新页面" actionText="刷新" onAction={refresh} />;
  }

  const todayActive = (data.todayTasks || []).filter(t => t.status !== 'DONE' && t.status !== 'CANCELLED');

  return (
    <div>
      <Row gutter={16}>
        <Col span={16}>
          <Card title="今日待办" extra={<Button type="link" onClick={() => navigate('/tasks')}>查看全部</Button>}>
            {todayActive.length === 0 ? (
              <EmptyState description="暂无今日待办" actionText="新建目标" onAction={() => navigate('/goals/new')} />
            ) : (
              todayActive.map(task => (
                <TaskCard key={task.id} task={task} onRefresh={refresh} onClick={(id) => navigate(`/tasks/${id}`)} showCheckbox />
              ))
            )}
          </Card>
          <Card title="本周日程" style={{ marginTop: 16 }}>
            <div className="plan-timeline">
              {(() => {
                const now = new Date();
                const monday = new Date(now);
                monday.setDate(now.getDate() - now.getDay() + 1);
                monday.setHours(0, 0, 0, 0);
                const days = Array.from({ length: 7 }, (_, i) => {
                  const d = new Date(monday);
                  d.setDate(monday.getDate() + i);
                  return d;
                });
                const allSchedules = [...(data.todaySchedules || []), ...(data.upcomingTasks || [])];
                return days.map((day, i) => {
                  const dayStr = day.toISOString().substring(0, 10);
                  const dayItems = allSchedules.filter(s => {
                    const t = s.startTime || '';
                    return t.startsWith(dayStr);
                  });
                  return (
                    <div className="plan-day" key={i}>
                      <div className="plan-day-header">
                        {['一','二','三','四','五','六','日'][i]}<br/>
                        {day.getMonth() + 1}/{day.getDate()}
                      </div>
                      <div className="plan-day-body">
                        {dayItems.slice(0, 3).map((item, j) => {
                          const title = item.title || '';
                          const color = 'color' in item ? (item as any).color : '#1677ff';
                          const navId = 'taskId' in item ? (item as any).taskId : (item as any).id;
                          return (
                            <div
                              key={j}
                              className="plan-item-block"
                              style={{ background: color || '#1677ff' }}
                              onClick={() => navigate(`/tasks/${navId || (item as any).id}`)}
                              title={title}
                            >
                              {title}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="快捷操作" style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} block style={{ marginBottom: 12 }}
                    onClick={() => navigate('/goals/new')}>
              新建目标
            </Button>
            <Button icon={<ThunderboltOutlined />} block onClick={() => navigate('/goals/new')}>
              智能整理
            </Button>
          </Card>
          <Card title="统计概览" style={{ marginBottom: 16 }}>
            <Row gutter={[8, 16]}>
              <Col span={12}><Statistic title="总任务" value={data.totalTasks} /></Col>
              <Col span={12}><Statistic title="已完成" value={data.completedTasks} valueStyle={{ color: '#52c41a' }} /></Col>
              <Col span={12}><Statistic title="已延期" value={data.delayedTasks} valueStyle={{ color: '#f5222d' }} /></Col>
              <Col span={12}><Statistic title="高优先级" value={data.highPriorityTasks?.length || 0} valueStyle={{ color: '#fa8c16' }} /></Col>
            </Row>
          </Card>
          <Card title="高优先级任务">
            {(data.highPriorityTasks || []).length === 0 ? (
              <EmptyState description="无高优先级任务" />
            ) : (
              <List
                dataSource={data.highPriorityTasks}
                renderItem={(task) => (
                  <List.Item
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/tasks/${task.id}`)}
                    extra={
                      task.status === 'TODO'
                        ? <Button size="small" type="primary" onClick={(e) => { e.stopPropagation(); taskApi.updateStatus(task.id, { status: 'IN_PROGRESS' }).then(() => refresh()); }}>开始</Button>
                        : <StatusTag status={task.status} />
                    }
                  >
                    <List.Item.Meta
                      title={<span style={{ fontSize: 14 }}>{task.title}</span>}
                      description={<TimeRangeBadge start={task.startTime} end={task.endTime} />}
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
