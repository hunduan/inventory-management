import { View, Text } from '@tarojs/components';
import { PropsWithChildren, useState, useEffect } from 'react';
import Taro from '@tarojs/taro';

interface NavItem {
  label: string;
  icon: string;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: '首页', icon: '◈', path: '/pages/web/dashboard/index' },
  { label: '商品', icon: '⊞', path: '/pages/web/products/index' },
  { label: '采购', icon: '⇩', path: '/pages/web/purchases/index' },
  { label: '销售', icon: '⇧', path: '/pages/web/sales/index' },
  { label: '库存', icon: '☰', path: '/pages/web/inventory/index' },
  { label: '报表', icon: '◉', path: '/pages/web/reports/index' },
  { label: '设置', icon: '⚙', path: '/pages/web/settings/index' },
];

export default function AppShell({ children }: PropsWithChildren) {
  const [currentPath, setCurrentPath] = useState('');

  useEffect(() => {
    try {
      const instance = Taro.getCurrentInstance();
      setCurrentPath(instance.router?.path || '');
    } catch {
      // ignore
    }
  }, []);

  const handleNavigate = (path: string) => {
    Taro.navigateTo({ url: path });
  };

  const isActive = (itemPath: string) => {
    return currentPath.startsWith(itemPath);
  };

  return (
    <View className="min-h-screen" style={{ backgroundColor: '#f8f7f4' }}>
      {/* Header */}
      <View className="sticky top-0 z-50" style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e7e5e4' }}>
        <View className="max-w-7xl mx-auto px-6">
          {/* Top bar */}
          <View className="flex items-center justify-between h-16">
            <View className="flex items-center gap-3">
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #0f766e, #14b8a6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: 'white', fontSize: 16, fontWeight: 700, lineHeight: 1 }}>进</Text>
              </View>
              <View>
                <Text className="text-lg font-bold" style={{ color: '#292524', letterSpacing: '-0.02em' }}>
                  进销存管理
                </Text>
                <Text style={{ fontSize: 11, color: '#a8a29e', marginTop: -2 }}>Inventory Management</Text>
              </View>
            </View>

            {/* User indicator */}
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 9999,
                background: '#f0fdfa',
                border: '2px solid #ccfbf1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 14, color: '#0f766e', fontWeight: 600 }}>A</Text>
            </View>
          </View>

          {/* Navigation */}
          <View className="flex items-center gap-1" style={{ paddingBottom: 0 }}>
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.path);
              return (
                <View
                  key={item.path}
                  className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  style={{
                    padding: '10px 16px',
                    borderBottom: active ? '2px solid #0f766e' : '2px solid transparent',
                    transition: 'all 0.2s ease',
                    marginBottom: -1,
                    opacity: active ? 1 : 0.6,
                  }}
                  onClick={() => handleNavigate(item.path)}
                  onMouseEnter={(e: any) => {
                    if (!active) e.currentTarget.style.opacity = '0.85';
                  }}
                  onMouseLeave={(e: any) => {
                    if (!active) e.currentTarget.style.opacity = '0.6';
                  }}
                >
                  <Text style={{ fontSize: 14, color: active ? '#0f766e' : '#78716c' }}>
                    {item.icon}
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: active ? 600 : 400,
                      color: active ? '#0f766e' : '#57534e',
                    }}
                  >
                    {item.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Content */}
      <View className="max-w-7xl mx-auto px-6 py-6 page-enter">
        {children}
      </View>
    </View>
  );
}
