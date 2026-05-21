import { useState } from 'react';
import { View, Text, Input, Button } from '@tarojs/components';
import { authApi } from '../../../services/auth';
import { useAuthStore } from '../../../store/auth';
import Taro from '@tarojs/taro';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      Taro.showToast({ title: '请填写邮箱和密码', icon: 'none' });
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      setAuth(res.accessToken, res.user);
      Taro.setStorageSync('token', res.accessToken);
      Taro.setStorageSync('user', JSON.stringify(res.user));
      Taro.redirectTo({ url: '/pages/web/dashboard/index' });
    } catch (err: any) {
      Taro.showToast({ title: err.message || '登录失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <View className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <Text className="text-3xl font-bold text-center mb-2">进销存管理系统</Text>
        <Text className="text-gray-500 text-center mb-8">登录您的账户</Text>

        <View className="space-y-4">
          <View>
            <Text className="text-sm text-gray-600 mb-1">邮箱</Text>
            <Input
              className="border border-gray-300 rounded-lg px-4 py-3 w-full"
              placeholder="请输入邮箱"
              value={email}
              onInput={(e) => setEmail(e.detail.value)}
            />
          </View>
          <View>
            <Text className="text-sm text-gray-600 mb-1">密码</Text>
            <Input
              className="border border-gray-300 rounded-lg px-4 py-3 w-full"
              placeholder="请输入密码"
              password
              value={password}
              onInput={(e) => setPassword(e.detail.value)}
            />
          </View>
          <Button
            className="bg-blue-600 text-white rounded-lg py-3 w-full"
            loading={loading}
            onClick={handleLogin}
          >
            登录
          </Button>
        </View>

        <Text
          className="text-blue-500 text-center block mt-6"
          onClick={() => Taro.navigateTo({ url: '/pages/web/register/index' })}
        >
          还没有账号？立即注册
        </Text>
      </View>
    </View>
  );
}
