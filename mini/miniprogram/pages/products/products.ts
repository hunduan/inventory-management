import productsApi, { Product } from '../../services/products';

Page({
  data: {
    products: [] as Product[],
    search: '',
    page: 1,
    limit: 20,
    total: 0,
    loading: false,
    hasMore: true,
    selectedProduct: null as Product | null,
    showDetail: false,
  },

  onLoad() {
    this.loadProducts();
  },

  onPullDownRefresh() {
    this.setData({ page: 1, products: [], hasMore: true });
    this.loadProducts().then(() => {
      wx.stopPullDownRefresh();
    });
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
      const res = await productsApi.list({
        search: this.data.search,
        page: this.data.page,
        limit: this.data.limit,
      });
      this.setData({
        products: this.data.page === 1 ? res.data : [...this.data.products, ...res.data],
        total: res.total,
        hasMore: this.data.page * this.data.limit < res.total,
      });
    } catch (err: any) {
      wx.showToast({ title: err.message || '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  onSearchInput(e: WechatMiniprogram.Input) {
    this.setData({ search: e.detail.value });
  },

  onSearch() {
    this.setData({ page: 1, products: [], hasMore: true });
    this.loadProducts();
  },

  onProductTap(e: WechatMiniprogram.TouchEvent) {
    const product = e.currentTarget.dataset.product as Product;
    this.setData({ selectedProduct: product, showDetail: true });
  },

  onCloseDetail() {
    this.setData({ showDetail: false, selectedProduct: null });
  },
});
