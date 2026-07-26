import React from 'react';
import { Layout, Menu } from 'antd';
import {
  HomeOutlined, UnorderedListOutlined,
  BarChartOutlined, SettingOutlined, LogoutOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import type { MenuProps } from 'antd';

const { Sider } = Layout;

const menuItems: MenuProps['items'] = [
  { key: '/', icon: <HomeOutlined />, label: '工作台' },
  { key: '/tasks', icon: <UnorderedListOutlined />, label: '任务列表' },
  { key: '/report', icon: <BarChartOutlined />, label: '周报统计' },
  { key: '/settings', icon: <SettingOutlined />, label: '个人设置' },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  const selectedKey = menuItems.find(
    (item) => item && 'key' in item && (
      item.key === '/' ? location.pathname === '/' : location.pathname.startsWith(item.key as string)
    )
  )?.key as string || '/';

  return (
    <Sider width={220} theme="dark" style={{ position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100 }}>
      <div className="sidebar-logo">AI 日程助手</div>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 64px)' }}>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ flex: 1 }}
        />
        <Menu
          theme="dark"
          mode="inline"
          selectable={false}
          items={[{ key: 'logout', icon: <LogoutOutlined />, label: '退出登录' }]}
          onClick={({ key }) => { if (key === 'logout') logout(); }}
        />
      </div>
    </Sider>
  );
};

export default Sidebar;
