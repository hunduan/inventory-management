import productsApi from '../../services/products';
import categoriesApi from '../../services/categories';
import type { Category, CategoryAttribute } from '../../services/categories';

Page({
  data: {
    isEdit: false,
    productId: '',
    name: '',
    barcode: '',
    sku: '',
    unit: '个',
    salePrice: '',
    costPrice: '',
    enabled: true,
    categories: [] as Category[],
    categoryIndex: -1,
    attributes: [] as CategoryAttribute[],
    specs: {} as Record<string, any>,
    submitting: false,
    loading: false,
    categoriesLoading: true,
  },

  onLoad(options: any) {
    this.loadCategories();
    if (options?.id) {
      this.setData({ isEdit: true, productId: options.id });
      this.loadProduct(options.id);
    }
  },

  async loadCategories() {
    this.setData({ categoriesLoading: true });
    try {
      const cats = await categoriesApi.list();
      this.setData({ categories: cats });
    } catch {
      wx.showToast({ title: '加载分类失败', icon: 'none' });
    } finally {
      this.setData({ categoriesLoading: false });
    }
  },

  async loadProduct(id: string) {
    this.setData({ loading: true });
    try {
      const product = await productsApi.getById(id);
      const catIdx = product.categoryId
        ? this.data.categories.findIndex((c: Category) => c.id === product.categoryId)
        : -1;

      this.setData({
        name: product.name || '',
        barcode: product.barcode || '',
        sku: product.sku || '',
        unit: product.unit || '个',
        salePrice: String(product.salePrice ?? ''),
        costPrice: String(product.costPrice ?? ''),
        enabled: product.enabled !== false,
        categoryIndex: catIdx >= 0 ? catIdx : -1,
        specs: product.specs || {},
      });

      if (catIdx >= 0) {
        this.loadCategoryAttrs(product.categoryId!);
      }
    } catch {
      wx.showToast({ title: '加载商品失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  onCategoryChange(e: WechatMiniprogram.PickerChange) {
    const idx = Number(e.detail.value);
    this.setData({ categoryIndex: idx, specs: {} });
    const catId = this.data.categories[idx]?.id;
    if (catId) this.loadCategoryAttrs(catId);
  },

  async loadCategoryAttrs(categoryId: string) {
    try {
      const attrs = await categoriesApi.getAttributes(categoryId);
      this.setData({ attributes: attrs });
    } catch {
      this.setData({ attributes: [] });
    }
  },

  onNameInput(e: WechatMiniprogram.Input) { this.setData({ name: e.detail.value }); },
  onBarcodeInput(e: WechatMiniprogram.Input) { this.setData({ barcode: e.detail.value }); },
  onSkuInput(e: WechatMiniprogram.Input) { this.setData({ sku: e.detail.value }); },
  onUnitInput(e: WechatMiniprogram.Input) { this.setData({ unit: e.detail.value }); },
  onSalePriceInput(e: WechatMiniprogram.Input) { this.setData({ salePrice: e.detail.value }); },
  onCostPriceInput(e: WechatMiniprogram.Input) { this.setData({ costPrice: e.detail.value }); },
  onEnabledChange(e: WechatMiniprogram.SwitchChange) { this.setData({ enabled: e.detail.value }); },

  onSpecInput(e: WechatMiniprogram.Input) {
    const key = e.currentTarget.dataset.key;
    const specs = { ...this.data.specs, [key]: e.detail.value };
    this.setData({ specs });
  },

  onSpecSelect(e: WechatMiniprogram.TouchEvent) {
    const key = e.currentTarget.dataset.key;
    const value = e.currentTarget.dataset.value;
    const specs = { ...this.data.specs, [key]: value };
    this.setData({ specs });
  },

  async onSubmit() {
    if (!this.data.name) {
      wx.showToast({ title: '请输入商品名称', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    try {
      const { categories, categoryIndex, attributes, specs } = this.data;

      for (const attr of attributes) {
        if (attr.required && !specs[attr.name]) {
          wx.showToast({ title: `请填写${attr.name}`, icon: 'none' });
          this.setData({ submitting: false });
          return;
        }
      }

      const data: Record<string, any> = {
        name: this.data.name,
        barcode: this.data.barcode || undefined,
        sku: this.data.sku || undefined,
        unit: this.data.unit,
        salePrice: parseFloat(this.data.salePrice) || 0,
        costPrice: parseFloat(this.data.costPrice) || 0,
        enabled: this.data.enabled,
        specs,
      };

      if (categoryIndex >= 0 && categories[categoryIndex]) {
        data.categoryId = categories[categoryIndex].id;
      }

      if (this.data.isEdit) {
        await productsApi.update(this.data.productId, data);
        wx.showToast({ title: '保存成功', icon: 'success' });
      } else {
        await productsApi.create(data as any);
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
