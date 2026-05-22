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
    <View
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #f8f7f4 0%, #f0fdfa 50%, #f8f7f4 100%)',
        minHeight: '100vh',
      }}
    >
      {/* Decorative background */}
      <View style={{
        position: 'fixed',
        top: -100,
        right: -100,
        width: 300,
        height: 300,
        borderRadius: 9999,
        background: 'linear-gradient(135deg, rgba(15,118,110,0.08), rgba(20,184,166,0.04))',
        pointerEvents: 'none',
      }} />
      <View style={{
        position: 'fixed',
        bottom: -80,
        left: -80,
        width: 250,
        height: 250,
        borderRadius: 9999,
        background: 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(217,119,6,0.03))',
        pointerEvents: 'none',
      }} />

      <View
        className="w-full"
        style={{ maxWidth: 400 }}
      >
        {/* Brand */}
        <View className="text-center mb-10">
          <View
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #0f766e, #14b8a6)',
              marginBottom: 16,
              boxShadow: '0 4px 16px rgba(15,118,110,0.25)',
            }}
          >
            <Text style={{ color: 'white', fontSize: 24, fontWeight: 700 }}>进</Text>
          </View>
          <Text className="text-2xl font-bold" style={{ color: '#292524', letterSpacing: '-0.02em' }}>
            进销存管理系统
          </Text>
          <Text className="text-sm mt-2" style={{ color: '#a8a29e' }}>
            登录您的账户以继续
          </Text>
        </View>

        {/* Login Card */}
        <View
          className="rounded-2xl p-8"
          style={{
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(231,229,228,0.6)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
          }}
        >
          <View style={{ marginBottom: 20 }}>
            <Text className="text-sm font-medium mb-2" style={{ color: '#57534e' }}>邮箱</Text>
            <View
              className="flex items-center rounded-xl px-4"
              style={{
                border: '1px solid #e7e5e4',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                background: '#fafaf9',
              }}
              onClick={() => {}}
            >
              <Input
                style={{
                  flex: 1,
                  padding: '12px 0',
                  fontSize: 15,
                  color: '#292524',
                  outline: 'none',
                  border: 'none',
                  background: 'transparent',
                }}
                placeholder="请输入邮箱"
                placeholderStyle="color: #d6d3d1"
                value={email}
                onInput={(e) => setEmail(e.detail.value)}
              />
            </View>
          </View>

          <View style={{ marginBottom: 28 }}>
            <Text className="text-sm font-medium mb-2" style={{ color: '#57534e' }}>密码</Text>
            <View
              className="flex items-center rounded-xl px-4"
              style={{
                border: '1px solid #e7e5e4',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                background: '#fafaf9',
              }}
            >
              <Input
                style={{
                  flex: 1,
                  padding: '12px 0',
                  fontSize: 15,
                  color: '#292524',
                  outline: 'none',
                  border: 'none',
                  background: 'transparent',
                }}
                placeholder="请输入密码"
                placeholderStyle="color: #d6d3d1"
                password
                value={password}
                onInput={(e) => setPassword(e.detail.value)}
              />
            </View>
          </View>

          <View
            className="w-full rounded-xl py-3.5 flex items-center justify-center cursor-pointer"
            style={{
              background: loading
                ? 'linear-gradient(135deg, #0d9488, #0f766e)'
                : 'linear-gradient(135deg, #0f766e, #14b8a6)',
              opacity: loading ? 0.7 : 1,
              transition: 'opacity 0.2s ease, transform 0.1s ease',
              boxShadow: '0 4px 14px rgba(15,118,110,0.3)',
            }}
            onClick={loading ? undefined : handleLogin}
            onMouseEnter={(e: any) => {
              if (!loading) e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e: any) => {
              if (!loading) e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <Text className="text-base font-semibold text-white">
              {loading ? '登录中...' : '登录'}
            </Text>
          </View>

          <View className="mt-6 text-center">
            <Text
              className="text-sm cursor-pointer"
              style={{ color: '#0f766e', fontWeight: 500 }}
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
