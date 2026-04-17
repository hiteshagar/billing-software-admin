import React, { useState } from 'react';
import { Layout, Menu, Avatar, Typography, Button, Popconfirm, theme } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  TeamOutlined,
  BarcodeOutlined,
  CarOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ShopOutlined,
  IdcardOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../store/auth';

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

const NAV_ITEMS = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/invoices', icon: <FileTextOutlined />, label: 'Invoices' },
  { key: '/customers', icon: <TeamOutlined />, label: 'Customers' },
  { key: '/skus', icon: <BarcodeOutlined />, label: 'SKU Codes' },
  { key: '/transport-providers', icon: <CarOutlined />, label: 'Transport Providers' },
  { key: '/employees', icon: <IdcardOutlined />, label: 'Employees' },
  { key: '/settings', icon: <SettingOutlined />, label: 'Settings' },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { token: designToken } = theme.useToken();

  const selectedKey = '/' + location.pathname.split('/')[1];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        trigger={null}
        width={220}
        style={{
          background: designToken.colorBgContainer,
          borderRight: `1px solid ${designToken.colorBorderSecondary}`,
          position: 'fixed',
          height: '100vh',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
      >
        {/* Logo */}
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? 0 : '0 16px',
            borderBottom: `1px solid ${designToken.colorBorderSecondary}`,
            gap: 10,
          }}
        >
          <ShopOutlined style={{ fontSize: 22, color: designToken.colorPrimary }} />
          {!collapsed && (
            <Text strong style={{ fontSize: 16, color: designToken.colorPrimary, whiteSpace: 'nowrap' }}>
              BillAdmin
            </Text>
          )}
        </div>

        {/* Nav Menu */}
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={NAV_ITEMS}
          onClick={handleMenuClick}
          style={{ border: 'none', marginTop: 8 }}
        />

        {/* Logout at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            width: '100%',
            padding: '12px 16px',
            borderTop: `1px solid ${designToken.colorBorderSecondary}`,
            background: designToken.colorBgContainer,
          }}
        >
          <Popconfirm
            title="Logout"
            description="Are you sure you want to logout?"
            onConfirm={handleLogout}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="text"
              icon={<LogoutOutlined />}
              danger
              style={{ width: '100%', textAlign: 'left' }}
            >
              {!collapsed && 'Logout'}
            </Button>
          </Popconfirm>
        </div>
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 220, transition: 'margin 0.2s' }}>
        <Header
          style={{
            padding: '0 16px',
            background: designToken.colorBgContainer,
            borderBottom: `1px solid ${designToken.colorBorderSecondary}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 99,
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 16 }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar style={{ backgroundColor: designToken.colorPrimary }}>A</Avatar>
            <Text>Admin</Text>
          </div>
        </Header>

        <Content className="site-layout-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
