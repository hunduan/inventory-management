import inventoryApi from '../../services/inventory';
import { api } from '../../services/request';

Page({
  data: {
    warehouses: [] as any[],
    warehouseIndex: -1,
    search: '',
    items: [] as any[],
    alertCount: 0,
    page: 1,
    limit: 20,
    loading: false,
    hasMore: true,
    total: 0,
    showDetail: false,
    selectedItem: null as any,
    recentLogs: [] as any[],
  },

  onLoad() {
    this.loadWarehouses();
    this.loadAlerts();
    this.loadItems();
  },

  onPullDownRefresh() {
    this.setData({ page: 1, items: [], hasMore: true });
    Promise.all([this.loadAlerts(), this.loadItems()]).then(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({ page: this.data.page + 1 });
      this.loadItems();
    }
  },

  async loadWarehouses() {
    try {
      const r = await api.get<{ data: any[] }>('/warehouses?limit=100');
      this.setData({ warehouses: r.data || [] });
    } catch { /* ignore */ }
  },

  async loadAlerts() {
    try {
      const r = await inventoryApi.alerts();
      this.setData({ alertCount: r.data?.length || 0 });
    } catch { /* ignore */ }
  },

  async loadItems() {
    if (this.data.loading) return;
    this.setData({ loading: true });
    try {
      const params: any = { page: this.data.page, limit: this.data.limit };
      if (this.data.search) params.search = this.data.search;
      if (this.data.warehouseIndex >= 0) params.warehouseId = this.data.warehouses[this.data.warehouseIndex]?.id;
      const res = await inventoryApi.list(params);
      this.setData({
        items: this.data.page === 1 ? res.data : [...this.data.items, ...res.data],
        total: res.total,
        hasMore: this.data.page * this.data.limit < res.total,
      });
    } catch (err: any) {
      wx.showToast({ title: err.message || '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  onWarehouseChange(e: WechatMiniprogram.PickerChange) {
    this.setData({ warehouseIndex: Number(e.detail.value), page: 1, items: [], hasMore: true });
    this.loadItems();
  },

  onSearchInput(e: WechatMiniprogram.Input) {
    const q = e.detail.value;
    this.setData({ search: q });
    if (!q) {
      this.setData({ page: 1, items: [], hasMore: true });
      this.loadItems();
    }
  },

  async onSearchConfirm() {
    this.setData({ page: 1, items: [], hasMore: true });
    this.loadItems();
  },

  onShowAlerts() {
    this.setData({ search: '', warehouseIndex: -1, page: 1, items: [], hasMore: true });
    this.loadItems();
    wx.showToast({ title: `有 ${this.data.alertCount} 项商品库存不足`, icon: 'none' });
  },

  async onItemTap(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id;
    const item = this.data.items.find((i: any) => i.id === id);
    if (!item) return;
    this.setData({ selectedItem: item, showDetail: true });
    try {
      const r = await inventoryApi.logs({ productId: item.productId, limit: 10 });
      this.setData({ recentLogs: r.data || [] });
    } catch {
      this.setData({ recentLogs: [] });
    }
  },

  onCloseDetail() {
    this.setData({ showDetail: false, selectedItem: null, recentLogs: [] });
  },
});
