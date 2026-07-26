import React, { useState, useRef, useEffect } from 'react';
import { Button, Typography, Space, Empty } from 'antd';
import { ClearOutlined, CheckOutlined, SendOutlined } from '@ant-design/icons';
import ChatBubble from '../../components/chat/ChatBubble';
import VoiceInput from '../../components/common/VoiceInput';
import { useAppStore } from '../../stores/useAppStore';

const ChatPanel: React.FC = () => {
  const messages = useAppStore((s) => s.messages);
  const isProcessing = useAppStore((s) => s.isProcessing);
  const previewSchedules = useAppStore((s) => s.previewSchedules);
  const currentSessionId = useAppStore((s) => s.currentSessionId);
  const sendMessage = useAppStore((s) => s.sendMessage);
  const confirmSchedules = useAppStore((s) => s.confirmSchedules);
  const clearSession = useAppStore((s) => s.clearSession);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text || isProcessing) return;
    sendMessage(text);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <Typography.Text strong style={{ fontSize: 16 }}>AI 助手</Typography.Text>
        {currentSessionId && (
          <Button size="small" icon={<ClearOutlined />} onClick={clearSession}>
            新对话
          </Button>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {messages.length === 0 && (
          <Empty
            description="输入你的日程安排需求，AI 将帮你智能规划"
            style={{ marginTop: 60 }}
          />
        )}
        {messages.map((msg, i) => (
          <ChatBubble
            key={i}
            role={msg.role}
            content={msg.content}
            questions={msg.questions}
            type={msg.type}
            schedule={msg.schedule}
            conflicts={msg.conflicts}
            taskCreated={msg.taskCreated}
          />
        ))}
        {isProcessing && (
          <ChatBubble role="agent" content="思考中..." />
        )}
        <div ref={bottomRef} />
      </div>

      {/* Confirm button */}
      {previewSchedules.length > 0 && (
        <div style={{ padding: '8px 16px', borderTop: '1px solid #f0f0f0' }}>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            block
            onClick={confirmSchedules}
            loading={isProcessing}
          >
            确认排期（创建 {previewSchedules.length} 个任务）
          </Button>
        </div>
      )}

      {/* Input area */}
      <div style={{ padding: '8px 16px 12px', borderTop: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <VoiceInput
              value={inputValue}
              onChange={setInputValue}
              placeholder="描述你想安排的事项..."
              disabled={isProcessing}
            />
          </div>
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            disabled={isProcessing || !inputValue.trim()}
          >
            发送
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
