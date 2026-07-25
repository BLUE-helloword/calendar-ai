import React from 'react';
import { Layout, Breadcrumb, Dropdown, Avatar } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import { useLocation, useNavigate, matchPath } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import type { MenuProps } from 'antd';

const { Header } = Layout;

const pageTitles: Record<string, string> = {
  '/dashboard': '首页总览',
  '/goals/new': '新建目标',
  '/goals': '目标管理',
  '/tasks': '任务列表',
  '/report': '周报统计',
  '/reminders': '提醒设置',
  '/settings': '个人设置',
};

const HeaderBar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const currentTitle = Object.entries(pageTitles).find(([path]) =>
    location.pathname.startsWith(path)
  )?.[1] || '';

  const userMenuItems: MenuProps['items'] = [
    { key: 'settings', icon: <SettingOutlined />, label: '个人设置' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
  ];

  const handleUserMenu: MenuProps['onClick'] = ({ key }) => {
    if (key === 'settings') navigate('/settings');
    else if (key === 'logout') logout();
  };

  return (
    <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <Breadcrumb items={[{ title: '首页' }, { title: currentTitle }]} />
      <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenu }}>
        <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar size="small" icon={<UserOutlined />} />
          <span>{user?.nickname || user?.username || '用户'}</span>
        </div>
      </Dropdown>
    </Header>
  );
};

export default HeaderBar;
