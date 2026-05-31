/// <reference path="typings/index.d.ts" />

App<IAppOption>({
  globalData: {},
  onLaunch() {
    // 检查登录状态
    const token = wx.getStorageSync('token');
    if (token) {
      console.log('App launched with existing token');
    }
  },
  onShow() {
    // App 进入前台
  },
  onHide() {
    // App 进入后台
  },
})
