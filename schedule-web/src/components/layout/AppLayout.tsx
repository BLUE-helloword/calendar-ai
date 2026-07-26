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
        <Content style={{
          margin: isWorkbench ? 0 : 24,
          background: '#fff',
          borderRadius: isWorkbench ? 0 : 8,
          padding: isWorkbench ? 0 : 24,
          height: isWorkbench ? 'calc(100vh - 64px)' : 'calc(100vh - 64px)',
          overflow: isWorkbench ? 'hidden' : 'auto',
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
