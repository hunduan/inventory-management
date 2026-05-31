import { api, API_BASE } from '../../services/request';

Page({
  data: {
    user: null as any,
    apiBase: API_BASE || 'http://localhost:3000/api',
  },

  onShow() {
    this.loadUserInfo();
  },

  loadUserInfo() {
    try {
      const user = wx.getStorageSync('user');
      this.setData({ user: user ? JSON.parse(user) : null });
    } catch {
      this.setData({ user: null });
    }
  },

  onNavigate(e: WechatMiniprogram.TouchEvent) {
    const url = e.currentTarget.dataset.url;
    wx.navigateTo({ url });
  },

  onViewProfile() {
    wx.showToast({ title: '个人信息功能开发中', icon: 'none' });
  },

  onViewApiInfo() {
    wx.setClipboardData({
      data: this.data.apiBase,
      success: () => wx.showToast({ title: '已复制服务器地址', icon: 'success' }),
    });
  },

  onLogout() {
    wx.showModal({
      title: '退出确认',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('token');
          wx.removeStorageSync('user');
          wx.reLaunch({ url: '/pages/login/login' });
        }
      },
    });
  },
});
