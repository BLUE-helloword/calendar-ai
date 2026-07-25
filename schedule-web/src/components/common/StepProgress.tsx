import React from 'react';
import { Steps } from 'antd';

interface Props {
  current: number;
  steps: string[];
}

const StepProgress: React.FC<Props> = ({ current, steps }) => (
  <Steps current={current} size="small" style={{ marginBottom: 24 }}
    items={steps.map((s) => ({ title: s }))}
  />
);

export default StepProgress;
