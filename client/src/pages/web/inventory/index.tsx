import { useState, useEffect } from 'react';
import { View, Text, Input, Button, Picker } from '@tarojs/components';
import AppShell from '../../../components/layout/app-shell';
import { inventoryApi } from '../../../services/inventory';
import { warehousesApi } from '../../../services/warehouses';
import Taro from '@tarojs/taro';

export default function InventoryPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [warehouseIndex, setWarehouseIndex] = useState(0);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const res = await warehousesApi.list();
        setWarehouses(res.items || []);
      } catch {
        // warehouse load failure is non-critical
      }
    };
    loadOptions();
  }, []);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (warehouseIndex > 0) {
        const wh = warehouses[warehouseIndex];
        if (wh) params.set('warehouseId', wh.id);
      }
      const res = await inventoryApi.list(params.toString());
      setRecords(res.items || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      Taro.showToast({ title: err.message || '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRecords(); }, [page, warehouseIndex]);

  const handleSearch = () => { setPage(1); loadRecords(); };

  const warehouseNames = ['全部仓库', ...warehouses.map((w: any) => w.name)];
  const totalPages = Math.ceil(total / 20);

  return (
    <AppShell>
      <View className="mb-4 flex gap-2 flex-wrap">
        <Input
          className="border rounded-lg px-4 py-2 flex-1 min-w-[160px]"
          placeholder="搜索商品名称..."
          value={search}
          onInput={(e) => setSearch(e.detail.value)}
          onConfirm={handleSearch}
        />
        <Picker mode="selector" range={warehouseNames} value={warehouseIndex} onChange={(e) => setWarehouseIndex(Number(e.detail.value))}>
          <View className="border rounded-lg px-4 py-2 bg-white min-w-[120px] text-center">
            {warehouseNames[warehouseIndex] || '选择仓库'}
          </View>
        </Picker>
        <Button className="bg-blue-600 text-white px-4 rounded-lg" onClick={handleSearch}>搜索</Button>
      </View>

      <View className="bg-white rounded-lg shadow overflow-hidden">
        <View className="flex p-4 bg-gray-50 font-bold border-b">
          <Text className="flex-2">商品名称</Text>
          <Text className="flex-1">仓库</Text>
          <Text className="flex-1">库存数量</Text>
          <Text className="flex-1">成本单价</Text>
          <Text className="flex-1">最后更新</Text>
        </View>
        {records.map((r) => (
          <View key={r.id} className="flex p-4 border-b items-center hover:bg-gray-50">
            <Text className="flex-2">{r.product?.name || r.productName || '-'}</Text>
            <Text className="flex-1">{r.warehouse?.name || r.warehouseName || '-'}</Text>
            <Text className="flex-1">
              <Text className={Number(r.quantity) <= 0 ? 'text-red-500 font-medium' : ''}>
                {Number(r.quantity || 0)}
              </Text>
            </Text>
            <Text className="flex-1">¥{Number(r.unitCost || 0).toFixed(2)}</Text>
            <Text className="flex-1 text-sm text-gray-500">
              {r.updatedAt ? new Date(r.updatedAt).toLocaleDateString('zh-CN') : '-'}
            </Text>
          </View>
        ))}
        {records.length === 0 && !loading && (
          <View className="p-8 text-center text-gray-400">
            <Text>暂无库存记录</Text>
          </View>
        )}
      </View>

      <View className="flex justify-center items-center gap-2 mt-4">
        <Button disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</Button>
        <Text className="text-sm text-gray-500">第 {page} / {totalPages || 1} 页 (共 {total} 条)</Text>
        <Button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>下一页</Button>
      </View>
    </AppShell>
  );
}
