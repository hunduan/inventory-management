import { useState, useEffect } from 'react';
import { View, Text } from '@tarojs/components';
import { purchasesApi } from '../../../services/purchases';
import { salesApi } from '../../../services/sales';
import Taro from '@tarojs/taro';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: '草稿', CONFIRMED: '已确认', RECEIVED: '已入库', SHIPPED: '已发货', DELIVERED: '已出库', CANCELLED: '已取消',
};
const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#78716c', CONFIRMED: '#075985', RECEIVED: '#166534', SHIPPED: '#166534', DELIVERED: '#166534', CANCELLED: '#dc2626',
};
const STATUS_BG: Record<string, string> = {
  DRAFT: '#f5f5f4', CONFIRMED: '#f0f9ff', RECEIVED: '#f0fdf4', SHIPPED: '#f0fdf4', DELIVERED: '#f0fdf4', CANCELLED: '#fef2f2',
};

export default function OrdersListPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [tabIndex, setTabIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    try {
      if (tabIndex === 0) {
        const res = await purchasesApi.list('page=1&limit=20');
        setOrders((res.items || []).map((o: any) => ({ ...o, _type: 'PURCHASE', _partner: o.supplier?.name || o.supplierName || '-' })));
      } else {
        const res = await salesApi.list('page=1&limit=20');
        setOrders((res.items || []).map((o: any) => ({ ...o, _type: 'SALE', _partner: o.customer?.name || o.customerName || '-' })));
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, [tabIndex]);

  return (
    <View className="min-h-screen" style={{ backgroundColor: '#f5f5f4' }}>
      <View style={{ backgroundColor: '#0f766e', padding: '20px 20px 16px' }}>
        <Text className="text-lg font-bold" style={{ color: '#ffffff' }}>订单列表</Text>
      </View>

      {/* Tabs */}
      <View className="flex" style={{ flexDirection: 'row', backgroundColor: '#ffffff', borderBottom: '1px solid #e7e5e4' }}>
        {['采购订单', '销售订单'].map((label, idx) => (
          <View
            key={label}
            style={{ flex: 1, padding: '12px 0', alignItems: 'center' }}
            onClick={() => setTabIndex(idx)}
          >
            <Text
              className="text-sm"
              style={{
                fontWeight: tabIndex === idx ? 600 : 400,
                color: tabIndex === idx ? '#0f766e' : '#78716c',
                borderBottom: tabIndex === idx ? '2px solid #0f766e' : '2px solid transparent',
                paddingBottom: 12,
              }}
            >
              {label}
            </Text>
          </View>
        ))}
      </View>

      {/* List */}
      <View className="p-4">
        {loading ? (
          <View className="py-8 text-center"><Text className="text-sm" style={{ color: '#a8a29e' }}>加载中...</Text></View>
        ) : orders.length === 0 ? (
          <View className="py-12 text-center"><Text className="text-sm" style={{ color: '#a8a29e' }}>暂无订单</Text></View>
        ) : (
          orders.map((o) => (
            <View
              key={o.id}
              className="card p-4 mb-3"
              onClick={() => Taro.navigateTo({ url: `/pages/mini/orders/detail?id=${o.id}&type=${o._type}` })}
            >
              <View className="flex items-center justify-between mb-2" style={{ flexDirection: 'row' }}>
                <Text className="text-sm font-medium" style={{ color: '#1c1917' }}>{o.orderNo || '-'}</Text>
                <View className="px-2 py-0.5 rounded" style={{ backgroundColor: STATUS_BG[o.status] || '#f5f5f4' }}>
                  <Text className="text-xs" style={{ color: STATUS_COLORS[o.status] || '#78716c', fontWeight: 500 }}>
                    {STATUS_LABELS[o.status] || o.status}
                  </Text>
                </View>
              </View>
              <View className="flex items-center justify-between" style={{ flexDirection: 'row' }}>
                <Text className="text-sm" style={{ color: '#78716c' }}>{o._partner}</Text>
                <Text className="text-sm font-semibold" style={{ color: '#1c1917' }}>¥{Number(o.totalAmount || 0).toFixed(2)}</Text>
              </View>
              <Text className="text-xs mt-2" style={{ color: '#a8a29e' }}>
                {o.createdAt ? new Date(o.createdAt).toLocaleString('zh-CN') : '-'}
              </Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
}
