import React from 'react';
import { Modal } from 'antd';

interface Props {
  open: boolean;
  title: string;
  content?: string;
  danger?: boolean;
  onOk: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const ConfirmModal: React.FC<Props> = ({ open, title, content, danger, onOk, onCancel, loading }) => (
  <Modal
    open={open}
    title={title}
    onOk={onOk}
    onCancel={onCancel}
    confirmLoading={loading}
    okButtonProps={{ danger }}
    destroyOnClose
  >
    {content}
  </Modal>
);

export default ConfirmModal;
