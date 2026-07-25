import React from 'react';
import { Typography } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import { formatShortDate, formatTime } from '../../utils/format';

interface Props {
  start: string;
  end: string;
}

const TimeRangeBadge: React.FC<Props> = ({ start, end }) => (
  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
    <ClockCircleOutlined style={{ marginRight: 4 }} />
    {formatShortDate(start)} {formatTime(start)} ~ {formatShortDate(end)} {formatTime(end)}
  </Typography.Text>
);

export default TimeRangeBadge;
