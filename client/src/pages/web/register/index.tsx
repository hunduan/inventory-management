import { useState } from 'react';
import { View, Text, Input, Button } from '@tarojs/components';
import { authApi } from '../../../services/auth';
import { useAuthStore } from '../../../store/auth';
import Taro from '@tarojs/taro';

export default function RegisterPage() {
  const [tenantName, setTenantName] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();

  const handleRegister = async () => {
    if (!tenantName || !tenantSlug || !email || !name || !password) {
      Taro.showToast({ title: '请填写所有必填字段', icon: 'none' });
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.register({ tenantName, tenantSlug, email, name, password });
      setAuth(res.accessToken, res.user);
      Taro.setStorageSync('token', res.accessToken);
      Taro.setStorageSync('user', JSON.stringify(res.user));
      Taro.showToast({ title: '注册成功', icon: 'success' });
      Taro.redirectTo({ url: '/pages/web/dashboard/index' });
    } catch (err: any) {
      Taro.showToast({ title: err.message || '注册失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <View className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <Text className="text-3xl font-bold text-center mb-2">创建账户</Text>
        <Text className="text-gray-500 text-center mb-8">注册新的租户和账户</Text>

        <View className="space-y-4">
          <View>
            <Text className="text-sm text-gray-600 mb-1">企业名称 *</Text>
            <Input
              className="border border-gray-300 rounded-lg px-4 py-3 w-full"
              placeholder="请输入企业/租户名称"
              value={tenantName}
              onInput={(e) => setTenantName(e.detail.value)}
            />
          </View>
          <View>
            <Text className="text-sm text-gray-600 mb-1">企业标识 *</Text>
            <Input
              className="border border-gray-300 rounded-lg px-4 py-3 w-full"
              placeholder="英文标识，用于子域名"
              value={tenantSlug}
              onInput={(e) => setTenantSlug(e.detail.value)}
            />
          </View>
          <View>
            <Text className="text-sm text-gray-600 mb-1">姓名 *</Text>
            <Input
              className="border border-gray-300 rounded-lg px-4 py-3 w-full"
              placeholder="请输入您的姓名"
              value={name}
              onInput={(e) => setName(e.detail.value)}
            />
          </View>
          <View>
            <Text className="text-sm text-gray-600 mb-1">邮箱 *</Text>
            <Input
              className="border border-gray-300 rounded-lg px-4 py-3 w-full"
              placeholder="请输入邮箱"
              value={email}
              onInput={(e) => setEmail(e.detail.value)}
            />
          </View>
          <View>
            <Text className="text-sm text-gray-600 mb-1">密码 *</Text>
            <Input
              className="border border-gray-300 rounded-lg px-4 py-3 w-full"
              placeholder="请输入密码（至少6位）"
              password
              value={password}
              onInput={(e) => setPassword(e.detail.value)}
            />
          </View>

          <Button
            className="bg-blue-600 text-white rounded-lg py-3 w-full"
            loading={loading}
            onClick={handleRegister}
          >
            注册
          </Button>
        </View>

        <Text
          className="text-blue-500 text-center block mt-6"
          onClick={() => Taro.navigateTo({ url: '/pages/web/login/index' })}
        >
          已有账号？立即登录
        </Text>
      </View>
    </View>
  );
}
