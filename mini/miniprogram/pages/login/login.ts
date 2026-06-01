import authApi, { LoginResponse } from '../../services/auth';

Page({
  data: {
    email: '',
    password: '',
    loading: false,
    error: '',
  },

  onLoad() {
    const token = wx.getStorageSync('token');
    if (token) {
      wx.reLaunch({ url: '/pages/home/home' });
    }
  },

  onEmailInput(e: WechatMiniprogram.Input) {
    this.setData({ email: e.detail.value, error: '' });
  },

  onPasswordInput(e: WechatMiniprogram.Input) {
    this.setData({ password: e.detail.value, error: '' });
  },

  async onLogin() {
    const { email, password } = this.data;
    if (!email || !password) return;

    this.setData({ loading: true, error: '' });
    try {
      const res = await authApi.login(email, password);
      wx.setStorageSync('token', res.accessToken);
      wx.setStorageSync('user', JSON.stringify(res.user));
      wx.reLaunch({ url: '/pages/home/home' });
    } catch (err: any) {
      this.setData({ error: err.message || '登录失败，请检查邮箱和密码' });
    } finally {
      this.setData({ loading: false });
    }
  },
});
