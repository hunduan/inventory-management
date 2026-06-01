import productsApi from '../../services/products';

Page({
  data: {
    products: [] as any[],
    searchQuery: '',
    page: 1,
    total: 0,
    loading: false,
    hasMore: true,
  },

  onLoad() { this.loadProducts(); },

  onPullDownRefresh() {
    this.setData({ page: 1, products: [], hasMore: true });
    this.loadProducts().then(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({ page: this.data.page + 1 });
      this.loadProducts();
    }
  },

  async loadProducts() {
    if (this.data.loading) return;
    this.setData({ loading: true });
    try {
      const res = await productsApi.list({ search: this.data.searchQuery, page: this.data.page });
      this.setData({
        products: this.data.page === 1 ? res.data : [...this.data.products, ...res.data],
        total: res.total,
        hasMore: this.data.page * 20 < res.total,
      });
    } catch (err: any) {
      wx.showToast({ title: err.message || '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  onSearchInput(e: WechatMiniprogram.Input) { this.setData({ searchQuery: e.detail.value }); },
  onSearch() { this.setData({ page: 1, products: [], hasMore: true }); this.loadProducts(); },
});
