import React, { useState, useEffect, useRef } from 'react';
import { Card, Progress, Descriptions, Typography, message } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import ChatBubble from '../../components/chat/ChatBubble';
import ChatInput from '../../components/chat/ChatInput';
import StepProgress from '../../components/common/StepProgress';
import { goalApi } from '../../api/goal';
import { MAX_CLARIFY_ROUNDS } from '../../utils/constants';

interface Message {
  role: 'user' | 'agent';
  content: string;
  questions?: string[];
}

const GoalClarifyPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const goalId = Number(id);
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [parsedTarget, setParsedTarget] = useState('');
  const [parsedDeadline, setParsedDeadline] = useState('');
  const [loading, setLoading] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const data = await goalApi.getResult(goalId);
        setCurrentRound(data.currentRound);
        setParsedTarget(data.parsedTarget || '');
        setParsedDeadline(data.parsedDeadline || '');

        if (!data.needsClarification) {
          message.success('信息已完整，即将进入确认页');
          setTimeout(() => navigate(`/goals/${goalId}/confirm`, { replace: true }), 500);
          return;
        }

        // 重建对话
        const msgs: Message[] = [];
        // 添加用户初始输入
        msgs.push({ role: 'user', content: '(原始目标输入)' });
        if (data.questions && data.questions.length > 0) {
          msgs.push({ role: 'agent', content: '请补充以下信息：', questions: data.questions });
        }
        setMessages(msgs);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [goalId, navigate]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (reply: string) => {
    if (!reply.trim() || sending) return;
    setSending(true);

    setMessages(prev => [...prev, { role: 'user', content: reply }]);

    try {
      const data = await goalApi.reply(goalId, { reply });

      setCurrentRound(data.currentRound);
      setParsedTarget(data.parsedTarget || parsedTarget);
      setParsedDeadline(data.parsedDeadline || parsedDeadline);

      if (!data.needsClarification) {
        message.success('信息已完整，即将进入确认页');
        setTimeout(() => navigate(`/goals/${goalId}/confirm`, { replace: true }), 500);
        return;
      }

      setMessages(prev => [...prev, {
        role: 'agent',
        content: '请继续补充信息：',
        questions: data.questions || [],
      }]);

      if (data.currentRound >= MAX_CLARIFY_ROUNDS) {
        message.warning('已达到最大追问轮次，将以当前信息生成排期');
        setTimeout(() => navigate(`/goals/${goalId}/confirm`, { replace: true }), 1000);
      }
    } catch {
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <Card><Typography.Text>加载中...</Typography.Text></Card>;
  }

  return (
    <div>
      <StepProgress current={1} steps={['输入目标', '确认解析', '查看排期']} />

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <Card title="对话">
            <div className="chat-container">
              {messages.map((msg, i) => (
                <ChatBubble key={i} role={msg.role} content={msg.content} questions={msg.questions} />
              ))}
              <div ref={chatEndRef} />
            </div>
            <ChatInput onSend={handleSend} disabled={sending} />
          </Card>
        </div>
        <div style={{ width: 260 }}>
          <Card title="已识别信息" size="small">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="目标">{parsedTarget || '(待补充)'}</Descriptions.Item>
              <Descriptions.Item label="截止">{parsedDeadline || '(待补充)'}</Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 16 }}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>追问进度</Typography.Text>
              <Progress percent={Math.round((currentRound / MAX_CLARIFY_ROUNDS) * 100)} size="small"
                        format={() => `${currentRound}/${MAX_CLARIFY_ROUNDS}`} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GoalClarifyPage;
