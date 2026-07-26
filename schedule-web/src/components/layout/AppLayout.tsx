import React from 'react';
import { Layout } from 'antd';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import HeaderBar from './HeaderBar';

const { Content } = Layout;

const AppLayout: React.FC = () => {
  const location = useLocation();
  const isWorkbench = location.pathname === '/';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar />
      <Layout style={{ marginLeft: 220 }}>
        <HeaderBar />
        <Content style={isWorkbench ? {
          background: '#fff',
          height: 'calc(100vh - 64px)',
          overflow: 'hidden',
        } : {
          margin: 24,
          background: '#fff',
          borderRadius: 8,
          padding: 24,
          minHeight: 'calc(100vh - 104px)',
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
