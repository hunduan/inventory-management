import reportsApi from '../../services/reports';

Page({
  data: {
    loading: false,
    activeTab: 'purchase',
    startDate: '',
    endDate: '',
    tabs: [
      { label: '采购', value: 'purchase' },
      { label: '销售', value: 'sale' },
      { label: '利润', value: 'profit' },
    ],
    purchaseReport: null as any,
    saleReport: null as any,
    profitReport: null as any,
  },

  onLoad() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    this.setData({
      startDate: this.formatDate(firstDay),
      endDate: this.formatDate(now),
    });
    this.loadReport();
  },

  formatDate(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },

  onStartDateChange(e: WechatMiniprogram.TouchEvent) {
    this.setData({ startDate: e.detail.value }, () => this.loadReport());
  },

  onEndDateChange(e: WechatMiniprogram.TouchEvent) {
    this.setData({ endDate: e.detail.value }, () => this.loadReport());
  },

  onTabChange(e: WechatMiniprogram.TouchEvent) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab }, () => this.loadReport());
  },

  async loadReport() {
    if (!this.data.startDate || !this.data.endDate) return;
    this.setData({ loading: true });
    try {
      const { startDate, endDate, activeTab } = this.data;
      if (activeTab === 'purchase') {
        const res = await reportsApi.purchases({ startDate, endDate });
        this.setData({ purchaseReport: res });
      } else if (activeTab === 'sale') {
        const res = await reportsApi.sales({ startDate, endDate });
        this.setData({ saleReport: res });
      } else if (activeTab === 'profit') {
        const res = await reportsApi.profit({ startDate, endDate });
        this.setData({ profitReport: res });
      }
    } catch (err: any) {
      wx.showToast({ title: err.message || '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },
});
