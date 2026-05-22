import { useState, useEffect } from 'react';
import { View, Text, Input, Picker } from '@tarojs/components';
import AppShell from '../../../components/layout/app-shell';
import { purchasesApi } from '../../../services/purchases';
import Taro from '@tarojs/taro';

const STATUS_OPTIONS = ['全部', 'DRAFT', 'CONFIRMED', 'RECEIVED', 'CANCELLED'];
const STATUS_LABELS: Record<string, string> = {
  DRAFT: '草稿',
  CONFIRMED: '已确认',
  RECEIVED: '已入库',
  CANCELLED: '已取消',
};
const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  DRAFT: { bg: '#f5f5f4', text: '#78716c', dot: '#a8a29e' },
  CONFIRMED: { bg: '#f0f9ff', text: '#075985', dot: '#0284c7' },
  RECEIVED: { bg: '#f0fdf4', text: '#166534', dot: '#16a34a' },
  CANCELLED: { bg: '#fef2f2', text: '#991b1b', dot: '#dc2626' },
};

export default function PurchasesPage() {
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
      const res = await purchasesApi.list(params.toString());
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

  const handleAction = async (id: string, action: 'confirm' | 'receive' | 'cancel') => {
    const actionLabels: Record<string, string> = { confirm: '确认', receive: '入库', cancel: '取消' };
    try {
      if (action === 'confirm') await purchasesApi.confirm(id);
      else if (action === 'receive') await purchasesApi.receive(id);
      else await purchasesApi.cancel(id);
      Taro.showToast({ title: `${actionLabels[action]}成功`, icon: 'success' });
      loadOrders();
    } catch (err: any) {
      Taro.showToast({ title: err.message || `${actionLabels[action]}失败`, icon: 'none' });
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <AppShell>
      <View className="flex items-center justify-between mb-6">
        <View>
          <Text className="page-title">采购管理</Text>
          <Text className="page-subtitle">共 {total} 条采购订单</Text>
        </View>
        <View
          className="px-5 py-2.5 rounded-lg cursor-pointer text-sm font-medium"
          style={{ background: '#0f766e', color: 'white' }}
          onClick={() => Taro.navigateTo({ url: '/pages/web/purchases/new' })}
        >
          <Text>+ 新增采购</Text>
        </View>
      </View>

      <View
        className="rounded-xl p-5 mb-6"
        style={{ background: '#ffffff', border: '1px solid #e7e5e4' }}
      >
        <View className="flex gap-3 items-center flex-wrap">
          <View className="flex-1 min-w-[200px] relative">
            <View
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1,
                pointerEvents: 'none',
              }}
            >
              🔍
            </View>
            <Input
              className="input-field"
              style={{ paddingLeft: 36 }}
              placeholder="搜索单号/供应商..."
              value={search}
              onInput={(e) => setSearch(e.detail.value)}
              onConfirm={handleSearch}
            />
          </View>

          <Picker
            mode="selector"
            range={['全部', '草稿', '已确认', '已入库', '已取消']}
            value={statusIndex}
            onChange={(e) => setStatusIndex(Number(e.detail.value))}
          >
            <View
              className="flex items-center gap-1 rounded-lg px-4 py-2.5 cursor-pointer"
              style={{ border: '1px solid #e7e5e4', background: '#fafaf9', minWidth: 110 }}
            >
              <Text className="text-sm" style={{ color: '#78716c' }}>
                {['全部', '草稿', '已确认', '已入库', '已取消'][statusIndex]}
              </Text>
              <Text style={{ fontSize: 10, color: '#a8a29e', marginLeft: 4 }}>▼</Text>
            </View>
          </Picker>

          <View
            className="px-5 py-2.5 rounded-lg cursor-pointer text-sm font-medium"
            style={{ background: '#0f766e', color: 'white' }}
            onClick={handleSearch}
          >
            <Text>搜索</Text>
          </View>
        </View>
      </View>

      <View
        className="rounded-xl overflow-hidden"
        style={{ background: '#ffffff', border: '1px solid #e7e5e4' }}
      >
        <View className="table-header">
          <Text className="flex-1">单号</Text>
          <Text className="flex-1">供应商</Text>
          <Text className="flex-1">金额</Text>
          <Text className="w-24">状态</Text>
          <Text className="flex-1">创建时间</Text>
          <Text className="w-32">操作</Text>
        </View>

        {loading && (
          <View className="py-16 flex items-center justify-center">
            <View className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <View key={i} className="loading-dot" style={{ width: 8, height: 8, borderRadius: 9999, background: '#0f766e' }} />
              ))}
            </View>
          </View>
        )}

        {!loading && orders.length === 0 && (
          <View className="py-16 text-center">
            <Text style={{ fontSize: 40, display: 'block' }}>📋</Text>
            <Text className="text-base font-medium mt-3" style={{ color: '#57534e' }}>暂无采购订单</Text>
            <Text className="text-sm mt-1" style={{ color: '#a8a29e' }}>点击右上角"新增采购"创建第一单</Text>
          </View>
        )}

        {!loading && orders.length > 0 && (
          <View>
            {orders.map((o, idx) => {
              const sc = STATUS_COLORS[o.status] || STATUS_COLORS.DRAFT;
              return (
                <View
                  key={o.id}
                  className="flex px-5 py-3.5 items-center text-sm"
                  style={{
                    background: idx % 2 === 0 ? '#ffffff' : '#fafaf9',
                    borderBottom: idx < orders.length - 1 ? '1px solid #f5f5f4' : 'none',
                  }}
                >
                  <Text className="flex-1 font-medium" style={{ color: '#292524' }}>
                    {o.orderNo || '-'}
                  </Text>
                  <Text className="flex-1" style={{ color: '#78716c' }}>
                    {o.supplier?.name || o.supplierName || '-'}
                  </Text>
                  <Text className="flex-1 font-semibold" style={{ color: '#292524' }}>
                    ¥{Number(o.totalAmount || 0).toFixed(2)}
                  </Text>
                  <View
                    className="w-24 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{ background: sc.bg, color: sc.text }}
                  >
                    <View style={{ width: 5, height: 5, borderRadius: 9999, background: sc.dot }} />
                    <Text>{STATUS_LABELS[o.status] || o.status}</Text>
                  </View>
                  <Text className="flex-1" style={{ color: '#a8a29e', fontSize: 12 }}>
                    {o.createdAt ? new Date(o.createdAt).toLocaleDateString('zh-CN') : '-'}
                  </Text>
                  <View className="w-32 flex gap-1.5">
                    {o.status === 'DRAFT' && (
                      <>
                        <View className="px-2.5 py-1 rounded-lg cursor-pointer text-xs font-medium" style={{ background: '#f0f9ff', color: '#075985' }} onClick={() => handleAction(o.id, 'confirm')}><Text>确认</Text></View>
                        <View className="px-2.5 py-1 rounded-lg cursor-pointer text-xs font-medium" style={{ background: '#fef2f2', color: '#991b1b' }} onClick={() => handleAction(o.id, 'cancel')}><Text>取消</Text></View>
                      </>
                    )}
                    {o.status === 'CONFIRMED' && (
                      <>
                        <View className="px-2.5 py-1 rounded-lg cursor-pointer text-xs font-medium" style={{ background: '#f0fdf4', color: '#166534' }} onClick={() => handleAction(o.id, 'receive')}><Text>入库</Text></View>
                        <View className="px-2.5 py-1 rounded-lg cursor-pointer text-xs font-medium" style={{ background: '#fef2f2', color: '#991b1b' }} onClick={() => handleAction(o.id, 'cancel')}><Text>取消</Text></View>
                      </>
                    )}
                    {(o.status === 'RECEIVED' || o.status === 'CANCELLED') && (
                      <Text className="text-xs px-2" style={{ color: '#d6d3d1' }}>-</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

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
            第 {page} / {totalPages || 1} 页 · 共 {total} 条
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
