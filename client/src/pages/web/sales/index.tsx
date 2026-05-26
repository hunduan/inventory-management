import { useState, useEffect } from 'react';
import { View, Text, Input, Picker } from '@tarojs/components';
import AppShell from '../../../components/layout/app-shell';
import { salesApi } from '../../../services/sales';
import Taro from '@tarojs/taro';
import Pagination from '../../../components/ui/Pagination';

const STATUS_OPTIONS = ['全部', 'DRAFT', 'DELIVERED', 'CANCELLED'];
const STATUS_LABELS: Record<string, string> = {
  DRAFT: '草稿', CONFIRMED: '已确认', DELIVERED: '已出库', CANCELLED: '已取消',
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (statusIndex > 0) params.set('status', STATUS_OPTIONS[statusIndex]);
      const res = await salesApi.list(params.toString());
      setOrders(res.items || []);
      setTotal(res.total || 0);
    } catch (err: any) { /* toast */ } finally { setLoading(false); }
  };

  useEffect(() => { loadOrders(); }, [page, statusIndex]);

  const handleAction = async (id: string, action: 'deliver' | 'cancel') => {
    try {
      if (action === 'deliver') await salesApi.deliver(id);
      else await salesApi.cancel(id);
      Taro.showToast({ title: action === 'deliver' ? '出库成功' : '已取消', icon: 'success' });
      loadOrders();
    } catch (err: any) { Taro.showToast({ title: err.message || '操作失败', icon: 'none' }); }
  };

  return (
    <AppShell>
      <View className="flex items-center justify-between mb-6">
        <View>
          <Text className="text-xl font-bold" style={{ color: '#1c1917' }}>销售管理</Text>
          <Text className="text-sm mt-0.5" style={{ color: '#a8a29e' }}>共 {total} 条</Text>
        </View>
        <View className="px-4 py-2 rounded cursor-pointer text-sm font-medium"
          style={{ backgroundColor: '#0f766e', color: '#ffffff' }}
          onClick={() => Taro.navigateTo({ url: '/pages/web/sales/new' })}>
          <Text>+ 新增销售</Text>
        </View>
      </View>

      <View className="card p-4 mb-6">
        <View className="flex gap-2 items-center" style={{ flexDirection: 'row' }}>
          <Input className="input-field" style={{ flex: 1 }} placeholder="搜索单号/客户..." value={search}
            onInput={(e) => setSearch(e.detail.value)} onConfirm={() => { setPage(1); loadOrders(); }} />
          <Picker mode="selector" range={['全部', '草稿', '已出库', '已取消']} value={statusIndex}
            onChange={(e) => setStatusIndex(Number(e.detail.value))}>
            <View className="px-3 py-2 rounded text-sm cursor-pointer" style={{ border: '1px solid #e7e5e4', minWidth: 80 }}>
              <Text style={{ color: '#57534e' }}>{['全部', '草稿', '已出库', '已取消'][statusIndex]}</Text>
            </View>
          </Picker>
          <View className="px-4 py-2 rounded cursor-pointer text-sm"
            style={{ backgroundColor: '#0f766e', color: '#ffffff' }}
            onClick={() => { setPage(1); loadOrders(); }}>
            <Text>搜索</Text>
          </View>
        </View>
      </View>

      <View className="card" style={{ overflow: 'hidden' }}>
        <View className="data-table-row text-xs" style={{ color: '#78716c', borderBottom: '1px solid #e7e5e4', backgroundColor: '#fafaf9', padding: '10px 16px', fontWeight: 500 }}>
          <Text className="data-col-no">单号</Text>
          <Text className="data-col-partner">客户</Text>
          <Text className="data-col-wh">仓库</Text>
          <Text className="data-col-amount">金额</Text>
          <Text className="data-col-status">状态</Text>
          <Text className="data-col-time">时间</Text>
          <Text className="data-col-actions">操作</Text>
        </View>

        {loading ? (
          <View className="py-12 text-center"><Text className="text-sm" style={{ color: '#a8a29e' }}>加载中...</Text></View>
        ) : orders.length === 0 ? (
          <View className="py-12 text-center"><Text className="text-sm" style={{ color: '#a8a29e' }}>暂无销售订单</Text></View>
        ) : (
          orders.map((o, idx) => {
            const sc = STATUS_STYLE[o.status] || STATUS_STYLE.DRAFT;
            const isExpanded = expandedId === o.id;
            const items = o.items || [];
            return (
              <View key={o.id}>
                <View className="data-table-row text-sm" style={{
                  padding: '10px 16px',
                  borderBottom: isExpanded ? 'none' : (idx < orders.length - 1 ? '1px solid #f5f5f4' : 'none'),
                  cursor: 'pointer',
                  backgroundColor: isExpanded ? '#fafaf9' : 'transparent',
                }} onClick={() => setExpandedId(isExpanded ? null : o.id)}>
                  <Text className="data-col-no" style={{ fontWeight: 500, color: '#1c1917' }}>{o.orderNo || '-'}</Text>
                  <Text className="data-col-partner" style={{ color: '#78716c' }}>{o.customer?.name || o.customerName || '-'}</Text>
                  <Text className="data-col-wh" style={{ color: '#78716c' }}>{o.warehouse?.name || o.warehouseName || '-'}</Text>
                  <Text className="data-col-amount" style={{ fontWeight: 500, color: '#1c1917' }}>¥{Number(o.totalAmount || 0).toFixed(2)}</Text>
                  <View className="data-col-status">
                    <View style={{ backgroundColor: sc.bg, color: sc.text, padding: '2px 6px', borderRadius: 4, display: 'inline-flex' }}>
                      <Text className="text-xs" style={{ fontWeight: 500 }}>{STATUS_LABELS[o.status] || o.status}</Text>
                    </View>
                  </View>
                  <Text className="data-col-time" style={{ color: '#a8a29e', fontSize: 12 }}>{o.createdAt ? new Date(o.createdAt).toLocaleDateString('zh-CN') : '-'}</Text>
                  <View className="data-col-actions" style={{ flexDirection: 'row', gap: 4, justifyContent: 'center' }}
                    onClick={(e: any) => e.stopPropagation()}>
                    {o.status === 'DRAFT' ? (
                      <>
                        <View style={{ padding: '4px 8px', borderRadius: 4, backgroundColor: '#f0fdf4', color: '#166534' }} onClick={() => handleAction(o.id, 'deliver')}>
                          <Text className="text-xs">出库</Text></View>
                        <View style={{ padding: '4px 8px', borderRadius: 4, backgroundColor: '#fef2f2', color: '#dc2626' }} onClick={() => handleAction(o.id, 'cancel')}>
                          <Text className="text-xs">取消</Text></View>
                      </>
                    ) : <Text className="text-xs" style={{ color: '#d6d3d1', lineHeight: '28px' }}>-</Text>}
                  </View>
                </View>

                {isExpanded && items.length > 0 && (
                  <View style={{ backgroundColor: '#fafaf9', padding: '0 16px 12px 16px', borderBottom: idx < orders.length - 1 ? '1px solid #f5f5f4' : 'none' }}>
                    <View style={{ borderTop: '1px solid #e7e5e4', paddingTop: 8 }}>
                      {items.map((item: any, i: number) => (
                        <View key={i} style={{ display: 'flex', flexDirection: 'row', padding: '6px 0', borderBottom: i < items.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                          <Text style={{ flex: 3, color: '#1c1917', fontSize: 13 }}>{item.product?.name || item.productName || '-'}</Text>
                          <Text style={{ flex: 2, color: '#78716c', fontSize: 13, textAlign: 'center' }}>{item.quantity} x {Number(item.unitPrice || 0).toFixed(2)}</Text>
                          <Text style={{ flex: 2, color: '#1c1917', fontSize: 13, fontWeight: 500, textAlign: 'right' }}>{((item.quantity || 0) * Number(item.unitPrice || 0)).toFixed(2)}</Text>
                        </View>
                      ))}
                      <View style={{ display: 'flex', flexDirection: 'row', padding: '8px 0 4px 0' }}>
                        <Text style={{ flex: 1, color: '#78716c', fontSize: 12 }}>{items.length} 项</Text>
                        <Text className="text-sm" style={{ fontWeight: 700, color: '#0f766e' }}>合计 {Number(o.totalAmount || 0).toFixed(2)}</Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>

      <Pagination page={page} totalPages={Math.ceil(total / 20)} total={total} onPrev={() => setPage(page - 1)} onNext={() => setPage(page + 1)} />
    </AppShell>
  );
}
