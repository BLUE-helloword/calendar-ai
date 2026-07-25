import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';

interface LoginForm {
  username: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const [form] = Form.useForm<LoginForm>();
  const [loading, setLoading] = useState(false);
  const loginAction = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const onFinish = async (values: LoginForm) => {
    setLoading(true);
    try {
      await loginAction(values.username, values.password);
      navigate('/dashboard', { replace: true });
    } catch {
      // error handled by request interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Card className="login-card" bordered={false}>
        <Typography.Title level={3} style={{ marginBottom: 4 }}>AI 日程协同助手</Typography.Title>
        <Typography.Text type="secondary">智能规划你的每一天</Typography.Text>
        <Form form={form} onFinish={onFinish} autoComplete="off" style={{ marginTop: 32, textAlign: 'left' }}>
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" size="large" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              登 录
            </Button>
          </Form.Item>
        </Form>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>没有账号？联系管理员</Typography.Text>
      </Card>
    </div>
  );
};

export default LoginPage;
