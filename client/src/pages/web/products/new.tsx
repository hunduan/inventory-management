import { useState, useEffect } from 'react';
import { View, Text, Input, Picker } from '@tarojs/components';
import AppShell from '../../../components/layout/app-shell';
import { productsApi } from '../../../services/products';
import { categoriesApi } from '../../../services/categories';
import Taro from '@tarojs/taro';

export default function NewProductPage() {
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [unit, setUnit] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await categoriesApi.list();
        setCategories(res.items || []);
      } catch {
        // non-critical
      }
    };
    loadCategories();
  }, []);

  const handleSubmit = async () => {
    if (!name || !unit || !salePrice || !costPrice) {
      Taro.showToast({ title: '请填写必填字段', icon: 'none' });
      return;
    }

    setLoading(true);
    try {
      await productsApi.create({
        name,
        barcode: barcode || undefined,
        unit,
        salePrice: parseFloat(salePrice),
        costPrice: parseFloat(costPrice),
        categoryId: categoryId || undefined,
      });
      Taro.showToast({ title: '创建成功', icon: 'success' });
      Taro.navigateBack();
    } catch (err: any) {
      Taro.showToast({ title: err.message || '创建失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (e: any) => {
    const idx = e.detail.value;
    setCategoryIndex(idx);
    const cat = categories[idx];
    setCategoryId(cat ? cat.id : '');
  };

  const categoryNames = categories.map((c: any) => c.name);

  return (
    <AppShell>
      <View className="max-w-lg mx-auto">
        {/* Page Header */}
        <View className="flex items-center gap-3 mb-6">
          <View
            className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer"
            style={{ background: '#f5f5f4', border: '1px solid #e7e5e4' }}
            onClick={() => Taro.navigateBack()}
          >
            <Text style={{ fontSize: 16, color: '#57534e' }}>←</Text>
          </View>
          <View>
            <Text className="page-title">新增商品</Text>
            <Text className="page-subtitle">填写商品信息</Text>
          </View>
        </View>

        {/* Form */}
        <View
          className="rounded-xl p-6"
          style={{ background: '#ffffff', border: '1px solid #e7e5e4' }}
        >
          <View className="space-y-5">
            <View>
              <Text className="text-sm font-medium mb-1.5" style={{ color: '#57534e' }}>
                商品名称 <Text style={{ color: '#dc2626' }}>*</Text>
              </Text>
              <Input
                className="input-field"
                style={{ width: '100%' }}
                placeholder="请输入商品名称"
                value={name}
                onInput={(e) => setName(e.detail.value)}
              />
            </View>

            <View>
              <Text className="text-sm font-medium mb-1.5" style={{ color: '#57534e' }}>条码</Text>
              <Input
                className="input-field"
                style={{ width: '100%' }}
                placeholder="请输入条码（选填）"
                value={barcode}
                onInput={(e) => setBarcode(e.detail.value)}
              />
            </View>

            <View>
              <Text className="text-sm font-medium mb-1.5" style={{ color: '#57534e' }}>
                单位 <Text style={{ color: '#dc2626' }}>*</Text>
              </Text>
              <Input
                className="input-field"
                style={{ width: '100%' }}
                placeholder="例如：个、箱、kg"
                value={unit}
                onInput={(e) => setUnit(e.detail.value)}
              />
            </View>

            <View>
              <Text className="text-sm font-medium mb-1.5" style={{ color: '#57534e' }}>分类</Text>
              {categories.length > 0 ? (
                <Picker mode="selector" range={categoryNames} value={categoryIndex} onChange={handleCategoryChange}>
                  <View
                    className="rounded-lg px-4 py-2.5"
                    style={{
                      border: '1px solid #e7e5e4',
                      background: '#fafaf9',
                      minHeight: 42,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Text className="text-sm" style={{ color: categoryNames[categoryIndex] ? '#292524' : '#d6d3d1' }}>
                      {categoryNames[categoryIndex] || '请选择分类'}
                    </Text>
                  </View>
                </Picker>
              ) : (
                <View
                  className="rounded-lg px-4 py-2.5"
                  style={{ border: '1px solid #e7e5e4', background: '#fafaf9' }}
                >
                  <Text className="text-sm" style={{ color: '#d6d3d1' }}>暂无分类，可留空</Text>
                </View>
              )}
            </View>

            <View className="grid grid-cols-2 gap-4">
              <View>
                <Text className="text-sm font-medium mb-1.5" style={{ color: '#57534e' }}>
                  售价 <Text style={{ color: '#dc2626' }}>*</Text>
                </Text>
                <Input
                  className="input-field"
                  style={{ width: '100%' }}
                  placeholder="0.00"
                  type="number"
                  value={salePrice}
                  onInput={(e) => setSalePrice(e.detail.value)}
                />
              </View>
              <View>
                <Text className="text-sm font-medium mb-1.5" style={{ color: '#57534e' }}>
                  成本价 <Text style={{ color: '#dc2626' }}>*</Text>
                </Text>
                <Input
                  className="input-field"
                  style={{ width: '100%' }}
                  placeholder="0.00"
                  type="number"
                  value={costPrice}
                  onInput={(e) => setCostPrice(e.detail.value)}
                />
              </View>
            </View>
          </View>

          <View className="flex gap-3 pt-6 mt-6" style={{ borderTop: '1px solid #f5f5f4' }}>
            <View
              className="flex-1 py-3 rounded-xl cursor-pointer text-sm font-medium text-center"
              style={{ border: '1px solid #e7e5e4', color: '#57534e' }}
              onClick={() => Taro.navigateBack()}
            >
              <Text>取消</Text>
            </View>
            <View
              className="flex-1 py-3 rounded-xl cursor-pointer text-sm font-medium text-center"
              style={{
                background: loading ? '#0d9488' : '#0f766e',
                color: 'white',
                opacity: loading ? 0.7 : 1,
              }}
              onClick={loading ? undefined : handleSubmit}
            >
              <Text>{loading ? '保存中...' : '保存'}</Text>
            </View>
          </View>
        </View>
      </View>
    </AppShell>
  );
}
