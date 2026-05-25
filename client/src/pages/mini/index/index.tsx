import { useEffect, useState } from 'react';
import { View, Text } from '@tarojs/components';
import { purchasesApi } from '../../../services/purchases';
import Taro from '@tarojs/taro';

export default function MiniIndexPage() {
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const res = await purchasesApi.list('page=1&limit=5');
        setRecentOrders(res.items || []);
      } catch { /* ignore */ }
    };
    loadOrders();
  }, []);

  const goto = (url: string) => Taro.navigateTo({ url });

  return (
    <View style={{ backgroundColor: '#f5f5f4', minHeight: '100vh' }}>
      {/* Header */}
      <View style={{ backgroundColor: '#0f766e', padding: '24px 20px 20px' }}>
        <Text className="text-xl font-bold" style={{ color: '#ffffff' }}>进销存</Text>
        <Text className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>库存管理</Text>
      </View>

      {/* Quick Actions */}
      <View className="card mx-4" style={{ marginTop: -12, padding: 16 }}>
        <View className="flex" style={{ flexDirection: 'row', gap: 8 }}>
          {[
            { label: '入库', icon: '📥', path: '/pages/mini/purchase/index' },
            { label: '出库', icon: '📤', path: '/pages/mini/sale/index' },
            { label: '扫码', icon: '📱', path: '/pages/mini/scan/index' },
            { label: '拍照', icon: '📷', path: '/pages/mini/photo/index' },
            { label: '语音', icon: '🎤', path: '/pages/mini/voice/index' },
          ].map((item) => (
            <View
              key={item.path}
              style={{ flex: 1, alignItems: 'center', padding: '8px 0' }}
              onClick={() => goto(item.path)}
            >
              <Text style={{ fontSize: 20, marginBottom: 4 }}>{item.icon}</Text>
              <Text className="text-xs" style={{ color: '#57534e' }}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Menu Items */}
      <View className="mx-4 mt-4" style={{ flexDirection: 'row', gap: 8 }}>
        {[
          { label: '订单查询', icon: '📋', path: '/pages/mini/orders/list' },
          { label: '商品列表', icon: '🏷️', path: '/pages/mini/products/index' },
          { label: '库存查询', icon: '📊', path: '/pages/mini/inventory/index' },
        ].map((item) => (
          <View
            key={item.path}
            className="card p-3 items-center"
            style={{ flex: 1 }}
            onClick={() => goto(item.path)}
          >
            <Text style={{ fontSize: 22, marginBottom: 6 }}>{item.icon}</Text>
            <Text className="text-xs font-medium" style={{ color: '#1c1917' }}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* Recent Orders */}
      <View className="mx-4 mt-2 mb-8">
        <View className="flex items-center justify-between mb-3">
          <Text className="text-sm font-bold" style={{ color: '#1c1917' }}>最近采购订单</Text>
          <Text className="text-xs" style={{ color: '#0f766e' }} onClick={() => goto('/pages/mini/orders/list')}>查看全部</Text>
        </View>
        {recentOrders.length === 0 ? (
          <View className="card p-6 items-center">
            <Text className="text-sm" style={{ color: '#a8a29e' }}>暂无订单</Text>
          </View>
        ) : (
          recentOrders.map((o) => (
            <View
              key={o.id}
              className="card p-4 mb-3 flex items-center justify-between"
              style={{ flexDirection: 'row' }}
              onClick={() => goto(`/pages/mini/orders/detail?id=${o.id}&type=PURCHASE`)}
            >
              <View>
                <Text className="text-sm font-medium" style={{ color: '#1c1917' }}>{o.orderNo || '-'}</Text>
                <Text className="text-xs mt-0.5" style={{ color: '#a8a29e' }}>{o.supplier?.name || o.supplierName || '-'}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text className="text-sm font-semibold" style={{ color: '#1c1917' }}>¥{Number(o.totalAmount || 0).toFixed(2)}</Text>
                <Text className="text-xs mt-0.5" style={{ color: '#a8a29e' }}>
                  {o.status === 'DRAFT' ? '草稿' : o.status === 'CONFIRMED' ? '已确认' : o.status === 'RECEIVED' ? '已入库' : '已取消'}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
}
