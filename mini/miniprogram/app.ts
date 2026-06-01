/// <reference path="typings/index.d.ts" />

App<IAppOption>({
  globalData: {},
  onLaunch() {
    // Check login status
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.reLaunch({ url: '/pages/login/login' });
    }
  },
  onShow() {
    // App enters foreground
  },
  onHide() {
    // App enters background
  },
})
