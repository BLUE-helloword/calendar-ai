import React, { useState } from 'react';
import { Input, Button } from 'antd';
import { SendOutlined } from '@ant-design/icons';

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const ChatInput: React.FC<Props> = ({ onSend, disabled, placeholder = '输入你的回答...' }) => {
  const [value, setValue] = useState('');

  const handleSend = () => {
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue('');
  };

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <Input.TextArea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoSize={{ minRows: 1, maxRows: 4 }}
        onPressEnter={(e) => { if (!e.shiftKey) { e.preventDefault(); handleSend(); } }}
      />
      <Button type="primary" icon={<SendOutlined />} onClick={handleSend} disabled={disabled || !value.trim()}>
        发送
      </Button>
    </div>
  );
};

export default ChatInput;
