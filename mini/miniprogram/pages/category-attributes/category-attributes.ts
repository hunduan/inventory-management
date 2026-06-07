import categoriesApi from '../../services/categories';
import type { Category, CategoryAttribute } from '../../services/categories';

Page({
  data: {
    loading: true,
    categories: [] as Category[],
    selectedCategory: null as Category | null,
    attributes: [] as CategoryAttribute[],
    attrLoading: false,
  },

  onLoad() {
    this.loadCategories();
  },

  async loadCategories() {
    this.setData({ loading: true });
    try {
      const cats = await categoriesApi.list();
      this.setData({ categories: cats });
    } catch {
      wx.showToast({ title: '加载分类失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  onSelectCategory(e: WechatMiniprogram.TouchEvent) {
    const cat = e.currentTarget.dataset.category as Category;
    this.setData({ selectedCategory: cat, attrLoading: true });
    categoriesApi
      .getAttributes(cat.id)
      .then((attrs) => this.setData({ attributes: attrs }))
      .catch(() => this.setData({ attributes: [] }))
      .finally(() => this.setData({ attrLoading: false }));
  },

  onBack() {
    this.setData({ selectedCategory: null, attributes: [] });
  },
});
