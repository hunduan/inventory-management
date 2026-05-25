import { View, Text } from '@tarojs/components';
import { PropsWithChildren, useState, useEffect } from 'react';
import Taro from '@tarojs/taro';

const NAV_ITEMS = [
  { label: '首页', path: '/pages/web/dashboard/index' },
  { label: '商品', path: '/pages/web/products/index' },
  { label: '采购', path: '/pages/web/purchases/index' },
  { label: '销售', path: '/pages/web/sales/index' },
  { label: '库存', path: '/pages/web/inventory/index' },
  { label: '报表', path: '/pages/web/reports/index' },
  { label: '设置', path: '/pages/web/settings/index' },
];

export default function AppShell({ children }: PropsWithChildren) {
  const [currentPath, setCurrentPath] = useState('');

  useEffect(() => {
    try {
      const instance = Taro.getCurrentInstance();
      setCurrentPath(instance.router?.path || '');
    } catch { /* ignore */ }
  }, []);

  const isActive = (path: string) => currentPath.startsWith(path);

  return (
    <View className="min-h-screen" style={{ backgroundColor: '#f5f5f4' }}>
      {/* Header */}
      <View className="sticky top-0 z-50" style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e7e5e4' }}>
        <View className="max-w-7xl mx-auto px-6">
          <View className="flex items-center justify-between h-14">
            <View className="flex items-center gap-2">
              <View
                style={{
                  width: 28, height: 28, borderRadius: 6,
                  background: '#0f766e', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Text style={{ color: 'white', fontSize: 14, fontWeight: 700 }}>进</Text>
              </View>
              <Text className="font-bold" style={{ fontSize: 16, color: '#1c1917' }}>进销存管理</Text>
            </View>
            <View
              style={{
                width: 28, height: 28, borderRadius: '50%',
                backgroundColor: '#f0fdfa', border: '1.5px solid #ccfbf1',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 12, color: '#0f766e', fontWeight: 600 }}>A</Text>
            </View>
          </View>

          {/* Navigation */}
          <View className="flex" style={{ gap: 0 }}>
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.path);
              return (
                <View
                  key={item.path}
                  className="cursor-pointer whitespace-nowrap"
                  style={{
                    padding: '10px 16px',
                    borderBottom: active ? '2px solid #0f766e' : '2px solid transparent',
                    marginBottom: -1,
                    opacity: active ? 1 : 0.55,
                  }}
                  onClick={() => Taro.navigateTo({ url: item.path })}
                >
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
