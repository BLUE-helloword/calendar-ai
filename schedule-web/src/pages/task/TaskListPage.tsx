import React from 'react';
import { Card, Select, Input, Typography, Pagination, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTaskList } from '../../hooks/useTaskList';
import TaskCard from '../../components/common/TaskCard';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import { STATUS_MAP, PRIORITY_MAP } from '../../utils/constants';

const TaskListPage: React.FC = () => {
  const navigate = useNavigate();
  const { tasks, total, loading, filters, setFilters, refresh, updateStatus, removeTask } = useTaskList();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>任务列表</Typography.Title>
        <Typography.Text type="secondary">共 {total} 条</Typography.Text>
      </div>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            placeholder="全部状态"
            allowClear
            style={{ width: 120 }}
            value={filters.status || undefined}
            options={Object.entries(STATUS_MAP).map(([k, v]) => ({ value: k, label: v.label }))}
            onChange={(val) => setFilters({ status: val, page: 1 })}
          />
          <Select
            placeholder="全部优先级"
            allowClear
            style={{ width: 120 }}
            value={filters.priority || undefined}
            options={Object.entries(PRIORITY_MAP).map(([k, v]) => ({ value: k, label: v.label }))}
            onChange={(val) => setFilters({ priority: val, page: 1 })}
          />
          <Input.Search
            placeholder="搜索任务标题..."
            allowClear
            style={{ width: 250 }}
            onSearch={(val) => setFilters({ search: val, page: 1 })}
            onChange={(e) => { if (!e.target.value) setFilters({ search: undefined, page: 1 }); }}
          />
        </Space>
      </Card>

      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : tasks.length === 0 ? (
        <EmptyState
          description={filters.search || filters.status || filters.priority ? '未找到匹配的任务' : '暂无任务，去创建一个吧？'}
          actionText="新建目标"
          onAction={() => navigate('/goals/new')}
        />
      ) : (
        <>
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} onRefresh={refresh} onClick={(id) => navigate(`/tasks/${id}`)} showCheckbox />
          ))}
          {total > filters.pageSize && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Pagination
                current={filters.page}
                total={total}
                pageSize={filters.pageSize}
                onChange={(page) => setFilters({ page })}
                showSizeChanger={false}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TaskListPage;
