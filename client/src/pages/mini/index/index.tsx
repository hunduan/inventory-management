import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import { purchasesApi } from '../../../services/purchases';
import Taro from '@tarojs/taro';

export default function MiniIndexPage() {
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const res = await purchasesApi.list('page=1&limit=5');
        setRecentOrders(res.items || []);
      } catch {
        // Ignore errors on home page
      }
    };
    loadOrders();
  }, []);

  const goto = (url: string) => Taro.navigateTo({ url });

  return (
    <ScrollView className="min-h-screen bg-gray-50">
      {/* Header */}
      <View className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 pt-12 pb-8">
        <Text className="text-white text-2xl font-bold">进销存</Text>
        <Text className="text-blue-100 text-sm mt-1">快速管理您的库存</Text>
      </View>

      {/* Quick Action Cards */}
      <View className="flex flex-row justify-around -mt-6 px-4">
        <View className="bg-white rounded-2xl shadow-lg p-4 flex-1 mx-1 items-center" onClick={() => goto('/pages/mini/photo/index')}>
          <View className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-2">
            <Text className="text-3xl">📷</Text>
          </View>
          <Text className="text-sm font-medium text-gray-700">拍照入库</Text>
        </View>
        <View className="bg-white rounded-2xl shadow-lg p-4 flex-1 mx-1 items-center" onClick={() => goto('/pages/mini/voice/index')}>
          <View className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-2">
            <Text className="text-3xl">🎤</Text>
          </View>
          <Text className="text-sm font-medium text-gray-700">语音录入</Text>
        </View>
        <View className="bg-white rounded-2xl shadow-lg p-4 flex-1 mx-1 items-center" onClick={() => goto('/pages/mini/scan/index')}>
          <View className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mb-2">
            <Text className="text-3xl">📱</Text>
          </View>
          <Text className="text-sm font-medium text-gray-700">扫一扫</Text>
        </View>
      </View>

      {/* Quick Operation Buttons */}
      <View className="px-4 mt-6 space-y-3">
        <View className="bg-white rounded-xl shadow-sm p-4 flex items-center" onClick={() => goto('/pages/mini/purchase/index')}>
          <View className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
            <Text className="text-xl">📥</Text>
          </View>
          <View className="flex-1">
            <Text className="font-medium text-gray-800">快速入库</Text>
            <Text className="text-xs text-gray-400">快捷创建采购入库单</Text>
          </View>
          <Text className="text-gray-300 text-lg">{'>'}</Text>
        </View>
        <View className="bg-white rounded-xl shadow-sm p-4 flex items-center" onClick={() => goto('/pages/mini/sale/index')}>
          <View className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
            <Text className="text-xl">📤</Text>
          </View>
          <View className="flex-1">
            <Text className="font-medium text-gray-800">快速出库</Text>
            <Text className="text-xs text-gray-400">快捷创建销售出库单</Text>
          </View>
          <Text className="text-gray-300 text-lg">{'>'}</Text>
        </View>
        <View className="bg-white rounded-xl shadow-sm p-4 flex items-center" onClick={() => goto('/pages/web/inventory/index')}>
          <View className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
            <Text className="text-xl">📋</Text>
          </View>
          <View className="flex-1">
            <Text className="font-medium text-gray-800">库存查询</Text>
            <Text className="text-xs text-gray-400">查看当前库存情况</Text>
          </View>
          <Text className="text-gray-300 text-lg">{'>'}</Text>
        </View>
      </View>

      {/* Recent Orders */}
      <View className="mt-6 px-4 pb-8">
        <View className="flex items-center justify-between mb-3">
          <Text className="text-lg font-bold text-gray-800">最近采购订单</Text>
          <Button className="text-sm text-blue-600 bg-transparent" onClick={() => goto('/pages/mini/orders/list')}>查看全部</Button>
        </View>
        {recentOrders.length === 0 ? (
          <View className="bg-white rounded-xl p-8 text-center">
            <Text className="text-4xl mb-2">📦</Text>
            <Text className="text-gray-400">暂无订单</Text>
          </View>
        ) : (
          recentOrders.map((o) => (
            <View key={o.id} className="bg-white rounded-xl shadow-sm p-4 mb-3 flex items-center justify-between" onClick={() => goto(`/pages/mini/orders/detail?id=${o.id}`)}>
              <View>
                <Text className="font-medium text-gray-800">{o.orderNo || '-'}</Text>
                <Text className="text-xs text-gray-400 mt-1">{o.supplier?.name || o.supplierName || '-'}</Text>
              </View>
              <View className="items-end">
                <Text className="font-semibold text-gray-800">¥{Number(o.totalAmount || 0).toFixed(2)}</Text>
                <Text className="text-xs text-gray-400 mt-1">{o.status === 'DRAFT' ? '草稿' : o.status === 'CONFIRMED' ? '已确认' : o.status === 'RECEIVED' ? '已入库' : '已取消'}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
