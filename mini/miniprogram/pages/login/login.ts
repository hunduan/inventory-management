import authApi from '../../services/auth';

Page({
  data: {
    email: '',
    password: '',
    loading: false,
  },

  onLoad() {
    const token = wx.getStorageSync('token');
    if (token) {
      wx.reLaunch({ url: '/pages/home/home' });
    }
  },

  onEmailInput(e: WechatMiniprogram.Input) {
    this.setData({ email: e.detail.value });
  },

  onPasswordInput(e: WechatMiniprogram.Input) {
    this.setData({ password: e.detail.value });
  },

  async onLogin() {
    const { email, password } = this.data;
    if (!email || !password) {
      wx.showToast({ title: '请输入邮箱和密码', icon: 'none' });
      return;
    }

    this.setData({ loading: true });
    try {
      const res = await authApi.login(email, password);
      wx.setStorageSync('token', res.accessToken);
      wx.setStorageSync('user', res.user);
      wx.showToast({ title: '登录成功', icon: 'success' });
      wx.reLaunch({ url: '/pages/home/home' });
    } catch (err: any) {
      wx.showToast({ title: err.message || '登录失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },
});
