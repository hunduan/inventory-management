import { useState, useEffect } from 'react';
import { View, Text, Button } from '@tarojs/components';
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
        <Text className="text-2xl font-bold mb-6 block">系统设置</Text>

        {/* Tenant Profile */}
        <View className="bg-white rounded-lg shadow p-6 mb-6">
          <Text className="text-lg font-bold mb-4">租户信息</Text>

          <View className="flex items-center mb-6">
            <View className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-4">
              <Text className="text-2xl font-bold text-blue-600">
                {tenantName.charAt(0) || '?'}
              </Text>
            </View>
            <View>
              <Text className="text-xl font-bold text-gray-800">{tenantName}</Text>
              <Text className="text-sm text-gray-500">{user?.email || ''}</Text>
            </View>
          </View>

          <View className="space-y-4">
            <View className="flex justify-between py-3 border-b border-gray-100">
              <Text className="text-gray-600">租户名称</Text>
              <Text className="text-gray-800 font-medium">{tenantName}</Text>
            </View>
            <View className="flex justify-between py-3 border-b border-gray-100">
              <Text className="text-gray-600">管理员邮箱</Text>
              <Text className="text-gray-800 font-medium">{user?.email || '-'}</Text>
            </View>
            <View className="flex justify-between py-3 border-b border-gray-100">
              <Text className="text-gray-600">角色</Text>
              <Text className="text-gray-800 font-medium">{user?.role === 'ADMIN' ? '管理员' : user?.role || '-'}</Text>
            </View>
          </View>
        </View>

        {/* Placeholder for future settings */}
        <View className="bg-white rounded-lg shadow p-6 mb-6">
          <Text className="text-lg font-bold mb-4">更多设置</Text>
          <Text className="text-gray-400 text-center py-4">更多设置功能即将上线</Text>
        </View>

        {/* Logout */}
        <View className="text-center">
          <Button
            className="bg-red-500 text-white rounded-lg py-3 w-full"
            onClick={handleLogout}
          >
            退出登录
          </Button>
        </View>
      </View>
    </AppShell>
  );
}
