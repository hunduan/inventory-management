import { useState } from 'react';
import { View, Text, Input } from '@tarojs/components';
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
    <View className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#f5f5f4' }}>
      <View style={{ width: '100%', maxWidth: 380 }}>
        {/* Brand */}
        <View className="mb-8" style={{ textAlign: 'center' }}>
          <View
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 44, height: 44, borderRadius: 10,
              background: '#0f766e', marginBottom: 12,
              marginLeft: 'auto', marginRight: 'auto',
            }}
          >
            <Text style={{ color: 'white', fontSize: 20, fontWeight: 700 }}>进</Text>
          </View>
          <Text className="text-xl font-bold" style={{ color: '#1c1917' }}>进销存管理</Text>
          <Text className="text-sm mt-1" style={{ color: '#a8a29e' }}>登录您的账户</Text>
        </View>

        {/* Card */}
        <View className="card p-6">
          <View style={{ marginBottom: 16 }}>
            <Text className="text-sm font-medium mb-1.5" style={{ color: '#57534e' }}>邮箱</Text>
            <Input
              className="input-field"
              placeholder="请输入邮箱"
              value={email}
              onInput={(e) => setEmail(e.detail.value)}
            />
          </View>

          <View style={{ marginBottom: 24 }}>
            <Text className="text-sm font-medium mb-1.5" style={{ color: '#57534e' }}>密码</Text>
            <Input
              className="input-field"
              placeholder="请输入密码"
              password
              value={password}
              onInput={(e) => setPassword(e.detail.value)}
            />
          </View>

          <View
            className="w-full flex items-center justify-center cursor-pointer"
            style={{
              padding: '10px 0', borderRadius: 6,
              backgroundColor: loading ? '#0d9488' : '#0f766e',
              opacity: loading ? 0.6 : 1,
            }}
            onClick={loading ? undefined : handleLogin}
          >
            <Text className="text-white font-medium">{loading ? '登录中...' : '登录'}</Text>
          </View>

          <View className="mt-5 text-center">
            <Text
              className="text-sm cursor-pointer"
              style={{ color: '#0f766e' }}
              onClick={() => Taro.navigateTo({ url: '/pages/web/register/index' })}
            >
              还没有账号？立即注册
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
