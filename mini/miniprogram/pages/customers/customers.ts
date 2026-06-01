import { api } from '../../services/request';

Page({
  data: {
    customers: [] as any[],
    search: '',
    loading: false,
    count: 0,
  },

  onLoad() {
    this.loadCustomers();
  },

  onPullDownRefresh() {
    this.loadCustomers().then(() => wx.stopPullDownRefresh());
  },

  async loadCustomers() {
    this.setData({ loading: true });
    try {
      const url = '/customers?limit=200' + (this.data.search ? '&search=' + encodeURIComponent(this.data.search) : '');
      const res = await api.get<{ data: any[]; total?: number }>(url);
      this.setData({
        customers: res.data || [],
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
    this.loadCustomers();
  },
});
