import { useState, useEffect } from 'react';
import { View, Text, Button } from '@tarojs/components';
import { purchasesApi } from '../../../services/purchases';
import { salesApi } from '../../../services/sales';
import Taro from '@tarojs/taro';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: '草稿',
  CONFIRMED: '已确认',
  RECEIVED: '已入库',
  SHIPPED: '已发货',
  CANCELLED: '已取消',
};
const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  RECEIVED: 'bg-green-100 text-green-700',
  SHIPPED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function OrderDetailPage() {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrder = async () => {
      const params = Taro.getCurrentInstance().router?.params;
      const id = params?.id;
      if (!id) {
        Taro.showToast({ title: '订单ID不存在', icon: 'none' });
        Taro.navigateBack();
        return;
      }

      try {
        // Try purchase order first, then sales order
        try {
          const res = await purchasesApi.getById(id);
          setOrder({ ...res, _type: 'PURCHASE', _partner: res.supplier?.name || res.supplierName || '-' });
        } catch {
          const res = await salesApi.getById(id);
          setOrder({ ...res, _type: 'SALE', _partner: res.customer?.name || res.customerName || '-' });
        }
      } catch (err: any) {
        Taro.showToast({ title: err.message || '加载订单失败', icon: 'none' });
        Taro.navigateBack();
      } finally {
        setLoading(false);
      }
    };
    loadOrder();
  }, []);

  if (loading) {
    return (
      <View className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Text className="text-gray-400">加载中...</Text>
      </View>
    );
  }

  if (!order) return null;

  return (
    <View className="min-h-screen bg-gray-50">
      <View className="bg-white px-5 py-4 flex items-center border-b border-gray-100">
        <Text className="text-lg font-bold text-gray-800">订单详情</Text>
      </View>

      <View className="p-4 space-y-4">
        {/* Order Header */}
        <View className="bg-white rounded-xl shadow-sm p-4">
          <View className="flex items-center justify-between mb-3">
            <Text className="text-lg font-bold text-gray-800">{order.orderNo || '-'}</Text>
            <Text className={`text-sm font-medium px-3 py-1 rounded-full ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
              {STATUS_LABELS[order.status] || order.status}
            </Text>
          </View>

          <View className="space-y-2">
            <View className="flex justify-between">
              <Text className="text-gray-500 text-sm">{order._type === 'PURCHASE' ? '供应商' : '客户'}</Text>
              <Text className="text-gray-800 text-sm font-medium">{order._partner}</Text>
            </View>
            {order.warehouse?.name && (
              <View className="flex justify-between">
                <Text className="text-gray-500 text-sm">仓库</Text>
                <Text className="text-gray-800 text-sm font-medium">{order.warehouse.name}</Text>
              </View>
            )}
            <View className="flex justify-between">
              <Text className="text-gray-500 text-sm">创建时间</Text>
              <Text className="text-gray-800 text-sm">{order.createdAt ? new Date(order.createdAt).toLocaleString('zh-CN') : '-'}</Text>
            </View>
          </View>
        </View>

        {/* Order Items */}
        <View className="bg-white rounded-xl shadow-sm p-4">
          <Text className="font-bold text-gray-800 mb-3">商品明细</Text>

          {(order.items || []).length === 0 ? (
            <Text className="text-gray-400 text-center py-4">暂无商品明细</Text>
          ) : (
            (order.items || []).map((item: any, idx: number) => (
              <View key={idx} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <View className="flex-1">
                  <Text className="font-medium text-gray-800">{item.product?.name || item.productName || '-'}</Text>
                  <Text className="text-xs text-gray-400">
                    {item.quantity} x ¥{Number(item.unitCost || item.unitPrice || 0).toFixed(2)}
                  </Text>
                </View>
                <Text className="font-semibold text-gray-800">
                  ¥{((item.quantity || 0) * (item.unitCost || item.unitPrice || 0)).toFixed(2)}
                </Text>
              </View>
            ))
          )}

          <View className="flex items-center justify-between pt-3 mt-2 border-t border-gray-200">
            <Text className="font-bold text-gray-800">合计</Text>
            <Text className="text-xl font-bold text-blue-600">¥{Number(order.totalAmount || 0).toFixed(2)}</Text>
          </View>
        </View>

        {/* Remark */}
        {order.remark && (
          <View className="bg-white rounded-xl shadow-sm p-4">
            <Text className="text-sm text-gray-500 mb-1">备注</Text>
            <Text className="text-gray-800">{order.remark}</Text>
          </View>
        )}

        {/* Back Button */}
        <Button
          className="bg-gray-200 text-gray-700 rounded-xl py-3 w-full"
          onClick={() => Taro.navigateBack()}
        >
          返回
        </Button>
      </View>
    </View>
  );
}
