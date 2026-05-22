import { useState, useEffect } from 'react';
import { View, Text } from '@tarojs/components';
import AppShell from '../../../components/layout/app-shell';
import { useAuthStore } from '../../../store/auth';
import Taro from '@tarojs/taro';

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const [tenantName, setTenantName] = useState('');

  useEffect(() => {
    if (user) {
      setTenantName(user.tenantName || '未设置');
    }
  }, [user]);

  const handleLogout = () => {
    Taro.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          logout();
          Taro.removeStorageSync('token');
          Taro.removeStorageSync('user');
          Taro.redirectTo({ url: '/pages/web/login/index' });
        }
      },
    });
  };

  return (
    <AppShell>
      <View className="max-w-2xl mx-auto">
        <View className="mb-6">
          <Text className="page-title">系统设置</Text>
          <Text className="page-subtitle">管理账户和系统配置</Text>
        </View>

        {/* Tenant Profile */}
        <View
          className="rounded-xl p-6 mb-6"
          style={{ background: '#ffffff', border: '1px solid #e7e5e4' }}
        >
          <View className="flex items-center gap-4 mb-6">
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 9999,
                background: 'linear-gradient(135deg, #f0fdfa, #ccfbf1)',
                border: '2px solid #99f6e4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text className="text-xl font-bold" style={{ color: '#0f766e' }}>
                {tenantName.charAt(0) || '?'}
              </Text>
            </View>
            <View>
              <Text className="text-lg font-bold" style={{ color: '#292524' }}>{tenantName}</Text>
              <Text className="text-sm" style={{ color: '#a8a29e' }}>{user?.email || ''}</Text>
            </View>
          </View>

          <View className="space-y-1">
            {[
              { label: '租户名称', value: tenantName },
              { label: '管理员邮箱', value: user?.email || '-' },
              { label: '角色', value: user?.role === 'ADMIN' ? '管理员' : user?.role || '-' },
            ].map((item) => (
              <View
                key={item.label}
                className="flex items-center justify-between py-3.5 px-4 rounded-lg"
                style={{ background: '#fafaf9' }}
              >
                <Text className="text-sm" style={{ color: '#78716c' }}>{item.label}</Text>
                <Text className="text-sm font-medium" style={{ color: '#292524' }}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Future Settings */}
        <View
          className="rounded-xl p-6 mb-6"
          style={{ background: '#ffffff', border: '1px solid #e7e5e4' }}
        >
          <Text className="text-base font-semibold mb-2" style={{ color: '#292524' }}>更多设置</Text>
          <View className="py-6 text-center">
            <Text style={{ fontSize: 32, display: 'block', marginBottom: 8 }}>⚙️</Text>
            <Text className="text-sm" style={{ color: '#a8a29e' }}>更多设置功能即将上线</Text>
          </View>
        </View>

        {/* Logout */}
        <View
          className="w-full py-3.5 rounded-xl cursor-pointer text-sm font-semibold text-center"
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            transition: 'all 0.2s ease',
          }}
          onClick={handleLogout}
        >
          <Text>退出登录</Text>
        </View>
      </View>
    </AppShell>
  );
}
