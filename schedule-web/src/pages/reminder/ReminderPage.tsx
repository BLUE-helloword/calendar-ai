import React, { useState, useEffect } from 'react';
import { Card, List, Button, Space, Form, Select, Checkbox, Modal, Input, DatePicker, Typography, message } from 'antd';
import { BellOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { reminderApi } from '../../api/reminder';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import ConfirmModal from '../../components/common/ConfirmModal';
import { REMINDER_CHANNEL_MAP } from '../../utils/constants';
import { formatDate } from '../../utils/format';
import type { Reminder, ReminderUpdateDTO } from '../../types/reminder';

const ReminderPage: React.FC = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [editForm] = Form.useForm();

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const res = await reminderApi.list();
      setReminders(res || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchReminders(); }, []);

  const handleEdit = (r: Reminder) => {
    setEditingReminder(r);
    editForm.setFieldsValue({
      remindTime: dayjs(r.remindTime),
      remindType: r.remindType,
      channel: r.channel,
      message: r.message,
    });
    setEditModalOpen(true);
  };

  const handleSave = async () => {
    const values = await editForm.validateFields();
    if (!editingReminder) return;
    const dto: ReminderUpdateDTO = {
      remindTime: values.remindTime?.format('YYYY-MM-DD HH:mm:ss'),
      remindType: values.remindType,
      channel: values.channel,
      message: values.message,
    };
    setSaving(true);
    try {
      await reminderApi.update(editingReminder.id, dto);
      message.success('提醒已更新');
      setEditModalOpen(false);
      fetchReminders();
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await reminderApi.remove(deleteId);
      message.success('提醒已删除');
      fetchReminders();
    } finally { setDeleteId(null); }
  };

  if (loading) return <LoadingSkeleton rows={6} />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>提醒设置</Typography.Title>
      </div>

      <Card title="提醒列表">
        {reminders.length === 0 ? (
          <EmptyState description="暂无提醒设置" />
        ) : (
          <List
            dataSource={reminders}
            renderItem={(r) => (
              <List.Item
                actions={[
                  <Button type="link" key="edit" onClick={() => handleEdit(r)}>编辑</Button>,
                  <Button type="link" danger key="del" onClick={() => setDeleteId(r.id)}>删除</Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={<BellOutlined style={{ fontSize: 20, color: '#1677ff' }} />}
                  title={<span style={{ fontSize: 14, fontWeight: 500 }}>{r.message || '提醒'}</span>}
                  description={
                    <Space size="middle">
                      <span><ClockCircleOutlined /> {formatDate(r.remindTime)}</span>
                      <span>渠道：{REMINDER_CHANNEL_MAP[r.channel] || r.channel}</span>
                      <span>类型：{r.remindType}</span>
                      <span>状态：{r.status}</span>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      <Modal title="编辑提醒" open={editModalOpen} onOk={handleSave} onCancel={() => setEditModalOpen(false)}
             confirmLoading={saving} destroyOnClose>
        <Form form={editForm} layout="vertical">
          <Form.Item name="remindTime" label="提醒时间" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="remindType" label="提醒类型">
            <Select options={[
              { value: 'ONCE', label: '单次提醒' },
              { value: 'REPEAT_DAILY', label: '每日重复' },
              { value: 'REPEAT_WEEKLY', label: '每周重复' },
            ]} />
          </Form.Item>
          <Form.Item name="channel" label="通知渠道">
            <Select options={[
              { value: 'IN_APP', label: '站内信' },
              { value: 'EMAIL', label: '邮箱' },
            ]} />
          </Form.Item>
          <Form.Item name="message" label="提醒文案">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <ConfirmModal open={!!deleteId} title="确定删除此提醒？" danger
        onOk={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
};

export default ReminderPage;
