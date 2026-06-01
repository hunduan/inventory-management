import stocktakeApi from '../../services/stocktake';
import { api } from '../../services/request';

Page({
  data: {
    list: [] as any[],
    loading: true,
    showCreate: false,
    warehouses: [],
    warehouseIndex: -1,
    items: [] as any[],
    remark: '',
    submitting: false,
    productSearch: '',
    searchResults: [],
    showProductSearch: false,
  },

  async onLoad() {
    await Promise.all([this.loadList(), this.loadWarehouses()]);
  },

  onShow() { if (!this.data.showCreate) this.loadList(); },

  async loadList() {
    this.setData({ loading: true });
    try {
      const res = await stocktakeApi.list();
      this.setData({ list: res.data || [] });
    } catch { wx.showToast({ title: '加载失败', icon: 'none' }); }
    finally { this.setData({ loading: false }); }
  },

  async loadWarehouses() {
    try {
      const res = await api.get<{ data: any[] }>('/warehouses?limit=100');
      this.setData({ warehouses: res.data || [] });
    } catch {}
  },

  onShowCreate() {
    this.setData({ showCreate: true, warehouseIndex: -1, items: [], remark: '' });
  },
  onHideCreate() { this.setData({ showCreate: false }); },
  onWarehouseChange(e: WechatMiniprogram.PickerChange) { this.setData({ warehouseIndex: Number(e.detail.value) }); },
  onRemarkInput(e: WechatMiniprogram.Input) { this.setData({ remark: e.detail.value }); },

  onAddProduct() { this.setData({ showProductSearch: true, productSearch: '', searchResults: [] }); },
  onCloseSearch() { this.setData({ showProductSearch: false }); },

  async onProductSearchInput(e: WechatMiniprogram.Input) {
    const q = e.detail.value;
    this.setData({ productSearch: q });
    if (!q.trim()) { this.setData({ searchResults: [] }); return; }
    try {
      const res = await api.get<{ data: any[] }>(`/products?search=${q}&limit=10`);
      this.setData({ searchResults: res.data || [] });
    } catch { this.setData({ searchResults: [] }); }
  },

  onSelectProduct(e: WechatMiniprogram.TouchEvent) {
    const product = e.currentTarget.dataset.product;
    const items = [...this.data.items];
    if (items.find(i => i.productId === product.id)) {
      wx.showToast({ title: '商品已存在', icon: 'none' }); return;
    }
    items.push({
      productId: product.id,
      productName: product.name,
      bookQuantity: product.stock || 0,
    });
    this.setData({ items, showProductSearch: false });
  },

  onRemoveItem(e: WechatMiniprogram.TouchEvent) {
    const idx = Number(e.currentTarget.dataset.index);
    const items = [...this.data.items];
    items.splice(idx, 1);
    this.setData({ items });
  },

  async onSubmit() {
    if (this.data.warehouseIndex < 0) { wx.showToast({ title: '请选择仓库', icon: 'none' }); return; }
    if (this.data.items.length === 0) { wx.showToast({ title: '请添加商品', icon: 'none' }); return; }
    this.setData({ submitting: true });
    try {
      const { warehouses, warehouseIndex, remark, items } = this.data;
      await stocktakeApi.create({
        warehouseId: warehouses[warehouseIndex].id,
        remark,
        items: items.map(i => ({ productId: i.productId, bookQuantity: i.bookQuantity })),
      });
      wx.showToast({ title: '创建成功', icon: 'success' });
      this.setData({ showCreate: false });
      this.loadList();
    } catch (err: any) {
      wx.showToast({ title: err.message || '创建失败', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },

  onItemTap(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/order-detail/order-detail?id=${id}&type=STOCKTAKE` });
  },
});
