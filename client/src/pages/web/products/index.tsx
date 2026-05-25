import { useState, useEffect } from 'react';
import { View, Text, Input } from '@tarojs/components';
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

  const totalPages = Math.ceil(total / 20);

  return (
    <AppShell>
      {/* Header */}
      <View className="flex items-center justify-between mb-6">
        <View>
          <Text className="text-xl font-bold" style={{ color: '#1c1917' }}>商品管理</Text>
          <Text className="text-sm mt-0.5" style={{ color: '#a8a29e' }}>共 {total} 件商品</Text>
        </View>
        <View
          className="px-4 py-2 rounded cursor-pointer text-sm font-medium"
          style={{ backgroundColor: '#0f766e', color: '#ffffff' }}
          onClick={() => Taro.navigateTo({ url: '/pages/web/products/new' })}
        >
          <Text>+ 新增商品</Text>
        </View>
      </View>

      {/* Filter Bar */}
      <View className="card p-4 mb-6">
        <View className="flex gap-2 items-center" style={{ flexDirection: 'row' }}>
          <Input
            className="input-field"
            style={{ flex: 1 }}
            placeholder="搜索名称或条码..."
            value={search}
            onInput={(e) => setSearch(e.detail.value)}
            onConfirm={() => { setPage(1); loadProducts(); }}
          />
          <View
            className="px-4 py-2 rounded cursor-pointer text-sm"
            style={{ backgroundColor: '#0f766e', color: '#ffffff', whiteSpace: 'nowrap' }}
            onClick={() => { setPage(1); loadProducts(); }}
          >
            <Text>搜索</Text>
          </View>
        </View>
      </View>

      {/* Table */}
      <View className="card overflow-hidden">
        {/* Header Row */}
        <View className="flex px-5 py-3 text-xs font-medium" style={{ color: '#78716c', borderBottom: '1px solid #e7e5e4' }}>
          <Text style={{ flex: 2 }}>商品名称</Text>
          <Text style={{ flex: 1 }}>条码</Text>
          <Text style={{ flex: 1 }}>售价</Text>
          <Text style={{ flex: 1 }}>成本</Text>
          <Text style={{ width: 64, textAlign: 'center' }}>操作</Text>
        </View>

        {loading ? (
          <View className="py-12 text-center">
            <Text className="text-sm" style={{ color: '#a8a29e' }}>加载中...</Text>
          </View>
        ) : products.length === 0 ? (
          <View className="py-12 text-center">
            <Text className="text-sm" style={{ color: '#a8a29e' }}>暂无商品</Text>
          </View>
        ) : (
          products.map((p, idx) => (
            <View
              key={p.id}
              className="flex px-5 py-3 items-center text-sm"
              style={{ borderBottom: idx < products.length - 1 ? '1px solid #f5f5f4' : 'none' }}
            >
              <Text style={{ flex: 2, fontWeight: 500, color: '#1c1917' }}>{p.name}</Text>
              <Text style={{ flex: 1, color: '#78716c' }}>{p.barcode || '-'}</Text>
              <Text style={{ flex: 1, fontWeight: 500, color: '#1c1917' }}>¥{Number(p.salePrice).toFixed(2)}</Text>
              <Text style={{ flex: 1, color: '#78716c' }}>¥{Number(p.costPrice).toFixed(2)}</Text>
              <View style={{ width: 64, alignItems: 'center' }}>
                <View
                  className="px-2.5 py-1 rounded cursor-pointer text-xs"
                  style={{ backgroundColor: '#f0fdfa', color: '#0f766e' }}
                  onClick={() => Taro.navigateTo({ url: `/pages/web/products/edit?id=${p.id}` })}
                >
                  <Text>编辑</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Pagination */}
      {totalPages > 1 && (
        <View className="flex items-center justify-center gap-3 mt-6">
          <View
            className="px-3 py-1.5 rounded cursor-pointer text-sm"
            style={{
              border: '1px solid #e7e5e4',
              opacity: page <= 1 ? 0.4 : 1,
            }}
            onClick={() => page > 1 && setPage(page - 1)}
          >
            <Text style={{ color: '#57534e' }}>← 上一页</Text>
          </View>
          <Text className="text-sm" style={{ color: '#a8a29e' }}>{page} / {totalPages}</Text>
          <View
            className="px-3 py-1.5 rounded cursor-pointer text-sm"
            style={{
              border: '1px solid #e7e5e4',
              opacity: page >= totalPages ? 0.4 : 1,
            }}
            onClick={() => page < totalPages && setPage(page + 1)}
          >
            <Text style={{ color: '#57534e' }}>下一页 →</Text>
          </View>
        </View>
      )}
    </AppShell>
  );
}
