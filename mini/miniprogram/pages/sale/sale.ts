import salesApi from '../../services/sales';
import productsApi, { Product } from '../../services/products';

Page({
  data: {
    customers: [] as any[],
    warehouses: [] as any[],
    customerIndex: -1,
    warehouseIndex: -1,
    items: [] as { productId: string; productName: string; quantity: number; unitPrice: number; subtotal: number }[],
    remark: '',
    productSearch: '',
    searchResults: [] as Product[],
    showProductSearch: false,
    submitting: false,
    totalAmount: 0,
  },

  onLoad() { this.loadOptions(); },

  async loadOptions() {
    try {
      const [customersRes, warehousesRes] = await Promise.all([this.getCustomers(), this.getWarehouses()]);
      this.setData({ customers: customersRes, warehouses: warehousesRes });
    } catch { wx.showToast({ title: '加载数据失败', icon: 'none' }); }
  },

  async getCustomers() { const { api } = await import('../../services/request'); const r = await api.get<{ data: any[] }>('/customers?limit=100'); return r.data || []; },
  async getWarehouses() { const { api } = await import('../../services/request'); const r = await api.get<{ data: any[] }>('/warehouses?limit=100'); return r.data || []; },

  onCustomerChange(e: WechatMiniprogram.PickerChange) { this.setData({ customerIndex: Number(e.detail.value) }); },
  onWarehouseChange(e: WechatMiniprogram.PickerChange) { this.setData({ warehouseIndex: Number(e.detail.value) }); },
  onRemarkInput(e: WechatMiniprogram.Input) { this.setData({ remark: e.detail.value }); },

  onAddProduct() { this.setData({ showProductSearch: true, productSearch: '', searchResults: [] }); },

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
    const items = [...this.data.items];
    const existing = items.find(i => i.productId === product.id);
    if (existing) { existing.quantity += 1; existing.subtotal = existing.quantity * existing.unitPrice; }
    else { items.push({ productId: product.id, productName: product.name, quantity: 1, unitPrice: product.salePrice || 0, subtotal: product.salePrice || 0 }); }
    this.setData({ items, showProductSearch: false, totalAmount: this.calcTotal(items) });
  },

  onQuantityInput(e: WechatMiniprogram.Input) {
    const idx = Number(e.currentTarget.dataset.index); const qty = parseFloat(e.detail.value) || 0;
    const items = [...this.data.items]; items[idx].quantity = qty; items[idx].subtotal = qty * items[idx].unitPrice;
    this.setData({ items, totalAmount: this.calcTotal(items) });
  },

  onPriceInput(e: WechatMiniprogram.Input) {
    const idx = Number(e.currentTarget.dataset.index); const price = parseFloat(e.detail.value) || 0;
    const items = [...this.data.items]; items[idx].unitPrice = price; items[idx].subtotal = price * items[idx].quantity;
    this.setData({ items, totalAmount: this.calcTotal(items) });
  },

  onRemoveItem(e: WechatMiniprogram.TouchEvent) {
    const idx = Number(e.currentTarget.dataset.index); const items = [...this.data.items]; items.splice(idx, 1);
    this.setData({ items, totalAmount: this.calcTotal(items) });
  },

  calcTotal(items: any[]) { return items.reduce((s, i) => s + (i.subtotal || 0), 0); },

  getSelectedIds() {
    const { customers, warehouses, customerIndex, warehouseIndex } = this.data;
    return { customerId: customerIndex >= 0 ? customers[customerIndex]?.id : undefined, warehouseId: warehouseIndex >= 0 ? warehouses[warehouseIndex]?.id : undefined };
  },

  async onSubmit() {
    if (this.data.items.length === 0) { wx.showToast({ title: '请至少添加一个商品', icon: 'none' }); return; }
    this.setData({ submitting: true });
    try {
      const { customerId, warehouseId } = this.getSelectedIds();
      await salesApi.create({ customerId, warehouseId, remark: this.data.remark, items: this.data.items.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice })) });
      wx.showToast({ title: '创建成功', icon: 'success' }); wx.navigateBack();
    } catch (err: any) { wx.showToast({ title: err.message || '创建失败', icon: 'none' }); }
    finally { this.setData({ submitting: false }); }
  },
});
