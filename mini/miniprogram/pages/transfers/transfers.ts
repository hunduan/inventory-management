import transfersApi from '../../services/transfers';
import productsApi, { Product } from '../../services/products';
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
    sourceWarehouseIndex: -1,
    destWarehouseIndex: -1,
    formItems: [] as any[],
    remark: '',
    submitting: false,
    productSearch: '',
    searchResults: [] as Product[],
    showProductSearch: false,

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
      const res = await transfersApi.list({ page: this.data.page, limit: this.data.limit });
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

  async onNewTransfer() {
    await this.loadWarehouses();
    this.setData({ showForm: true, sourceWarehouseIndex: -1, destWarehouseIndex: -1, formItems: [], remark: '' });
  },

  onCancelForm() {
    this.setData({ showForm: false, formItems: [], showProductSearch: false });
  },

  onSourceWarehouseChange(e: WechatMiniprogram.PickerChange) {
    this.setData({ sourceWarehouseIndex: Number(e.detail.value) });
  },

  onDestWarehouseChange(e: WechatMiniprogram.PickerChange) {
    this.setData({ destWarehouseIndex: Number(e.detail.value) });
  },

  onRemarkInput(e: WechatMiniprogram.Input) {
    this.setData({ remark: e.detail.value });
  },

  onAddProduct() {
    this.setData({ showProductSearch: true, productSearch: '', searchResults: [] });
  },

  onProductSearchInput(e: WechatMiniprogram.Input) {
    const q = e.detail.value;
    this.setData({ productSearch: q });
    if (q.trim()) this.searchProducts(q); else this.setData({ searchResults: [] });
  },

  async searchProducts(q: string) {
    try { const res = await productsApi.list({ search: q, limit: 10 }); this.setData({ searchResults: res.data }); }
    catch { this.setData({ searchResults: [] }); }
  },

  onSelectProduct(e: WechatMiniprogram.TouchEvent) {
    const product = e.currentTarget.dataset.product as Product;
    const formItems = [...this.data.formItems];
    const existing = formItems.find(i => i.productId === product.id);
    if (existing) { existing.quantity += 1; }
    else { formItems.push({ productId: product.id, productName: product.name, quantity: 1 }); }
    this.setData({ formItems, showProductSearch: false });
  },

  onRemoveItem(e: WechatMiniprogram.TouchEvent) {
    const idx = Number(e.currentTarget.dataset.index);
    const formItems = [...this.data.formItems];
    formItems.splice(idx, 1);
    this.setData({ formItems });
  },

  onFormQuantityInput(e: WechatMiniprogram.Input) {
    const idx = Number(e.currentTarget.dataset.index);
    const qty = parseFloat(e.detail.value) || 0;
    const formItems = [...this.data.formItems];
    formItems[idx] = { ...formItems[idx], quantity: qty };
    this.setData({ formItems });
  },

  async onSubmitTransfer() {
    const { sourceWarehouseIndex, destWarehouseIndex, warehouses, formItems } = this.data;
    if (sourceWarehouseIndex < 0 || destWarehouseIndex < 0) { wx.showToast({ title: '请选择源仓库和目标仓库', icon: 'none' }); return; }
    if (sourceWarehouseIndex === destWarehouseIndex) { wx.showToast({ title: '源仓库和目标仓库不能相同', icon: 'none' }); return; }
    this.setData({ submitting: true });
    try {
      await transfersApi.create({
        sourceWarehouseId: warehouses[sourceWarehouseIndex].id,
        destWarehouseId: warehouses[destWarehouseIndex].id,
        remark: this.data.remark,
        items: formItems.map(i => ({ productId: i.productId, quantity: i.quantity })),
      });
      wx.showToast({ title: '创建成功', icon: 'success' });
      this.setData({ showForm: false, page: 1, orders: [], hasMore: true });
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
      const order = await transfersApi.getById(id);
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

  async onConfirm(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id;
    try {
      await transfersApi.confirm(id);
      wx.showToast({ title: '已确认', icon: 'success' });
      this.loadOrders();
      this.onOrderTap({ currentTarget: { dataset: { id } } } as any);
    } catch (err: any) {
      wx.showToast({ title: err.message || '操作失败', icon: 'none' });
    }
  },

  async onComplete(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id;
    try {
      await transfersApi.complete(id);
      wx.showToast({ title: '调拨完成', icon: 'success' });
      this.loadOrders();
      this.onOrderTap({ currentTarget: { dataset: { id } } } as any);
    } catch (err: any) {
      wx.showToast({ title: err.message || '操作失败', icon: 'none' });
    }
  },

  async onCancel(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id;
    try {
      await transfersApi.cancel(id);
      wx.showToast({ title: '已作废', icon: 'success' });
      this.loadOrders();
      this.onCloseDetail();
    } catch (err: any) {
      wx.showToast({ title: err.message || '操作失败', icon: 'none' });
    }
  },
});
