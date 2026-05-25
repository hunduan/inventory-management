import { View, Text } from '@tarojs/components';
import { PropsWithChildren, useState, useEffect } from 'react';
import Taro from '@tarojs/taro';

const NAV_ITEMS = [
  { label: '首页', path: '/pages/web/dashboard/index', icon: '🏠' },
  { label: '商品', path: '/pages/web/products/index', icon: '📦' },
  { label: '采购', path: '/pages/web/purchases/index', icon: '🧾' },
  { label: '销售', path: '/pages/web/sales/index', icon: '💰' },
  { label: '库存', path: '/pages/web/inventory/index', icon: '📊' },
  { label: '报表', path: '/pages/web/reports/index', icon: '📈' },
  { label: '设置', path: '/pages/web/settings/index', icon: '⚙️' },
];

export default function AppShell({ children }: PropsWithChildren) {
  const [currentPath, setCurrentPath] = useState('');
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const instance = Taro.getCurrentInstance();
      setCurrentPath(instance.router?.path || '');
    } catch { /* ignore */ }
  }, []);

  const isActive = (path: string) => currentPath.startsWith(path);

  return (
    <View className="layout page-enter">
      {/* Sidebar */}
      <View className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <View className="sidebar-header">
          <View className="logo">进</View>
          {!collapsed && <Text className="logo-title">进销存</Text>}
          <View className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
            <Text>{collapsed ? '›' : '‹'}</Text>
          </View>
        </View>

        <View className="nav-list">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path);
            return (
              <View
                key={item.path}
                className={`nav-item ${active ? 'active' : ''}`}
                onClick={() => Taro.navigateTo({ url: item.path })}
              >
                <Text className="nav-icon">{item.icon}</Text>
                {!collapsed && <Text className="nav-label">{item.label}</Text>}
              </View>
            );
          })}
        </View>

        <View className="sidebar-footer">
          <Text className="version">v1.0</Text>
        </View>
      </View>

      {/* Main area */}
      <View className="main-area">
        <View className="topbar">
          <View className="topbar-left">
            <Text className="page-title">{/* title injected by pages */}</Text>
          </View>
          <View className="topbar-right">
            <Text className="user-chip">A</Text>
          </View>
        </View>

        <View className="main-content">{children}</View>
      </View>
    </View>
  );
}
