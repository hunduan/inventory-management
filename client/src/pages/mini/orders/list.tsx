import { useState, useEffect } from 'react';
import { View, Text, Button, Picker } from '@tarojs/components';
import { purchasesApi } from '../../../services/purchases';
import { salesApi } from '../../../services/sales';
import Taro from '@tarojs/taro';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: '草稿',
  CONFIRMED: '已确认',
  RECEIVED: '已入库',
  CANCELLED: '已取消',
};
const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  RECEIVED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function OrdersListPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [tabIndex, setTabIndex] = useState(0); // 0=purchase, 1=sale
  const [loading, setLoading] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    try {
      if (tabIndex === 0) {
        const res = await purchasesApi.list('page=1&limit=20');
        setOrders((res.items || []).map((o: any) => ({
          ...o,
          _type: 'PURCHASE',
          _partner: o.supplier?.name || o.supplierName || '-',
        })));
      } else {
        const res = await salesApi.list('page=1&limit=20');
        setOrders((res.items || []).map((o: any) => ({
          ...o,
          _type: 'SALE',
          _partner: o.customer?.name || o.customerName || '-',
        })));
      }
    } catch (err: any) {
      Taro.showToast({ title: err.message || '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, [tabIndex]);

  const goDetail = (id: string) => {
    Taro.navigateTo({ url: `/pages/mini/orders/detail?id=${id}` });
  };

  return (
    <View className="min-h-screen bg-gray-50">
      <View className="bg-white px-5 py-4 flex items-center border-b border-gray-100">
        <Text className="text-lg font-bold text-gray-800">订单列表</Text>
      </View>

      {/* Tab Switcher */}
      <View className="flex bg-white border-b border-gray-200">
        <View
          className={`flex-1 py-3 text-center font-medium ${tabIndex === 0 ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setTabIndex(0)}
        >
          采购订单
        </View>
        <View
          className={`flex-1 py-3 text-center font-medium ${tabIndex === 1 ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setTabIndex(1)}
        >
          销售订单
        </View>
      </View>

      {/* Order List */}
      <View className="p-4">
        {loading ? (
          <View className="text-center py-8">
            <Text className="text-gray-400">加载中...</Text>
          </View>
        ) : orders.length === 0 ? (
          <View className="text-center py-12">
            <Text className="text-4xl mb-3">📋</Text>
            <Text className="text-gray-400">暂无订单</Text>
          </View>
        ) : (
          orders.map((o) => (
            <View
              key={o.id}
              className="bg-white rounded-xl shadow-sm p-4 mb-3"
              onClick={() => goDetail(o.id)}
            >
              <View className="flex items-center justify-between mb-2">
                <Text className="font-medium text-gray-800">{o.orderNo || '-'}</Text>
                <Text className={`text-xs font-medium px-2 py-1 rounded ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABELS[o.status] || o.status}
                </Text>
              </View>
              <View className="flex items-center justify-between">
                <Text className="text-sm text-gray-500">{o._partner}</Text>
                <Text className="font-semibold text-gray-800">¥{Number(o.totalAmount || 0).toFixed(2)}</Text>
              </View>
              <Text className="text-xs text-gray-400 mt-2">
                {o.createdAt ? new Date(o.createdAt).toLocaleString('zh-CN') : '-'}
              </Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
}
