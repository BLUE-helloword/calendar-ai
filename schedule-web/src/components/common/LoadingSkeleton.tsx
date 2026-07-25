import React from 'react';
import { Skeleton } from 'antd';

interface Props {
  rows?: number;
}

const LoadingSkeleton: React.FC<Props> = ({ rows = 4 }) => (
  <div style={{ padding: 16 }}>
    <Skeleton active paragraph={{ rows }} />
  </div>
);

export default LoadingSkeleton;
