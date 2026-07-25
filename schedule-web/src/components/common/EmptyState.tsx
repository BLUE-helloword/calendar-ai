import React from 'react';
import { Empty, Button } from 'antd';

interface Props {
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<Props> = ({ description = '暂无数据', actionText, onAction }) => (
  <Empty description={description} style={{ padding: 40 }}>
    {actionText && onAction && (
      <Button type="primary" onClick={onAction}>{actionText}</Button>
    )}
  </Empty>
);

export default EmptyState;
