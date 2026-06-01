import { api } from '../../services/request';

Page({
  data: {
    suppliers: [] as any[],
    search: '',
    loading: false,
    count: 0,
  },

  onLoad() {
    this.loadSuppliers();
  },

  onPullDownRefresh() {
    this.loadSuppliers().then(() => wx.stopPullDownRefresh());
  },

  async loadSuppliers() {
    this.setData({ loading: true });
    try {
      const url = '/suppliers?limit=200' + (this.data.search ? '&search=' + encodeURIComponent(this.data.search) : '');
      const res = await api.get<{ data: any[]; total?: number }>(url);
      this.setData({
        suppliers: res.data || [],
        count: res.total || 0,
      });
    } catch {
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  onSearchInput(e: WechatMiniprogram.Input) {
    this.setData({ search: e.detail.value });
    this.loadSuppliers();
  },
});
