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

  const handleSearch = () => { setPage(1); loadProducts(); };

  const totalPages = Math.ceil(total / 20);

  return (
    <AppShell>
      {/* Page Header */}
      <View className="flex items-center justify-between mb-6">
        <View>
          <Text className="page-title">商品管理</Text>
          <Text className="page-subtitle">共 {total} 件商品</Text>
        </View>
        <View
          className="px-5 py-2.5 rounded-lg cursor-pointer text-sm font-medium"
          style={{ background: '#0f766e', color: 'white' }}
          onClick={() => Taro.navigateTo({ url: '/pages/web/products/new' })}
        >
          <Text>+ 新增商品</Text>
        </View>
      </View>

      {/* Filters */}
      <View
        className="rounded-xl p-5 mb-6"
        style={{ background: '#ffffff', border: '1px solid #e7e5e4' }}
      >
        <View className="flex gap-3 items-center">
          <View className="flex-1 relative">
            <View
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1,
                fontSize: 14,
                color: '#a8a29e',
                pointerEvents: 'none',
              }}
            >
              🔍
            </View>
            <Input
              className="input-field"
              style={{ paddingLeft: 36 }}
              placeholder="搜索名称/条码..."
              value={search}
              onInput={(e) => setSearch(e.detail.value)}
              onConfirm={handleSearch}
            />
          </View>
          <View
            className="px-5 py-2.5 rounded-lg cursor-pointer text-sm font-medium"
            style={{ background: '#0f766e', color: 'white' }}
            onClick={handleSearch}
          >
            <Text>搜索</Text>
          </View>
        </View>
      </View>

      {/* Table */}
      <View
        className="rounded-xl overflow-hidden"
        style={{ background: '#ffffff', border: '1px solid #e7e5e4' }}
      >
        <View className="table-header">
          <Text className="flex-[2]">商品名称</Text>
          <Text className="flex-1">条码</Text>
          <Text className="flex-1">单位</Text>
          <Text className="flex-1">售价</Text>
          <Text className="flex-1">成本</Text>
          <Text className="w-24">操作</Text>
        </View>

        {loading && (
          <View className="py-16 flex items-center justify-center">
            <View className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  className="loading-dot"
                  style={{ width: 8, height: 8, borderRadius: 9999, background: '#0f766e' }}
                />
              ))}
            </View>
          </View>
        )}

        {!loading && products.length === 0 && (
          <View className="py-16 text-center">
            <Text style={{ fontSize: 40, display: 'block' }}>🏷️</Text>
            <Text className="text-base font-medium mt-3" style={{ color: '#57534e' }}>暂无商品</Text>
            <Text className="text-sm mt-1" style={{ color: '#a8a29e' }}>点击右上角"新增商品"开始添加</Text>
          </View>
        )}

        {!loading && products.length > 0 && (
          <View>
            {products.map((p, idx) => (
              <View
                key={p.id}
                className="flex px-5 py-3.5 items-center text-sm"
                style={{
                  background: idx % 2 === 0 ? '#ffffff' : '#fafaf9',
                  borderBottom: idx < products.length - 1 ? '1px solid #f5f5f4' : 'none',
                }}
              >
                <Text className="flex-[2] font-medium" style={{ color: '#292524' }}>
                  {p.name}
                </Text>
                <Text className="flex-1" style={{ color: '#78716c' }}>
                  {p.barcode || '-'}
                </Text>
                <Text className="flex-1" style={{ color: '#78716c' }}>
                  {p.unit}
                </Text>
                <Text className="flex-1 font-medium" style={{ color: '#292524' }}>
                  ¥{Number(p.salePrice).toFixed(2)}
                </Text>
                <Text className="flex-1" style={{ color: '#78716c' }}>
                  ¥{Number(p.costPrice).toFixed(2)}
                </Text>
                <View className="w-24">
                  <View
                    className="px-3 py-1 rounded-lg cursor-pointer text-xs font-medium"
                    style={{
                      background: '#f0fdfa',
                      color: '#0f766e',
                      display: 'inline-flex',
                    }}
                    onClick={() => Taro.navigateTo({ url: `/pages/web/products/edit?id=${p.id}` })}
                  >
                    <Text>编辑</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Pagination */}
      {totalPages > 1 && (
        <View className="flex justify-center items-center gap-2 mt-6">
          <View
            className="px-4 py-2 rounded-lg cursor-pointer text-sm"
            style={{
              border: page <= 1 ? '1px solid #e7e5e4' : '1px solid #d6d3d1',
              background: page <= 1 ? '#f5f5f4' : '#ffffff',
              color: page <= 1 ? '#d6d3d1' : '#57534e',
            }}
            onClick={() => page > 1 && setPage(page - 1)}
          >
            <Text>← 上一页</Text>
          </View>

          <Text className="text-xs" style={{ color: '#a8a29e' }}>
            第 {page} / {totalPages} 页 · 共 {total} 条
          </Text>

          <View
            className="px-4 py-2 rounded-lg cursor-pointer text-sm"
            style={{
              border: page >= totalPages ? '1px solid #e7e5e4' : '1px solid #d6d3d1',
              background: page >= totalPages ? '#f5f5f4' : '#ffffff',
              color: page >= totalPages ? '#d6d3d1' : '#57534e',
            }}
            onClick={() => page < totalPages && setPage(page + 1)}
          >
            <Text>下一页 →</Text>
          </View>
        </View>
      )}
    </AppShell>
  );
}
