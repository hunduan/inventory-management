import { useState, useMemo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Typography, theme } from 'antd';
import type { MenuProps } from 'antd';
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
  TeamOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  RollbackOutlined,
  BarChartOutlined,
  SettingOutlined,
  UserOutlined,
  SafetyOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../store/auth';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

interface MenuItem {
  key: string;
  icon?: React.ReactNode;
  label: string;
  permissions?: string[];
  children?: MenuItem[];
}

const allMenuItems: MenuItem[] = [
  { key: '/', icon: <DashboardOutlined />, label: 'Dashboard', permissions: [] },
  { key: '/products', icon: <AppstoreOutlined />, label: '商品管理', permissions: ['products:read'] },
  { key: '/categories', icon: <AuditOutlined />, label: '商品分类', permissions: ['products:read'] },
  { key: '/purchases', icon: <ShoppingCartOutlined />, label: '采购管理', permissions: ['purchases:read'] },
  { key: '/sales', icon: <ShopOutlined />, label: '销售管理', permissions: ['sales:read'] },
  { key: '/inventory', icon: <FileTextOutlined />, label: '库存管理', permissions: ['inventory:read'] },
  { key: '/warehouses', icon: <HomeOutlined />, label: '仓库管理', permissions: ['warehouses:read'] },
  { key: '/stocktakes', icon: <AuditOutlined />, label: '盘点管理', permissions: ['stocktakes:read'] },
  { key: '/transfers', icon: <RollbackOutlined />, label: '调拨管理', permissions: ['transfers:read'] },
  { key: '/reports', icon: <BarChartOutlined />, label: '报表', permissions: ['reports:read'] },
  {
    key: 'system',
    icon: <SettingOutlined />,
    label: '系统设置',
    permissions: [],
    children: [
      { key: '/tenants', icon: <ShopOutlined />, label: '租户', permissions: ['tenants:read'] },
      { key: '/users', icon: <TeamOutlined />, label: '用户', permissions: ['users:read'] },
      { key: '/roles', icon: <SafetyOutlined />, label: '角色', permissions: ['roles:read'] },
    ],
  },
];

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/products': '商品管理',
  '/categories': '商品分类',
  '/suppliers': '供应商管理',
  '/customers': '客户管理',
  '/purchases': '采购管理',
  '/sales': '销售管理',
  '/inventory': '库存管理',
  '/warehouses': '仓库管理',
  '/stocktakes': '盘点管理',
  '/transfers': '调拨管理',
  '/reports': '报表',
  '/tenants': '租户设置',
  '/users': '用户管理',
  '/roles': '角色管理',
};

function findPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  const base = '/' + pathname.split('/')[1];
  return PAGE_TITLES[base] || '页面';
}

function findSelectedKeys(pathname: string): string[] {
  const base = '/' + pathname.split('/')[1];
  if (pathname.startsWith('/products')) return ['/products'];
  if (pathname.startsWith('/categories')) return ['/categories'];
  if (pathname.startsWith('/suppliers')) return ['/suppliers'];
  if (pathname.startsWith('/customers')) return ['/customers'];
  if (pathname.startsWith('/purchases')) return ['/purchases'];
  if (pathname.startsWith('/sales')) return ['/sales'];
  if (pathname.startsWith('/inventory')) return ['/inventory'];
  if (pathname.startsWith('/warehouses')) return ['/warehouses'];
  if (pathname.startsWith('/stocktakes')) return ['/stocktakes'];
  if (pathname.startsWith('/transfers')) return ['/transfers'];
  if (pathname.startsWith('/reports')) return ['/reports'];
  if (pathname.startsWith('/tenants')) return ['/tenants'];
  if (pathname.startsWith('/users')) return ['/users'];
  if (pathname.startsWith('/roles')) return ['/roles'];
  return [pathname === '/' ? '/' : base];
}

function hasPermission(userPermissions: string[], required: string[]): boolean {
  if (!required || required.length === 0) return true;
  return required.some((p) => userPermissions.includes(p));
}

function filterMenu(items: MenuItem[], userPermissions: string[], isSuperAdmin: boolean): MenuItem[] {
  return items
    .filter((item) => isSuperAdmin || hasPermission(userPermissions, item.permissions || []))
    .map((item) => ({
      ...item,
      children: item.children ? filterMenu(item.children, userPermissions, isSuperAdmin) : undefined,
    }))
    .filter((item) => !item.children || item.children.length > 0);
}

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isSuperAdmin, logout } = useAuthStore();
  const { token: themeToken } = theme.useToken();

  const userPermissions = user?.permissions || [];
  const menuItems = useMemo(() => filterMenu(allMenuItems, userPermissions, isSuperAdmin), [userPermissions, isSuperAdmin]);

  const selectedKeys = useMemo(() => findSelectedKeys(location.pathname), [location.pathname]);
  const pageTitle = useMemo(() => findPageTitle(location.pathname), [location.pathname]);

  const handleMenuClick: MenuProps['onClick'] = (info) => {
    navigate(info.key);
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: user?.name || '用户',
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ];

  const handleUserMenuClick: MenuProps['onClick'] = (info) => {
    if (info.key === 'logout') {
      logout();
      window.location.href = '/login';
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        breakpoint="lg"
        collapsedWidth={64}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          background: themeToken.colorBgContainer,
          borderRight: `1px solid ${themeToken.colorBorderSecondary}`,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: `1px solid ${themeToken.colorBorderSecondary}`,
          }}
        >
          <Text strong style={{ fontSize: collapsed ? 16 : 18, color: themeToken.colorPrimary }}>
            {collapsed ? '进' : '进销存'}
          </Text>
        </div>
        <Menu
          mode="inline"
          selectedKeys={selectedKeys}
          defaultOpenKeys={['system']}
          items={menuItems as MenuProps['items']}
          onClick={handleMenuClick}
          style={{ borderInlineEnd: 'none' }}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 64 : 200, transition: 'margin-left 0.2s' }}>
        <Header
          style={{
            padding: '0 24px',
            background: themeToken.colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${themeToken.colorBorderSecondary}`,
            height: 64,
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span
              onClick={() => setCollapsed(!collapsed)}
              style={{ cursor: 'pointer', fontSize: 18 }}
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </span>
            <Text strong style={{ fontSize: 18 }}>{pageTitle}</Text>
          </div>
          <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} style={{ backgroundColor: themeToken.colorPrimary }} />
              <Text>{user?.name || '用户'}</Text>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: 24, minHeight: 'calc(100vh - 64 - 48)' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
