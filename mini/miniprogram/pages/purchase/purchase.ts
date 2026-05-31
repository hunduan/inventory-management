import purchasesApi from '../../services/purchases';
import productsApi, { Product } from '../../services/products';

Page({
  data: {
    suppliers: [] as any[],
    warehouses: [] as any[],
    supplierIndex: -1,
    warehouseIndex: -1,
    items: [] as { productId: string; productName: string; quantity: number; unitCost: number; subtotal: number }[],
    remark: '',
    productSearch: '',
    searchResults: [] as Product[],
    showProductSearch: false,
    submitting: false,
    totalAmount: 0,
  },

  onLoad() {
    this.loadOptions();
  },

  async loadOptions() {
    try {
      const [suppliersRes, warehousesRes] = await Promise.all([
        this.getSuppliers(),
        this.getWarehouses(),
      ]);
      this.setData({ suppliers: suppliersRes, warehouses: warehousesRes });
    } catch (err: any) {
      wx.showToast({ title: '加载数据失败', icon: 'none' });
    }
  },

  async getSuppliers() {
    const { api } = await import('../../services/request');
    const res = await api.get<{ data: any[] }>('/suppliers?limit=100');
    return res.data || [];
  },

  async getWarehouses() {
    const { api } = await import('../../services/request');
    const res = await api.get<{ data: any[] }>('/warehouses?limit=100');
    return res.data || [];
  },

  onSupplierChange(e: WechatMiniprogram.PickerChange) {
    this.setData({ supplierIndex: Number(e.detail.value) });
  },

  onWarehouseChange(e: WechatMiniprogram.PickerChange) {
    this.setData({ warehouseIndex: Number(e.detail.value) });
  },

  onRemarkInput(e: WechatMiniprogram.Input) {
    this.setData({ remark: e.detail.value });
  },

  onAddProduct() {
    this.setData({ showProductSearch: true, productSearch: '', searchResults: [] });
  },

  onProductSearchInput(e: WechatMiniprogram.Input) {
    const search = e.detail.value;
    this.setData({ productSearch: search });
    if (search.trim()) {
      this.searchProducts(search);
    } else {
      this.setData({ searchResults: [] });
    }
  },

  async searchProducts(query: string) {
    try {
      const res = await productsApi.list({ search: query, limit: 10 });
      this.setData({ searchResults: res.data });
    } catch {
      this.setData({ searchResults: [] });
    }
  },

  onSelectProduct(e: WechatMiniprogram.TouchEvent) {
    const product = e.currentTarget.dataset.product as Product;
    const items = [...this.data.items];
    const existing = items.find(i => i.productId === product.id);
    if (existing) {
      existing.quantity += 1;
      existing.subtotal = existing.quantity * existing.unitCost;
    } else {
      items.push({
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitCost: product.costPrice || 0,
        subtotal: product.costPrice || 0,
      });
    }
    this.setData({ items, showProductSearch: false, totalAmount: this.calcTotal(items) });
  },

  onQuantityInput(e: WechatMiniprogram.Input) {
    const index = Number(e.currentTarget.dataset.index);
    const qty = parseFloat(e.detail.value) || 0;
    const items = [...this.data.items];
    items[index].quantity = qty;
    items[index].subtotal = qty * items[index].unitCost;
    this.setData({ items, totalAmount: this.calcTotal(items) });
  },

  onCostInput(e: WechatMiniprogram.Input) {
    const index = Number(e.currentTarget.dataset.index);
    const cost = parseFloat(e.detail.value) || 0;
    const items = [...this.data.items];
    items[index].unitCost = cost;
    items[index].subtotal = cost * items[index].quantity;
    this.setData({ items, totalAmount: this.calcTotal(items) });
  },

  onRemoveItem(e: WechatMiniprogram.TouchEvent) {
    const index = Number(e.currentTarget.dataset.index);
    const items = [...this.data.items];
    items.splice(index, 1);
    this.setData({ items, totalAmount: this.calcTotal(items) });
  },

  calcTotal(items: any[]): number {
    return items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  },

  async onSubmit() {
    if (this.data.items.length === 0) {
      wx.showToast({ title: '请至少添加一个商品', icon: 'none' });
      return;
    }
    this.setData({ submitting: true });
    try {
      const { supplierId, warehouseId } = this.getSelectedIds();
      await purchasesApi.create({
        supplierId,
        warehouseId,
        remark: this.data.remark,
        items: this.data.items.map(i => ({ productId: i.productId, quantity: i.quantity, unitCost: i.unitCost })),
      });
      wx.showToast({ title: '创建成功', icon: 'success' });
      wx.navigateBack();
    } catch (err: any) {
      wx.showToast({ title: err.message || '创建失败', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },

  getSelectedIds() {
    const { suppliers, warehouses, supplierIndex, warehouseIndex } = this.data;
    return {
      supplierId: supplierIndex >= 0 ? suppliers[supplierIndex]?.id : undefined,
      warehouseId: warehouseIndex >= 0 ? warehouses[warehouseIndex]?.id : undefined,
    };
  },
});
