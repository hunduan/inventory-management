import { useState, useEffect } from 'react';
import { View, Text, Input, Button, Picker } from '@tarojs/components';
import AppShell from '../../../components/layout/app-shell';
import { salesApi } from '../../../services/sales';
import Taro from '@tarojs/taro';

const STATUS_OPTIONS = ['全部', 'DRAFT', 'CONFIRMED', 'DELIVERED', 'CANCELLED'];
const STATUS_LABELS: Record<string, string> = {
  DRAFT: '草稿',
  CONFIRMED: '已确认',
  DELIVERED: '已出库',
  CANCELLED: '已取消',
};
const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function SalesPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusIndex, setStatusIndex] = useState(0);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (statusIndex > 0) params.set('status', STATUS_OPTIONS[statusIndex]);
      const res = await salesApi.list(params.toString());
      setOrders(res.items || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      Taro.showToast({ title: err.message || '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, [page, statusIndex]);

  const handleSearch = () => { setPage(1); loadOrders(); };

  const handleAction = async (id: string, action: 'confirm' | 'deliver' | 'cancel') => {
    const actionLabels: Record<string, string> = { confirm: '确认', deliver: '出库', cancel: '取消' };
    try {
      if (action === 'confirm') await salesApi.confirm(id);
      else if (action === 'deliver') await salesApi.deliver(id);
      else await salesApi.cancel(id);
      Taro.showToast({ title: `${actionLabels[action]}成功`, icon: 'success' });
      loadOrders();
    } catch (err: any) {
      Taro.showToast({ title: err.message || `${actionLabels[action]}失败`, icon: 'none' });
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <AppShell>
      <View className="mb-4 flex gap-2 flex-wrap">
        <Input
          className="border rounded-lg px-4 py-2 flex-1 min-w-[160px]"
          placeholder="搜索单号/客户..."
          value={search}
          onInput={(e) => setSearch(e.detail.value)}
          onConfirm={handleSearch}
        />
        <Picker mode="selector" range={['全部', '草稿', '已确认', '已出库', '已取消']} value={statusIndex} onChange={(e) => setStatusIndex(Number(e.detail.value))}>
          <View className="border rounded-lg px-4 py-2 bg-white min-w-[100px] text-center">
            {['全部', '草稿', '已确认', '已出库', '已取消'][statusIndex]}
          </View>
        </Picker>
        <Button className="bg-blue-600 text-white px-4 rounded-lg" onClick={handleSearch}>搜索</Button>
        <Button className="bg-green-600 text-white px-4 rounded-lg" onClick={() => Taro.navigateTo({ url: '/pages/web/sales/new' })}>新增销售</Button>
      </View>

      <View className="bg-white rounded-lg shadow overflow-hidden">
        <View className="flex p-4 bg-gray-50 font-bold border-b">
          <Text className="flex-1">单号</Text>
          <Text className="flex-1">客户</Text>
          <Text className="flex-1">金额</Text>
          <Text className="w-20">状态</Text>
          <Text className="flex-1">创建时间</Text>
          <Text className="w-28">操作</Text>
        </View>
        {orders.map((o) => (
          <View key={o.id} className="flex p-4 border-b items-center hover:bg-gray-50">
            <Text className="flex-1">{o.orderNo || '-'}</Text>
            <Text className="flex-1">{o.customer?.name || o.customerName || '-'}</Text>
            <Text className="flex-1">¥{Number(o.totalAmount || 0).toFixed(2)}</Text>
            <Text className={`w-20 inline-block text-center text-xs font-medium px-2 py-1 rounded ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-600'}`}>
              {STATUS_LABELS[o.status] || o.status}
            </Text>
            <Text className="flex-1 text-sm text-gray-500">
              {o.createdAt ? new Date(o.createdAt).toLocaleDateString('zh-CN') : '-'}
            </Text>
            <View className="w-28 flex gap-1">
              {o.status === 'DRAFT' && (
                <>
                  <Button size="small" className="bg-blue-500 text-white" onClick={() => handleAction(o.id, 'confirm')}>确认</Button>
                  <Button size="small" className="bg-red-500 text-white" onClick={() => handleAction(o.id, 'cancel')}>取消</Button>
                </>
              )}
              {o.status === 'CONFIRMED' && (
                <>
                  <Button size="small" className="bg-green-500 text-white" onClick={() => handleAction(o.id, 'deliver')}>出库</Button>
                  <Button size="small" className="bg-red-500 text-white" onClick={() => handleAction(o.id, 'cancel')}>取消</Button>
                </>
              )}
              {(o.status === 'DELIVERED' || o.status === 'CANCELLED') && (
                <Text className="text-gray-400 text-sm px-2">-</Text>
              )}
            </View>
          </View>
        ))}
        {orders.length === 0 && !loading && (
          <View className="p-8 text-center text-gray-400">
            <Text>暂无销售订单</Text>
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
