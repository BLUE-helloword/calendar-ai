import React from 'react';
import { Input, Button } from 'antd';
import { AudioOutlined, AudioMutedOutlined } from '@ant-design/icons';
import useSpeechRecognition from '../../hooks/useSpeechRecognition';

interface VoiceInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ value, onChange, placeholder, disabled }) => {
  const { isSupported, isListening, transcript, error, start, stop } = useSpeechRecognition();

  const handleVoiceToggle = () => {
    if (isListening) {
      stop();
      if (transcript) {
        onChange(value ? `${value} ${transcript}` : transcript);
      }
    } else {
      start();
    }
  };

  React.useEffect(() => {
    if (error) {
      console.error(error);
    }
  }, [error]);

  return (
    <div style={{ position: 'relative' }}>
      <Input.TextArea
        value={isListening ? (value ? `${value} ${transcript}` : transcript) : value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || '描述你想安排的事项...'}
        autoSize={{ minRows: 2, maxRows: 6 }}
        disabled={disabled}
        style={{ paddingRight: 80 }}
        onPressEnter={(e) => {
          // Let parent handle Enter key
        }}
      />
      {isSupported && (
        <Button
          type={isListening ? 'primary' : 'default'}
          danger={isListening}
          icon={isListening ? <AudioMutedOutlined /> : <AudioOutlined />}
          onClick={handleVoiceToggle}
          disabled={disabled}
          style={{
            position: 'absolute',
            right: 8,
            bottom: 8,
            borderRadius: 20,
          }}
        >
          {isListening ? '点击停止' : '语音输入'}
        </Button>
      )}
    </div>
  );
};

export default VoiceInput;
