import React, { useState } from 'react';
import { Card, Input, Button, Typography, Alert, Descriptions, Table, Space, Progress, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useGoalParser } from '../../hooks/useGoalParser';
import StepProgress from '../../components/common/StepProgress';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import type { ColumnsType } from 'antd/es/table';

interface ParsedItem {
  title: string;
  estimatedDays?: number;
  dependency?: string;
}

const GoalNewPage: React.FC = () => {
  const [rawInput, setRawInput] = useState('');
  const { loading, parseResult, error, parse, reset } = useGoalParser();
  const navigate = useNavigate();

  const handleParse = async () => {
    if (!rawInput.trim()) return;
    const result = await parse(rawInput.trim());
    if (result?.needsClarification) {
      navigate(`/goals/${result.goalId}/clarify`);
    }
  };

  const parsedItems: ParsedItem[] = parseResult?.parsedItems
    ? JSON.parse(parseResult.parsedItems)
    : [];

  const columns: ColumnsType<ParsedItem> = [
    { title: '序号', render: (_, __, i) => i + 1, width: 60 },
    { title: '事项名称', dataIndex: 'title' },
    { title: '预计耗时', dataIndex: 'estimatedDays', render: (v: number) => v ? `${v}天` : '-' },
    { title: '依赖', dataIndex: 'dependency', render: (v: string) => v || '无' },
  ];

  return (
    <div>
      <StepProgress current={0} steps={['输入目标', '确认解析', '查看排期']} />

      <Card title="输入目标">
        <Input.TextArea
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          placeholder="用自然语言描述你的目标，例如：帮我安排下周五前完成新人培训汇报，包括材料整理、PPT初稿、评审修改和最终彩排"
          autoSize={{ minRows: 4, maxRows: 8 }}
          disabled={loading}
        />
        <Typography.Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
          提示：尽量说清做什么、截止时间、有哪些子事项
        </Typography.Text>
        <Button
          type="primary"
          size="large"
          onClick={handleParse}
          loading={loading}
          disabled={!rawInput.trim()}
          style={{ marginTop: 16 }}
        >
          开始解析
        </Button>
      </Card>

      {loading && (
        <Card style={{ marginTop: 16 }}>
          <LoadingSkeleton rows={3} />
          <Typography.Text type="secondary">AI 正在分析您的目标...</Typography.Text>
        </Card>
      )}

      {error && (
        <Card style={{ marginTop: 16 }}>
          <Alert type="error" message={error} showIcon />
        </Card>
      )}

      {parseResult && !parseResult.needsClarification && !loading && (
        <Card title="解析结果" style={{ marginTop: 16 }}>
          {parseResult.confidence < 0.6 && (
            <Alert type="warning" message="部分信息不确定，建议确认后继续" showIcon style={{ marginBottom: 16 }} />
          )}

          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="识别目标">{parseResult.parsedTarget || '-'}</Descriptions.Item>
            <Descriptions.Item label="截止时间">{parseResult.parsedDeadline || '-'}</Descriptions.Item>
            <Descriptions.Item label="事项数量">{parsedItems.length}</Descriptions.Item>
            <Descriptions.Item label="置信度">
              <Progress percent={Math.round(parseResult.confidence * 100)} size="small"
                        status={parseResult.confidence >= 0.6 ? 'success' : 'exception'} />
            </Descriptions.Item>
          </Descriptions>

          {parsedItems.length > 0 && (
            <Table
              dataSource={parsedItems}
              columns={columns}
              pagination={false}
              size="small"
              rowKey={(_, i) => String(i)}
              style={{ marginTop: 16 }}
            />
          )}

          <Space style={{ marginTop: 16 }}>
            <Button type="primary" onClick={() => navigate(`/goals/${parseResult.goalId}/confirm`)}>
              确认目标
            </Button>
            <Button onClick={() => { setRawInput(''); reset(); }}>手动修改</Button>
          </Space>
        </Card>
      )}
    </div>
  );
};

export default GoalNewPage;
