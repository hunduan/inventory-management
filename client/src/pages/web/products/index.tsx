import { useState, useEffect } from 'react';
import { View, Text, Input, Button } from '@tarojs/components';
import AppShell from '../../../components/layout/app-shell';
import { productsApi } from '../../../services/products';
import Taro from '@tarojs/taro';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      const res = await productsApi.list(params.toString());
      setProducts(res.items);
      setTotal(res.total);
    } catch (err: any) {
      Taro.showToast({ title: err.message, icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProducts(); }, [page]);

  const handleSearch = () => { setPage(1); loadProducts(); };

  const totalPages = Math.ceil(total / 20);

  return (
    <AppShell>
      <View className="mb-4 flex gap-2">
        <Input
          className="border rounded-lg px-4 py-2 flex-1"
          placeholder="搜索名称/条码..."
          value={search}
          onInput={(e) => setSearch(e.detail.value)}
          onConfirm={handleSearch}
        />
        <Button className="bg-blue-600 text-white px-4 rounded-lg" onClick={handleSearch}>搜索</Button>
        <Button className="bg-green-600 text-white px-4 rounded-lg" onClick={() => Taro.navigateTo({ url: '/pages/web/products/new' })}>新增</Button>
      </View>

      <View className="bg-white rounded-lg shadow overflow-hidden">
        <View className="flex p-4 bg-gray-50 font-bold border-b">
          <Text className="flex-2">名称</Text>
          <Text className="flex-1">条码</Text>
          <Text className="flex-1">单位</Text>
          <Text className="flex-1">售价</Text>
          <Text className="flex-1">成本</Text>
          <Text className="w-20">操作</Text>
        </View>
        {products.map((p) => (
          <View key={p.id} className="flex p-4 border-b items-center hover:bg-gray-50">
            <Text className="flex-2">{p.name}</Text>
            <Text className="flex-1">{p.barcode || '-'}</Text>
            <Text className="flex-1">{p.unit}</Text>
            <Text className="flex-1">¥{Number(p.salePrice).toFixed(2)}</Text>
            <Text className="flex-1">¥{Number(p.costPrice).toFixed(2)}</Text>
            <View className="w-20">
              <Button size="small" onClick={() => Taro.navigateTo({ url: `/pages/web/products/edit?id=${p.id}` })}>编辑</Button>
            </View>
          </View>
        ))}
      </View>

      <View className="flex justify-center items-center gap-2 mt-4">
        <Button disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</Button>
        <Text className="text-sm text-gray-500">第 {page} / {totalPages} 页 (共 {total} 条)</Text>
        <Button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>下一页</Button>
      </View>
    </AppShell>
  );
}
