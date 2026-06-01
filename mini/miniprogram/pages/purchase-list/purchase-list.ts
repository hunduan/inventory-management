import purchasesApi from '../../services/purchases';

Page({
  data: {
    orders: [] as any[],
    statusFilter: '',
    page: 1,
    total: 0,
    loading: false,
    hasMore: true,
    statusTabs: [
      { label: '全部', value: '' },
      { label: '草稿', value: 'DRAFT' },
      { label: '已确认', value: 'CONFIRMED' },
      { label: '已入库', value: 'RECEIVED' },
      { label: '已作废', value: 'CANCELLED' },
    ],
  },

  onLoad() { this.loadOrders(); },
  onShow() {
    this.setData({ page: 1, orders: [], hasMore: true });
    this.loadOrders();
  },

  onPullDownRefresh() {
    this.setData({ page: 1, orders: [], hasMore: true });
    this.loadOrders().then(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({ page: this.data.page + 1 });
      this.loadOrders();
    }
  },

  async loadOrders() {
    if (this.data.loading) return;
    this.setData({ loading: true });
    try {
      const res = await purchasesApi.list({ status: this.data.statusFilter, page: this.data.page });
      this.setData({
        orders: this.data.page === 1 ? res.data : [...this.data.orders, ...res.data],
        total: res.total,
        hasMore: this.data.page * 20 < res.total,
      });
    } catch (err: any) {
      console.error('purchase-list load failed:', err);
      wx.showToast({ title: err.message || '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  onTabChange(e: WechatMiniprogram.TouchEvent) {
    const status = e.currentTarget.dataset.status;
    this.setData({ statusFilter: status, page: 1, orders: [], hasMore: true });
    this.loadOrders();
  },

  onOrderTap(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/order-detail/order-detail?id=${id}&type=PURCHASE` });
  },

  onCreate() {
    wx.navigateTo({ url: '/pages/purchase/purchase' });
  },
});
