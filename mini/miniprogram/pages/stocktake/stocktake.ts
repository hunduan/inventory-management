import stocktakeApi from '../../services/stocktake';
import { api } from '../../services/request';

Page({
  data: {
    orders: [] as any[],
    page: 1,
    limit: 20,
    total: 0,
    loading: false,
    hasMore: true,

    showForm: false,
    warehouses: [] as any[],
    formWarehouseIndex: -1,
    formItems: [] as any[],
    submitting: false,

    showDetail: false,
    selectedOrder: null as any,
    detailLoading: false,
  },

  onLoad() {
    this.loadOrders();
  },

  onShow() {
    if (!this.data.showDetail && !this.data.showForm) {
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
      const res = await stocktakeApi.list({ page: this.data.page, limit: this.data.limit });
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

  async loadWarehouses() {
    try {
      const r = await api.get<{ data: any[] }>('/warehouses?limit=100');
      this.setData({ warehouses: r.data || [] });
    } catch { /* ignore */ }
  },

  async onNewStocktake() {
    await this.loadWarehouses();
    this.setData({ showForm: true, formWarehouseIndex: -1, formItems: [] });
  },

  onCancelForm() {
    this.setData({ showForm: false, formWarehouseIndex: -1, formItems: [] });
  },

  onFormWarehouseChange(e: WechatMiniprogram.PickerChange) {
    this.setData({ formWarehouseIndex: Number(e.detail.value) });
  },

  onActualQuantityInput(e: WechatMiniprogram.Input) {
    const idx = Number(e.currentTarget.dataset.index);
    const qty = parseFloat(e.detail.value) || 0;
    const formItems = [...this.data.formItems];
    formItems[idx] = { ...formItems[idx], actualQuantity: qty, difference: qty - formItems[idx].bookQuantity };
    this.setData({ formItems });
  },

  async onSubmitStocktake() {
    const { formWarehouseIndex, warehouses, formItems } = this.data;
    if (formWarehouseIndex < 0) { wx.showToast({ title: '请选择仓库', icon: 'none' }); return; }
    this.setData({ submitting: true });
    try {
      await stocktakeApi.create({
        warehouseId: warehouses[formWarehouseIndex].id,
        items: formItems.map(i => ({ productId: i.productId, bookQuantity: i.bookQuantity, actualQuantity: i.actualQuantity })),
      });
      wx.showToast({ title: '创建成功', icon: 'success' });
      this.setData({ showForm: false, showDetail: false, page: 1, orders: [], hasMore: true });
      this.loadOrders();
    } catch (err: any) {
      wx.showToast({ title: err.message || '创建失败', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },

  async onOrderTap(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id;
    this.setData({ detailLoading: true, showDetail: true });
    try {
      const order = await stocktakeApi.getById(id);
      this.setData({ selectedOrder: order });
    } catch (err: any) {
      wx.showToast({ title: err.message || '加载失败', icon: 'none' });
      this.setData({ showDetail: false });
    } finally {
      this.setData({ detailLoading: false });
    }
  },

  onCloseDetail() {
    this.setData({ showDetail: false, selectedOrder: null });
  },

  async onStartStocktake(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id;
    try {
      await stocktakeApi.start(id);
      wx.showToast({ title: '已开始盘点', icon: 'success' });
      this.loadOrders();
      this.onOrderTap({ currentTarget: { dataset: { id } } } as any);
    } catch (err: any) {
      wx.showToast({ title: err.message || '操作失败', icon: 'none' });
    }
  },

  async onCompleteStocktake(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id;
    try {
      await stocktakeApi.complete(id);
      wx.showToast({ title: '盘点完成', icon: 'success' });
      this.loadOrders();
      this.onOrderTap({ currentTarget: { dataset: { id } } } as any);
    } catch (err: any) {
      wx.showToast({ title: err.message || '操作失败', icon: 'none' });
    }
  },

  async onCancelStocktake(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id;
    try {
      await stocktakeApi.cancel(id);
      wx.showToast({ title: '已作废', icon: 'success' });
      this.loadOrders();
      this.onCloseDetail();
    } catch (err: any) {
      wx.showToast({ title: err.message || '操作失败', icon: 'none' });
    }
  },
});
