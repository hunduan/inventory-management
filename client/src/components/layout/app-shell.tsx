import { View, Text } from '@tarojs/components';
import { PropsWithChildren, useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import './app-shell.less';

const NAV_ITEMS = [
  { label: '首页', path: '/pages/web/dashboard/index', char: '首页' },
  { label: '商品', path: '/pages/web/products/index', char: '品' },
  { label: '采购', path: '/pages/web/purchases/index', char: '进' },
  { label: '销售', path: '/pages/web/sales/index', char: '销' },
  { label: '库存', path: '/pages/web/inventory/index', char: '存' },
  { label: '供应商', path: '/pages/web/suppliers/index', char: '供' },
  { label: '客户', path: '/pages/web/customers/index', char: '客' },
  { label: '仓库', path: '/pages/web/warehouses/index', char: '仓' },
  { label: '盘点', path: '/pages/web/stocktake/index', char: '盘' },
  { label: '调拨', path: '/pages/web/transfers/index', char: '调' },
  { label: '报表', path: '/pages/web/reports/index', char: '表' },
  { label: '设置', path: '/pages/web/settings/index', char: '设' },
  { label: '用户', path: '/pages/web/users/index', char: '员' },
  { label: '角色', path: '/pages/web/roles/index', char: '权' },
  { label: '租户', path: '/pages/web/tenants/index', char: '租' },
];

export default function AppShell({ children }: PropsWithChildren) {
  const [currentPath, setCurrentPath] = useState('');
  const [collapsed, setCollapsed] = useState(true);

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
                <Text className="nav-char">{item.char}</Text>
                {!collapsed && <Text className="nav-label">{item.label}</Text>}
              </View>
            );
          })}
        </View>

        <View className="sidebar-footer">
          {!collapsed && <Text className="version">v1.0</Text>}
        </View>
      </View>

      {/* Main area */}
      <View className="main-area">
        <View className="topbar">
          <View className="topbar-left" />
          <View className="topbar-right">
            <Text className="user-chip">A</Text>
          </View>
        </View>

        <View className="main-content">{children}</View>
      </View>
    </View>
  );
}
