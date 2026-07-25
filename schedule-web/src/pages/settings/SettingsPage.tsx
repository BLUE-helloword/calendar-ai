import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, message } from 'antd';
import { useAuthStore } from '../../stores/useAuthStore';

const SettingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      // Mock: no API currently, just show success
      await new Promise(r => setTimeout(r, 500));
      message.success('个人设置已保存');
    } finally { setSavingProfile(false); }
  };

  const handleChangePassword = async (values: Record<string, string>) => {
    setSavingPassword(true);
    try {
      await new Promise(r => setTimeout(r, 500));
      message.success('密码已修改');
      passwordForm.resetFields();
    } finally { setSavingPassword(false); }
  };

  return (
    <div>
      <Typography.Title level={4}>个人设置</Typography.Title>

      <Card title="基本信息" style={{ marginBottom: 16 }}>
        <Form form={profileForm} layout="vertical" initialValues={{ username: user?.username || '', nickname: user?.nickname || '' }}
              style={{ maxWidth: 400 }}>
          <Form.Item name="username" label="用户名">
            <Input disabled />
          </Form.Item>
          <Form.Item name="nickname" label="昵称">
            <Input />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={handleSaveProfile} loading={savingProfile}>保存</Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="修改密码" style={{ marginBottom: 16 }}>
        <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword} style={{ maxWidth: 400 }}>
          <Form.Item name="oldPassword" label="旧密码" rules={[{ required: true, message: '请输入旧密码' }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="newPassword" label="新密码" rules={[
            { required: true, message: '请输入新密码' },
            { min: 6, message: '密码至少6位' },
          ]}>
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认密码"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请再次输入新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={savingPassword}>修改密码</Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="关于">
        <Typography.Text>AI Agent 日程与任务协同助手</Typography.Text><br />
        <Typography.Text type="secondary">版本 V1.0</Typography.Text><br />
        <Typography.Text type="secondary">2026届校招生培训 Mini AI 项目</Typography.Text>
      </Card>
    </div>
  );
};

export default SettingsPage;
