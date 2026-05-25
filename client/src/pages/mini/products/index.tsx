import { useEffect, useState } from 'react';
import { View, Text, Input } from '@tarojs/components';
import { productsApi } from '../../../services/products';
import Taro from '@tarojs/taro';

export default function MiniProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async (keyword?: string) => {
    setLoading(true);
    try {
      const params = keyword ? `page=1&limit=50&search=${encodeURIComponent(keyword)}` : 'page=1&limit=50';
      const res = await productsApi.list(params);
      setProducts(res.items || []);
    } catch { Taro.showToast({ title: '加载失败', icon: 'none' }); } finally { setLoading(false); }
  };

  return (
      <View style={{ backgroundColor: '#f5f5f4', minHeight: '100vh' }}>
      <View style={{ backgroundColor: '#0f766e', padding: '20px 20px 16px' }}>
        <Text className="text-lg font-bold" style={{ color: '#ffffff' }} onClick={() => Taro.navigateBack()}>
          ← 商品列表
        </Text>
      </View>

      <View className="p-4">
        <Input
          className="input-field mb-4"
          placeholder="搜索商品名称或条码"
          value={search}
          onInput={(e) => setSearch(e.detail.value)}
          onConfirm={() => loadProducts(search)}
        />
      </View>

      <View className="px-4 pb-8">
        {loading ? (
          <View className="py-12 text-center"><Text className="text-sm" style={{ color: '#a8a29e' }}>加载中...</Text></View>
        ) : products.length === 0 ? (
          <View className="py-12 text-center"><Text className="text-sm" style={{ color: '#a8a29e' }}>暂无商品</Text></View>
        ) : (
          products.map((p) => (
            <View key={p.id} className="card p-4 mb-3">
              <View className="flex items-center justify-between mb-1" style={{ flexDirection: 'row' }}>
                <Text className="text-sm font-medium" style={{ color: '#1c1917' }}>{p.name}</Text>
                <View className="px-2 py-0.5 rounded" style={{ backgroundColor: '#f0fdfa' }}>
                  <Text className="text-xs" style={{ color: '#0f766e' }}>¥{Number(p.price || 0).toFixed(2)}</Text>
                </View>
              </View>
              <View className="flex items-center justify-between" style={{ flexDirection: 'row' }}>
                <Text className="text-xs" style={{ color: '#a8a29e' }}>
                  {p.barcode ? `条码: ${p.barcode}` : '无条码'}
                  {p.category?.name ? ` | ${p.category.name}` : ''}
                </Text>
                <Text className="text-xs" style={{ color: '#a8a29e' }}>成本 ¥{Number(p.costPrice || 0).toFixed(2)}</Text>
              </View>
            </View>
          ))
        )}
      </View>
      </View>
  );
}
