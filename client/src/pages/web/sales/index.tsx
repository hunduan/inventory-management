import { useState, useEffect } from 'react';
import { View, Text, Input, Picker } from '@tarojs/components';
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
const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  DRAFT: { bg: '#f5f5f4', text: '#78716c' },
  CONFIRMED: { bg: '#f0f9ff', text: '#075985' },
  DELIVERED: { bg: '#f0fdf4', text: '#166534' },
  CANCELLED: { bg: '#fef2f2', text: '#dc2626' },
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
      {/* Header */}
      <View className="flex items-center justify-between mb-6">
        <View>
          <Text className="text-xl font-bold" style={{ color: '#1c1917' }}>销售管理</Text>
          <Text className="text-sm mt-0.5" style={{ color: '#a8a29e' }}>共 {total} 条销售订单</Text>
        </View>
        <View
          className="px-4 py-2 rounded cursor-pointer text-sm font-medium"
          style={{ backgroundColor: '#0f766e', color: '#ffffff' }}
          onClick={() => Taro.navigateTo({ url: '/pages/web/sales/new' })}
        >
          <Text>+ 新增销售</Text>
        </View>
      </View>

      {/* Filter Bar */}
      <View className="card p-4 mb-6">
        <View className="flex gap-2 items-center" style={{ flexDirection: 'row' }}>
          <Input
            className="input-field"
            style={{ flex: 1 }}
            placeholder="搜索单号/客户..."
            value={search}
            onInput={(e) => setSearch(e.detail.value)}
            onConfirm={() => { setPage(1); loadOrders(); }}
          />
          <Picker mode="selector" range={['全部', '草稿', '已确认', '已出库', '已取消']} value={statusIndex} onChange={(e) => setStatusIndex(Number(e.detail.value))}>
            <View className="px-3 py-2 rounded text-sm cursor-pointer" style={{ border: '1px solid #e7e5e4', minWidth: 80 }}>
              <Text style={{ color: '#57534e' }}>{['全部', '草稿', '已确认', '已出库', '已取消'][statusIndex]}</Text>
            </View>
          </Picker>
          <View
            className="px-4 py-2 rounded cursor-pointer text-sm"
            style={{ backgroundColor: '#0f766e', color: '#ffffff', whiteSpace: 'nowrap' }}
            onClick={() => { setPage(1); loadOrders(); }}
          >
            <Text>搜索</Text>
          </View>
        </View>
      </View>

      {/* Table */}
      <View className="card overflow-hidden">
        <View className="flex px-5 py-3 text-xs font-medium" style={{ color: '#78716c', borderBottom: '1px solid #e7e5e4' }}>
          <Text style={{ flex: 1 }}>单号</Text>
          <Text style={{ flex: 1 }}>客户</Text>
          <Text style={{ flex: 1 }}>金额</Text>
          <Text style={{ width: 64 }}>状态</Text>
          <Text style={{ flex: 1 }}>创建时间</Text>
          <Text style={{ width: 80, textAlign: 'center' }}>操作</Text>
        </View>

        {loading ? (
          <View className="py-12 text-center"><Text className="text-sm" style={{ color: '#a8a29e' }}>加载中...</Text></View>
        ) : orders.length === 0 ? (
          <View className="py-12 text-center"><Text className="text-sm" style={{ color: '#a8a29e' }}>暂无销售订单</Text></View>
        ) : (
          orders.map((o, idx) => {
            const sc = STATUS_STYLE[o.status] || STATUS_STYLE.DRAFT;
            return (
              <View key={o.id} className="flex px-5 py-3 items-center text-sm" style={{ borderBottom: idx < orders.length - 1 ? '1px solid #f5f5f4' : 'none' }}>
                <Text style={{ flex: 1, fontWeight: 500, color: '#1c1917' }}>{o.orderNo || '-'}</Text>
                <Text style={{ flex: 1, color: '#78716c' }}>{o.customer?.name || o.customerName || '-'}</Text>
                <Text style={{ flex: 1, fontWeight: 500, color: '#1c1917' }}>¥{Number(o.totalAmount || 0).toFixed(2)}</Text>
                <View className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: sc.bg, color: sc.text }}>
                  <Text>{STATUS_LABELS[o.status] || o.status}</Text>
                </View>
                <Text style={{ flex: 1, color: '#a8a29e', fontSize: 12 }}>
                  {o.createdAt ? new Date(o.createdAt).toLocaleDateString('zh-CN') : '-'}
                </Text>
                <View style={{ width: 80, flexDirection: 'row', gap: 4, justifyContent: 'center' }}>
                  {o.status === 'DRAFT' && (
                    <>
                      <View className="px-2 py-1 rounded cursor-pointer text-xs" style={{ backgroundColor: '#f0f9ff', color: '#075985' }} onClick={() => handleAction(o.id, 'confirm')}><Text>确认</Text></View>
                      <View className="px-2 py-1 rounded cursor-pointer text-xs" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }} onClick={() => handleAction(o.id, 'cancel')}><Text>取消</Text></View>
                    </>
                  )}
                  {o.status === 'CONFIRMED' && (
                    <>
                      <View className="px-2 py-1 rounded cursor-pointer text-xs" style={{ backgroundColor: '#f0fdf4', color: '#166534' }} onClick={() => handleAction(o.id, 'deliver')}><Text>出库</Text></View>
                      <View className="px-2 py-1 rounded cursor-pointer text-xs" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }} onClick={() => handleAction(o.id, 'cancel')}><Text>取消</Text></View>
                    </>
                  )}
                  {(o.status === 'DELIVERED' || o.status === 'CANCELLED') && (
                    <Text className="text-xs" style={{ color: '#d6d3d1', lineHeight: '28px' }}>-</Text>
                  )}
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Pagination */}
      {totalPages > 1 && (
        <View className="flex items-center justify-center gap-3 mt-6">
          <View className="px-3 py-1.5 rounded cursor-pointer text-sm" style={{ border: '1px solid #e7e5e4', opacity: page <= 1 ? 0.4 : 1 }} onClick={() => page > 1 && setPage(page - 1)}>
            <Text style={{ color: '#57534e' }}>← 上一页</Text>
          </View>
          <Text className="text-sm" style={{ color: '#a8a29e' }}>{page} / {totalPages || 1}</Text>
          <View className="px-3 py-1.5 rounded cursor-pointer text-sm" style={{ border: '1px solid #e7e5e4', opacity: page >= totalPages ? 0.4 : 1 }} onClick={() => page < totalPages && setPage(page + 1)}>
            <Text style={{ color: '#57534e' }}>下一页 →</Text>
          </View>
        </View>
      )}
    </AppShell>
  );
}
