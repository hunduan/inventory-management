import { useState, useEffect } from 'react';
import { View, Text, Input, Button, Picker } from '@tarojs/components';
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
      } catch (err: any) {
        // 分类加载失败不影响创建
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
        <Text className="text-2xl font-bold mb-6 block">新增商品</Text>

        <View className="bg-white rounded-lg shadow p-6 space-y-4">
          <View>
            <Text className="text-sm text-gray-600 mb-1">商品名称 *</Text>
            <Input
              className="border border-gray-300 rounded-lg px-4 py-3 w-full"
              placeholder="请输入商品名称"
              value={name}
              onInput={(e) => setName(e.detail.value)}
            />
          </View>

          <View>
            <Text className="text-sm text-gray-600 mb-1">条码</Text>
            <Input
              className="border border-gray-300 rounded-lg px-4 py-3 w-full"
              placeholder="请输入条码（选填）"
              value={barcode}
              onInput={(e) => setBarcode(e.detail.value)}
            />
          </View>

          <View>
            <Text className="text-sm text-gray-600 mb-1">单位 *</Text>
            <Input
              className="border border-gray-300 rounded-lg px-4 py-3 w-full"
              placeholder="例如：个、箱、kg"
              value={unit}
              onInput={(e) => setUnit(e.detail.value)}
            />
          </View>

          <View>
            <Text className="text-sm text-gray-600 mb-1">分类</Text>
            {categories.length > 0 ? (
              <Picker mode="selector" range={categoryNames} value={categoryIndex} onChange={handleCategoryChange}>
                <View className="border border-gray-300 rounded-lg px-4 py-3 w-full text-gray-700">
                  {categoryNames[categoryIndex] || '请选择分类'}
                </View>
              </Picker>
            ) : (
              <Input
                className="border border-gray-300 rounded-lg px-4 py-3 w-full"
                placeholder="暂无分类，可留空"
                disabled
              />
            )}
          </View>

          <View>
            <Text className="text-sm text-gray-600 mb-1">售价 *</Text>
            <Input
              className="border border-gray-300 rounded-lg px-4 py-3 w-full"
              placeholder="请输入售价"
              type="number"
              value={salePrice}
              onInput={(e) => setSalePrice(e.detail.value)}
            />
          </View>

          <View>
            <Text className="text-sm text-gray-600 mb-1">成本价 *</Text>
            <Input
              className="border border-gray-300 rounded-lg px-4 py-3 w-full"
              placeholder="请输入成本价"
              type="number"
              value={costPrice}
              onInput={(e) => setCostPrice(e.detail.value)}
            />
          </View>

          <View className="flex gap-3 pt-4">
            <Button
              className="bg-gray-200 text-gray-700 rounded-lg py-3 flex-1"
              onClick={() => Taro.navigateBack()}
            >
              取消
            </Button>
            <Button
              className="bg-blue-600 text-white rounded-lg py-3 flex-1"
              loading={loading}
              onClick={handleSubmit}
            >
              保存
            </Button>
          </View>
        </View>
      </View>
    </AppShell>
  );
}
