import salesApi from '../../services/sales';
import productsApi from '../../services/products';
import { api } from '../../services/request';
import { parseAndResolve } from '../../utils/order-helper';

Page({
  data: {
    customers: [],
    warehouses: [],
    customerIndex: -1,
    warehouseIndex: -1,
    items: [] as any[],
    remark: '',
    productSearch: '',
    searchResults: [],
    showProductSearch: false,
    searchLoading: false,
    submitting: false,
    totalAmount: 0,
    loading: true,
    editId: '',
    isEdit: false,
    // smart input
    showSmartInput: false,
    smartText: '',
    unresolvedNames: [] as string[],
    parsing: false,
  },

  async onLoad(options: any) {
    this.setData({ loading: true });
    try {
      const [cusRes, warRes] = await Promise.all([
        api.get<{ data: any[] }>('/customers?limit=100'),
        api.get<{ data: any[] }>('/warehouses?limit=100'),
      ]);
      this.setData({
        customers: cusRes.data || [],
        warehouses: warRes.data || [],
      });

      // Edit mode: load existing order
      if (options?.id) {
        const order = await salesApi.getById(options.id);
        this.setData({ editId: options.id, isEdit: true });
        const cIdx = (cusRes.data || []).findIndex((c: any) => c.id === order.customerId);
        const wIdx = (warRes.data || []).findIndex((w: any) => w.id === order.warehouseId);
        this.setData({
          customerIndex: cIdx >= 0 ? cIdx : -1,
          warehouseIndex: wIdx >= 0 ? wIdx : -1,
          remark: order.remark || '',
          items: (order.items || []).map((i: any) => ({
            productId: i.productId,
            productName: i.product?.name || i.productName || '',
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            subtotal: i.quantity * i.unitPrice,
          })),
          totalAmount: order.totalAmount || 0,
        });
      }

      if (options?.warehouseId && !options?.id) {
        const idx = (warRes.data || []).findIndex((w: any) => w.id === options.warehouseId);
        if (idx >= 0) this.setData({ warehouseIndex: idx });
      }
      if (options?.productId) {
        try {
          const product = await productsApi.getById(options.productId);
          if (product) {
            this.addItemToOrder(product);
          }
        } catch {}
      }
    } catch (err: any) {
      wx.showToast({ title: '加载数据失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  onCustomerChange(e: WechatMiniprogram.PickerChange) { this.setData({ customerIndex: Number(e.detail.value) }); },
  onWarehouseChange(e: WechatMiniprogram.PickerChange) { this.setData({ warehouseIndex: Number(e.detail.value) }); },
  onRemarkInput(e: WechatMiniprogram.Input) { this.setData({ remark: e.detail.value }); },

  async onScanBarcode() {
    try {
      const res = await wx.scanCode({ onlyFromCamera: false });
      const barcode = res.result;
      if (!barcode) {
        wx.showToast({ title: '未能识别条形码', icon: 'none' });
        return;
      }
      const product = await productsApi.getByBarcode(barcode);
      if (product) {
        this.addItemToOrder(product);
        wx.showToast({ title: '已添加: ' + product.name, icon: 'success' });
      } else {
        wx.showToast({ title: `未找到条形码为 "${barcode}" 的商品`, icon: 'none' });
      }
    } catch (err: any) {
      if (err.errMsg?.includes('cancel')) return;
      wx.showToast({ title: err.message || '扫码失败', icon: 'none' });
    }
  },

  onToggleSmartInput() {
    this.setData({
      showSmartInput: !this.data.showSmartInput,
      smartText: '',
      unresolvedNames: [],
    });
  },

  onSmartTextInput(e: WechatMiniprogram.Input) {
    this.setData({ smartText: e.detail.value });
  },

  async onParseSmartText() {
    const text = this.data.smartText.trim();
    if (!text) {
      wx.showToast({ title: '请输入商品信息', icon: 'none' });
      return;
    }
    this.setData({ parsing: true, unresolvedNames: [] });
    try {
      const { items, unresolved } = await parseAndResolve(
        text,
        this.data.items,
        'SALE',
        'salePrice',
      );
      this.setData({
        items,
        totalAmount: this.calcTotal(items),
        unresolvedNames: unresolved,
        parsing: false,
      });
      if (items.length > this.data.items.length) {
        wx.showToast({ title: '已添加商品', icon: 'success' });
      }
      if (unresolved.length === 0) {
        this.setData({ showSmartInput: false });
      }
    } catch (err: any) {
      wx.showToast({ title: err.message || '解析失败', icon: 'none' });
      this.setData({ parsing: false });
    }
  },

  onAddProduct() { this.setData({ showProductSearch: true, productSearch: '', searchResults: [] }); },
  onCloseSearch() { this.setData({ showProductSearch: false }); },

  onProductSearchInput(e: WechatMiniprogram.Input) {
    const query = e.detail.value;
    this.setData({ productSearch: query });
    if (query.trim()) this.searchProducts(query);
    else this.setData({ searchResults: [] });
  },

  async searchProducts(query: string) {
    this.setData({ searchLoading: true });
    try {
      const res = await productsApi.list({ search: query });
      this.setData({ searchResults: res.data || [] });
    } catch { this.setData({ searchResults: [] }); }
    finally { this.setData({ searchLoading: false }); }
  },

  onSelectProduct(e: WechatMiniprogram.TouchEvent) {
    const product = e.currentTarget.dataset.product;
    this.addItemToOrder(product);
    this.setData({ showProductSearch: false });
  },

  addItemToOrder(product: any) {
    const items = [...this.data.items];
    const existing = items.find(i => i.productId === product.id);
    if (existing) {
      existing.quantity += 1;
      existing.subtotal = existing.quantity * existing.unitPrice;
    } else {
      items.push({
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.salePrice || 0,
        subtotal: product.salePrice || 0,
      });
    }
    this.setData({ items, totalAmount: this.calcTotal(items) });
  },

  onQuantityInput(e: WechatMiniprogram.Input) {
    const index = Number(e.currentTarget.dataset.index);
    const qty = parseFloat(e.detail.value) || 0;
    const items = [...this.data.items];
    items[index].quantity = qty;
    items[index].subtotal = qty * items[index].unitPrice;
    this.setData({ items, totalAmount: this.calcTotal(items) });
  },

  onPriceInput(e: WechatMiniprogram.Input) {
    const index = Number(e.currentTarget.dataset.index);
    const price = parseFloat(e.detail.value) || 0;
    const items = [...this.data.items];
    items[index].unitPrice = price;
    items[index].subtotal = price * items[index].quantity;
    this.setData({ items, totalAmount: this.calcTotal(items) });
  },

  onRemoveItem(e: WechatMiniprogram.TouchEvent) {
    const index = Number(e.currentTarget.dataset.index);
    const items = [...this.data.items];
    items.splice(index, 1);
    this.setData({ items, totalAmount: this.calcTotal(items) });
  },

  calcTotal(items: any[]) {
    return items.reduce((sum: number, i: any) => sum + (i.subtotal || 0), 0);
  },

  async onSubmit() {
    if (this.data.items.length === 0) {
      wx.showToast({ title: '请至少添加一个商品', icon: 'none' }); return;
    }
    this.setData({ submitting: true });
    try {
      const { customers, warehouses, customerIndex, warehouseIndex, editId, isEdit } = this.data;
      const data = {
        customerId: customerIndex >= 0 ? customers[customerIndex]?.id : undefined,
        warehouseId: warehouseIndex >= 0 ? warehouses[warehouseIndex]?.id : undefined,
        remark: this.data.remark,
        items: this.data.items.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice })),
      };
      if (isEdit) {
        await salesApi.update(editId, data);
        wx.showToast({ title: '保存成功', icon: 'success' });
      } else {
        await salesApi.create(data);
        wx.showToast({ title: '创建成功', icon: 'success' });
      }
      wx.navigateBack();
    } catch (err: any) {
      wx.showToast({ title: err.message || '操作失败', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },
});
