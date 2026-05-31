import purchasesApi, { PurchaseOrder } from '../../services/purchases';

Page({
  data: {
    orders: [] as PurchaseOrder[],
    statusFilter: '',
    page: 1,
    limit: 20,
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
    selectedOrder: null as PurchaseOrder | null,
    showDetail: false,
    detailLoading: false,
  },

  onLoad(options: any) {
    if (options?.id) {
      this.loadOrderDetail(options.id);
    } else {
      this.loadOrders();
    }
  },

  onShow() {
    if (!this.data.showDetail) {
      this.setData({ page: 1, orders: [], hasMore: true });
      this.loadOrders();
    }
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
      const res = await purchasesApi.list({ status: this.data.statusFilter, page: this.data.page, limit: this.data.limit });
      this.setData({
        orders: this.data.page === 1 ? res.data : [...this.data.orders, ...res.data],
        total: res.total,
        hasMore: this.data.page * this.data.limit < res.total,
      });
    } catch (err: any) {
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

  async loadOrderDetail(id: string) {
    this.setData({ detailLoading: true, showDetail: true });
    try {
      const order = await purchasesApi.getById(id);
      this.setData({ selectedOrder: order });
    } catch (err: any) {
      wx.showToast({ title: err.message || '加载失败', icon: 'none' });
      this.setData({ showDetail: false });
    } finally {
      this.setData({ detailLoading: false });
    }
  },

  onOrderTap(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id;
    this.loadOrderDetail(id);
  },

  onCloseDetail() {
    this.setData({ showDetail: false, selectedOrder: null });
  },

  async onConfirm(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id;
    try {
      await purchasesApi.confirm(id);
      wx.showToast({ title: '已确认', icon: 'success' });
      this.loadOrderDetail(id);
      this.loadOrders();
    } catch (err: any) {
      wx.showToast({ title: err.message || '操作失败', icon: 'none' });
    }
  },

  async onReceive(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id;
    try {
      await purchasesApi.receive(id);
      wx.showToast({ title: '已入库', icon: 'success' });
      this.loadOrderDetail(id);
      this.loadOrders();
    } catch (err: any) {
      wx.showToast({ title: err.message || '操作失败', icon: 'none' });
    }
  },

  async onCancel(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id;
    try {
      await purchasesApi.cancel(id);
      wx.showToast({ title: '已作废', icon: 'success' });
      this.loadOrderDetail(id);
      this.loadOrders();
    } catch (err: any) {
      wx.showToast({ title: err.message || '操作失败', icon: 'none' });
    }
  },

  onCreate() {
    wx.navigateTo({ url: '/pages/purchase/purchase' });
  },
});
