Page({
  data: {
    user: null as any,
  },

  onShow() {
    this.loadUserInfo();
  },

  loadUserInfo() {
    try {
      const userStr = wx.getStorageSync('user');
      this.setData({ user: userStr ? JSON.parse(userStr) : null });
    } catch {
      this.setData({ user: null });
    }
  },

  onNavigate(e: WechatMiniprogram.TouchEvent) {
    const url = e.currentTarget.dataset.url;
    wx.navigateTo({ url });
  },

  onViewProfile() {
    wx.showToast({ title: '个人信息', icon: 'none' });
  },

  onViewApiInfo() {
    wx.setClipboardData({
      data: 'http://localhost:3000/api',
      success: () => wx.showToast({ title: '已复制', icon: 'success' }),
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
