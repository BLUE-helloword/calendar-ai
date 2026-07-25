import React from 'react';
import { Tag } from 'antd';
import { PRIORITY_MAP } from '../../utils/constants';

interface Props {
  priority: number;
}

const PriorityTag: React.FC<Props> = ({ priority }) => {
  const cfg = PRIORITY_MAP[priority] || { label: '未知', color: '#999' };
  return <Tag color={cfg.color}>{cfg.label}</Tag>;
};

export default PriorityTag;
