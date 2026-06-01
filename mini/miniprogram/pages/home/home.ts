import reportsApi from '../../services/reports';

Page({
  data: {
    user: null as any,
    kpi: { todayPurchases: 0, todaySales: 0, alertCount: 0 },
    recentOrders: [] as any[],
    loading: true,
    dateStr: '',
    quickActions: [
      { id: 'scan', icon: '📷', name: '扫码', color: '#0284c7', bg: '#eff6ff' },
      { id: 'voice', icon: '🎤', name: '语音', color: '#7c3aed', bg: '#f5f3ff' },
      { id: 'purchase', icon: '📥', name: '采购', color: '#0f766e', bg: '#f0fdfa' },
      { id: 'sale', icon: '💰', name: '销售', color: '#d97706', bg: '#fffbeb' },
      { id: 'inventory', icon: '📊', name: '库存', color: '#0284c7', bg: '#eff6ff' },
      { id: 'stocktake', icon: '🔍', name: '盘点', color: '#7c3aed', bg: '#f5f3ff' },
      { id: 'transfer', icon: '🚚', name: '调拨', color: '#0f766e', bg: '#f0fdfa' },
      { id: 'products', icon: '📦', name: '商品', color: '#dc2626', bg: '#fef2f2' },
    ],
  },

  onLoad() {
    const userStr = wx.getStorageSync('user');
    try { this.setData({ user: JSON.parse(userStr) }); } catch {}
    this.updateDate();
  },

  onShow() {
    this.loadDashboard();
  },

  updateDate() {
    const now = new Date();
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    this.setData({
      dateStr: `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 星期${weekdays[now.getDay()]}`,
    });
  },

  async loadDashboard() {
    this.setData({ loading: true });
    try {
      const data = await reportsApi.dashboard();
      this.setData({
        kpi: {
          todayPurchases: data.todayPurchases || 0,
          todaySales: data.todaySales || 0,
          alertCount: data.lowStockCount || 0,
        },
        recentOrders: [
          ...(data.recentPurchases || []).map((r: any) => ({ ...r, type: 'PURCHASE' })),
          ...(data.recentSales || []).map((r: any) => ({ ...r, type: 'SALE' })),
        ].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10),
      });
    } catch (err: any) {
      console.error('Dashboard load failed:', err);
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
      products: '/pages/products/products',
    };
    if (routes[id]) wx.navigateTo({ url: routes[id] });
  },

  onOrderTap(e: WechatMiniprogram.TouchEvent) {
    const { id, type } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/order-detail/order-detail?id=${id}&type=${type}` });
  },

  onRefresh() {
    this.loadDashboard();
  },
});
