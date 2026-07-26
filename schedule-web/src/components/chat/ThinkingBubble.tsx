import React from 'react';
import { RobotOutlined } from '@ant-design/icons';
import './ThinkingBubble.css';

const ThinkingBubble: React.FC = () => (
  <div className="chat-bubble chat-bubble--agent" style={{ marginBottom: 16 }}>
    <div className="chat-bubble__avatar">
      <RobotOutlined />
    </div>
    <div className="chat-bubble__body" style={{ padding: '12px 16px' }}>
      <div className="thinking-dots">
        <span className="thinking-text">思考中</span>
        <span className="dot">.</span>
        <span className="dot">.</span>
        <span className="dot">.</span>
      </div>
      <div className="thinking-subtitle">AI 正在分析你的需求并生成排期方案</div>
    </div>
  </div>
);

export default ThinkingBubble;
