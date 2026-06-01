import { api } from '../../services/request';

Page({
  data: {
    items: [] as any[],
    warehouses: [] as any[],
    warehouseIndex: -1,
    searchQuery: '',
    page: 1,
    total: 0,
    loading: false,
    hasMore: true,
    showAlerts: false,
  },

  async onLoad() {
    await this.loadWarehouses();
    this.loadInventory();
  },

  onShow() {
    if (!this.data.loading) {
      this.setData({ page: 1, items: [], hasMore: true });
      this.loadInventory();
    }
  },

  onPullDownRefresh() {
    this.setData({ page: 1, items: [], hasMore: true });
    this.loadInventory().then(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({ page: this.data.page + 1 });
      this.loadInventory();
    }
  },

  async loadWarehouses() {
    try {
      const res = await api.get<{ data: any[] }>('/warehouses?limit=100');
      this.setData({ warehouses: res.data || [] });
    } catch {}
  },

  async loadInventory() {
    if (this.data.loading) return;
    this.setData({ loading: true });
    try {
      const params: any = { page: this.data.page, limit: 20 };
      const { warehouses, warehouseIndex } = this.data;
      if (warehouseIndex >= 0) params.warehouseId = warehouses[warehouseIndex]?.id;
      if (this.data.searchQuery) params.productName = this.data.searchQuery;

      const res = this.data.showAlerts
        ? await api.get<{ data: any[]; total: number }>('/inventory/alerts?' + this.buildQuery(params))
        : await api.get<{ data: any[]; total: number }>('/inventory?' + this.buildQuery(params));
      this.setData({
        items: this.data.page === 1 ? res.data : [...this.data.items, ...res.data],
        total: res.total,
        hasMore: this.data.page * 20 < res.total,
      });
    } catch (err: any) {
      wx.showToast({ title: err.message || '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  buildQuery(params: any) {
    return Object.entries(params).filter(([_, v]) => v !== undefined && v !== '').map(([k, v]) => `${k}=${v}`).join('&');
  },

  onWarehouseChange(e: WechatMiniprogram.PickerChange) {
    this.setData({ warehouseIndex: Number(e.detail.value), page: 1, items: [], hasMore: true });
    this.loadInventory();
  },

  onSearchInput(e: WechatMiniprogram.Input) {
    this.setData({ searchQuery: e.detail.value });
  },

  onSearch() {
    this.setData({ page: 1, items: [], hasMore: true });
    this.loadInventory();
  },

  onToggleAlerts() {
    this.setData({ showAlerts: !this.data.showAlerts, page: 1, items: [], hasMore: true });
    this.loadInventory();
  },

  onProductTap(e: WechatMiniprogram.TouchEvent) {
    // Quick create purchase/sale from inventory
    const { product, warehouse } = e.currentTarget.dataset;
    wx.showActionSheet({
      itemList: ['创建采购单', '创建销售单'],
      success: (res) => {
        if (res.tapIndex === 0) {
          wx.navigateTo({
            url: `/pages/purchase/purchase?productId=${product.id}&warehouseId=${warehouse?.id || ''}`,
          });
        } else if (res.tapIndex === 1) {
          wx.navigateTo({
            url: `/pages/sale/sale?productId=${product.id}&warehouseId=${warehouse?.id || ''}`,
          });
        }
      },
    });
  },
});
