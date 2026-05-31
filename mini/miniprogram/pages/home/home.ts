import reportsApi, { DashboardData } from '../../services/reports';

Page({
  data: {
    user: {} as any,
    dashboard: {} as DashboardData,
    loading: true,
    quickActions: [
      { id: 'scan', icon: '📷', name: '扫码' },
      { id: 'voice', icon: '🎤', name: '语音录入' },
      { id: 'photo', icon: '📸', name: '拍照识别' },
      { id: 'purchase', icon: '📋', name: '采购录入' },
      { id: 'sale', icon: '💰', name: '销售录入' },
      { id: 'inventory', icon: '📊', name: '库存查询' },
      { id: 'stocktake', icon: '🔍', name: '盘点' },
      { id: 'transfer', icon: '🚚', name: '调拨' },
    ],
  },

  onLoad() {
    const user = wx.getStorageSync('user');
    this.setData({ user });
  },

  onShow() {
    this.loadDashboard();
  },

  async loadDashboard() {
    this.setData({ loading: true });
    try {
      const data = await reportsApi.dashboard();
      this.setData({ dashboard: data });
    } catch (err: any) {
      console.error('Failed to load dashboard:', err);
    } finally {
      this.setData({ loading: false });
    }
  },

  onQuickAction(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id;
    const routes: Record<string, string> = {
      scan: '/pages/scan/scan',
      voice: '/pages/voice/voice',
      purchase: '/pages/purchase/purchase',
      sale: '/pages/sale/sale',
      inventory: '/pages/inventory/inventory',
      stocktake: '/pages/stocktake/stocktake',
      transfer: '/pages/transfers/transfers',
    };

    if (id === 'photo') {
      this.onPhoto();
      return;
    }

    if (routes[id]) {
      wx.navigateTo({ url: routes[id] });
    }
  },

  onPhoto() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['camera', 'album'],
      success: (res) => {
        const tempPath = res.tempFilePaths[0];
        wx.navigateTo({
          url: `/pages/scan/scan?photo=${encodeURIComponent(tempPath)}`,
        });
      },
    });
  },

  onViewOrder(e: WechatMiniprogram.TouchEvent) {
    const { id, type } = e.currentTarget.dataset;
    if (type === 'PURCHASE') {
      wx.navigateTo({ url: `/pages/purchase-list/purchase-list?id=${id}` });
    } else if (type === 'SALE') {
      wx.navigateTo({ url: `/pages/sale-list/sale-list?id=${id}` });
    }
  },

  onRefresh() {
    this.loadDashboard();
  },
});
