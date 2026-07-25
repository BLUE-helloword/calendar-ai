import React from 'react';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';

interface Props {
  role: 'user' | 'agent';
  content: string;
  questions?: string[];
}

const ChatBubble: React.FC<Props> = ({ role, content, questions }) => (
  <div className={`chat-bubble chat-bubble--${role}`}>
    <div className="chat-bubble__avatar">
      {role === 'user' ? <UserOutlined /> : <RobotOutlined />}
    </div>
    <div className="chat-bubble__body">
      <div className="chat-bubble__text">{content}</div>
      {questions && questions.length > 0 && (
        <ul className="chat-bubble__questions">
          {questions.map((q, i) => <li key={i}>{q}</li>)}
        </ul>
      )}
    </div>
  </div>
);

export default ChatBubble;
