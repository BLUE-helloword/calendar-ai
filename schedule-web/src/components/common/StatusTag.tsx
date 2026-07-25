import React from 'react';
import { Tag } from 'antd';
import { STATUS_MAP } from '../../utils/constants';

interface Props {
  status: string;
}

const StatusTag: React.FC<Props> = ({ status }) => {
  const cfg = STATUS_MAP[status] || { label: status, color: '#999' };
  return <Tag color={cfg.color}>{cfg.label}</Tag>;
};

export default StatusTag;
