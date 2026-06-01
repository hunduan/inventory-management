import transfersApi from '../../services/transfers';
import { api } from '../../services/request';

Page({
  data: {
    list: [] as any[],
    loading: true,
    page: 1,
    hasMore: true,
    showCreate: false,
    warehouses: [],
    fromIndex: -1,
    toIndex: -1,
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

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({ page: this.data.page + 1 });
      this.loadList();
    }
  },

  async loadList() {
    this.setData({ loading: true });
    try {
      const res = await transfersApi.list({ page: this.data.page });
      this.setData({
        list: this.data.page === 1 ? res.data : [...this.data.list, ...res.data],
        total: res.total,
        hasMore: this.data.page * 20 < res.total,
      });
    } catch { wx.showToast({ title: '加载失败', icon: 'none' }); }
    finally { this.setData({ loading: false }); }
  },

  async loadWarehouses() {
    try {
      const res = await api.get<{ data: any[] }>('/warehouses?limit=100');
      this.setData({ warehouses: res.data || [] });
    } catch {}
  },

  onShowCreate() { this.setData({ showCreate: true, fromIndex: -1, toIndex: -1, items: [], remark: '' }); },
  onHideCreate() { this.setData({ showCreate: false }); },
  onFromChange(e: WechatMiniprogram.PickerChange) { this.setData({ fromIndex: Number(e.detail.value) }); },
  onToChange(e: WechatMiniprogram.PickerChange) { this.setData({ toIndex: Number(e.detail.value) }); },
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
    const existing = items.find(i => i.productId === product.id);
    if (existing) { existing.quantity += 1; }
    else { items.push({ productId: product.id, productName: product.name, quantity: 1 }); }
    this.setData({ items, showProductSearch: false });
  },

  onQuantityInput(e: WechatMiniprogram.Input) {
    const idx = Number(e.currentTarget.dataset.index);
    const items = [...this.data.items];
    items[idx].quantity = parseFloat(e.detail.value) || 0;
    this.setData({ items });
  },

  onRemoveItem(e: WechatMiniprogram.TouchEvent) {
    const idx = Number(e.currentTarget.dataset.index);
    const items = [...this.data.items];
    items.splice(idx, 1);
    this.setData({ items });
  },

  async onSubmit() {
    if (this.data.fromIndex < 0 || this.data.toIndex < 0) { wx.showToast({ title: '请选择调出/调入仓库', icon: 'none' }); return; }
    if (this.data.items.length === 0) { wx.showToast({ title: '请添加商品', icon: 'none' }); return; }
    this.setData({ submitting: true });
    try {
      const { warehouses, fromIndex, toIndex, remark, items } = this.data;
      await transfersApi.create({
        fromWarehouseId: warehouses[fromIndex].id,
        toWarehouseId: warehouses[toIndex].id,
        remark,
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
      });
      wx.showToast({ title: '创建成功', icon: 'success' });
      this.setData({ showCreate: false, page: 1, list: [], hasMore: true });
      this.loadList();
    } catch (err: any) {
      wx.showToast({ title: err.message || '创建失败', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },

  onItemTap(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id;
    wx.showToast({ title: '查看详情', icon: 'none' });
  },
});
