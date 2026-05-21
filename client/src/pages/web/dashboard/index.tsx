import { useState, useEffect } from 'react';
import { View, Text, Button } from '@tarojs/components';
import AppShell from '../../../components/layout/app-shell';
import { purchasesApi } from '../../../services/purchases';
import { salesApi } from '../../../services/sales';
import { inventoryApi } from '../../../services/inventory';
import { reportsApi } from '../../../services/reports';
import Taro from '@tarojs/taro';

interface SummaryData {
  todaySales: number;
  todayPurchases: number;
  lowStockCount: number;
}

export default function DashboardPage() {
  const [userName, setUserName] = useState('');
  const [summary, setSummary] = useState<SummaryData>({ todaySales: 0, todayPurchases: 0, lowStockCount: 0 });
  const [recentPurchases, setRecentPurchases] = useState<any[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const userInfo = Taro.getStorageSync('user');
      if (userInfo) {
        setUserName(userInfo.name || userInfo.email || '用户');
      }
    } catch {
      setUserName('用户');
    }
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().slice(0, 10);

      const [purchasesRes, salesRes, alertsRes] = await Promise.all([
        purchasesApi.list(`page=1&limit=5`),
        salesApi.list(`page=1&limit=5`),
        inventoryApi.alerts(10),
      ]);

      setRecentPurchases(purchasesRes.items || []);
      setRecentSales(salesRes.items || []);

      const lowStockItems = alertsRes.items || [];
      setSummary({
        todaySales: 0,
        todayPurchases: 0,
        lowStockCount: lowStockItems.length,
      });

      // Try to get today's summary from reports if available
      try {
        const salesReport = await reportsApi.sales(`startDate=${today}&endDate=${today}&page=1&limit=1`);
        const purchaseReport = await reportsApi.purchases(`startDate=${today}&endDate=${today}&page=1&limit=1`);
        setSummary({
          todaySales: salesReport.totalAmount || 0,
          todayPurchases: purchaseReport.totalAmount || 0,
          lowStockCount: lowStockItems.length,
        });
      } catch {
        // Reports may not be available yet; keep placeholder data
      }
    } catch (err: any) {
      Taro.showToast({ title: err.message || '加载数据失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboard(); }, []);

  return (
    <AppShell>
      {/* Welcome */}
      <View className="mb-6">
        <Text className="text-2xl font-bold">欢迎回来，{userName}</Text>
        <Text className="text-gray-500 mt-1 block">以下是今日概况</Text>
      </View>

      {/* Summary Cards */}
      <View className="grid grid-cols-3 gap-4 mb-6">
        <View className="bg-white rounded-xl shadow p-5">
          <Text className="text-sm text-gray-500 mb-1">今日销售</Text>
          <Text className="text-2xl font-bold text-blue-600">¥{summary.todaySales.toFixed(2)}</Text>
        </View>
        <View className="bg-white rounded-xl shadow p-5">
          <Text className="text-sm text-gray-500 mb-1">今日采购</Text>
          <Text className="text-2xl font-bold text-green-600">¥{summary.todayPurchases.toFixed(2)}</Text>
        </View>
        <View className="bg-white rounded-xl shadow p-5">
          <Text className="text-sm text-gray-500 mb-1">低库存预警</Text>
          <Text className={`text-2xl font-bold ${summary.lowStockCount > 0 ? 'text-red-600' : 'text-gray-600'}`}>
            {summary.lowStockCount}
          </Text>
        </View>
      </View>

      {/* Recent Purchases */}
      <View className="bg-white rounded-lg shadow mb-6">
        <View className="flex items-center justify-between p-4 border-b">
          <Text className="font-bold text-lg">最近采购订单</Text>
          <Button className="text-sm text-blue-600 bg-transparent" onClick={() => Taro.navigateTo({ url: '/pages/web/purchases/index' })}>查看全部</Button>
        </View>
        {recentPurchases.length === 0 ? (
          <View className="p-6 text-center text-gray-400">
            <Text>暂无采购记录</Text>
          </View>
        ) : (
          recentPurchases.map((o) => (
            <View key={o.id} className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-gray-50">
              <View>
                <Text className="font-medium">{o.orderNo || '-'}</Text>
                <Text className="text-sm text-gray-500 block">{o.supplier?.name || o.supplierName || '-'}</Text>
              </View>
              <Text className="font-semibold">¥{Number(o.totalAmount || 0).toFixed(2)}</Text>
            </View>
          ))
        )}
      </View>

      {/* Recent Sales */}
      <View className="bg-white rounded-lg shadow">
        <View className="flex items-center justify-between p-4 border-b">
          <Text className="font-bold text-lg">最近销售订单</Text>
          <Button className="text-sm text-blue-600 bg-transparent" onClick={() => Taro.navigateTo({ url: '/pages/web/sales/index' })}>查看全部</Button>
        </View>
        {recentSales.length === 0 ? (
          <View className="p-6 text-center text-gray-400">
            <Text>暂无销售记录</Text>
          </View>
        ) : (
          recentSales.map((o) => (
            <View key={o.id} className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-gray-50">
              <View>
                <Text className="font-medium">{o.orderNo || '-'}</Text>
                <Text className="text-sm text-gray-500 block">{o.customer?.name || o.customerName || '-'}</Text>
              </View>
              <Text className="font-semibold">¥{Number(o.totalAmount || 0).toFixed(2)}</Text>
            </View>
          ))
        )}
      </View>
    </AppShell>
  );
}
