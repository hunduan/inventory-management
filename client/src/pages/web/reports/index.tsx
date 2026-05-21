import { useState } from 'react';
import { View, Text, Input, Button, ScrollView } from '@tarojs/components';
import AppShell from '../../../components/layout/app-shell';
import { reportsApi } from '../../../services/reports';
import Taro from '@tarojs/taro';

const TABS = ['采购报表', '销售报表', '利润统计'];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadReport = async () => {
    if (!startDate || !endDate) {
      Taro.showToast({ title: '请选择起止日期', icon: 'none' });
      return;
    }

    setLoading(true);
    try {
      const params = `startDate=${startDate}&endDate=${endDate}`;
      let res: any;

      if (activeTab === 0) {
        res = await reportsApi.purchases(params);
      } else if (activeTab === 1) {
        res = await reportsApi.sales(params);
      } else {
        res = await reportsApi.profit(params);
      }

      // Normalize backend field names to frontend expectations
      const normalized = { ...res };
      if (res.bySupplier) normalized.items = res.bySupplier.map((s: any) => ({ name: s.supplierName, amount: s.totalAmount, quantity: s.orderCount }));
      if (res.byCustomer) normalized.items = res.byCustomer.map((c: any) => ({ name: c.customerName, amount: c.totalAmount, quantity: c.orderCount }));
      if (res.totalOrders !== undefined) normalized.totalCount = res.totalOrders;
      setData(normalized);
    } catch (err: any) {
      Taro.showToast({ title: err.message || '加载报表失败', icon: 'none' });
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <AppShell>
      <View className="max-w-4xl mx-auto">
        <Text className="text-2xl font-bold mb-6 block">报表统计</Text>

        {/* Tabs */}
        <View className="flex bg-white rounded-lg shadow mb-6 overflow-hidden">
          {TABS.map((tab, idx) => (
            <View
              key={idx}
              className={`flex-1 py-3 text-center font-medium ${activeTab === idx ? 'bg-blue-600 text-white' : 'text-gray-600 bg-white'}`}
              onClick={() => {
                setActiveTab(idx);
                setData(null);
              }}
            >
              {tab}
            </View>
          ))}
        </View>

        {/* Date Range Picker */}
        <View className="bg-white rounded-lg shadow p-4 mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-3">
            {activeTab === 0 ? '采购报表' : activeTab === 1 ? '销售报表' : '利润统计'} - 日期范围
          </Text>
          <View className="flex items-center gap-3">
            <View className="flex-1">
              <Text className="text-xs text-gray-500 mb-1">开始日期</Text>
              <Input
                className="border border-gray-300 rounded-lg px-4 py-2 w-full"
                type="text"
                placeholder="YYYY-MM-DD"
                value={startDate}
                onInput={(e) => setStartDate(e.detail.value)}
              />
            </View>
            <Text className="text-gray-400 mt-5">至</Text>
            <View className="flex-1">
              <Text className="text-xs text-gray-500 mb-1">结束日期</Text>
              <Input
                className="border border-gray-300 rounded-lg px-4 py-2 w-full"
                type="text"
                placeholder="YYYY-MM-DD"
                value={endDate}
                onInput={(e) => setEndDate(e.detail.value)}
              />
            </View>
            <Button
              className="bg-blue-600 text-white px-6 rounded-lg mt-5"
              loading={loading}
              onClick={loadReport}
            >
              查询
            </Button>
          </View>
          {/* Quick date buttons */}
          <View className="flex gap-2 mt-3">
            <Button className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded" onClick={() => { setStartDate(today); setEndDate(today); }}>今日</Button>
            <Button className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded" onClick={() => {
              const d = new Date(); d.setDate(d.getDate() - 7);
              setStartDate(d.toISOString().slice(0, 10)); setEndDate(today);
            }}>近7天</Button>
            <Button className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded" onClick={() => {
              const d = new Date(); d.setMonth(d.getMonth() - 1);
              setStartDate(d.toISOString().slice(0, 10)); setEndDate(today);
            }}>近30天</Button>
            <Button className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded" onClick={() => {
              const d = new Date(); d.setMonth(d.getMonth() - 3);
              setStartDate(d.toISOString().slice(0, 10)); setEndDate(today);
            }}>近90天</Button>
          </View>
        </View>

        {/* Report Results */}
        {data && (
          <View className="space-y-4">
            {/* Summary Cards */}
            <View className="grid grid-cols-3 gap-4">
              <View className="bg-white rounded-lg shadow p-5">
                <Text className="text-sm text-gray-500 mb-1">
                  {activeTab === 0 ? '采购总额' : activeTab === 1 ? '销售总额' : '总收入'}
                </Text>
                <Text className="text-2xl font-bold text-blue-600">
                  ¥{Number(data.totalAmount || data.totalRevenue || 0).toFixed(2)}
                </Text>
              </View>
              <View className="bg-white rounded-lg shadow p-5">
                <Text className="text-sm text-gray-500 mb-1">
                  {activeTab === 2 ? '总成本' : '订单数'}
                </Text>
                <Text className="text-2xl font-bold text-green-600">
                  {activeTab === 2 ? `¥${Number(data.totalCost || 0).toFixed(2)}` : (data.totalOrders || data.totalCount || 0)}
                </Text>
              </View>
              <View className="bg-white rounded-lg shadow p-5">
                <Text className="text-sm text-gray-500 mb-1">
                  {activeTab === 2 ? '利润' : '商品数'}
                </Text>
                <Text className={`text-2xl font-bold ${activeTab === 2 ? 'text-green-600' : 'text-indigo-600'}`}>
                  {activeTab === 2
                    ? `¥${Number(data.totalProfit || 0).toFixed(2)}`
                    : (data.totalItems || 0)}
                </Text>
              </View>
            </View>

            {/* Profit Rate (for profit report) */}
            {activeTab === 2 && data.totalRevenue && (
              <View className="bg-white rounded-lg shadow p-5">
                <View className="flex items-center justify-between">
                  <Text className="text-gray-600">利润率</Text>
                  <Text className="text-xl font-bold text-green-600">
                    {data.totalRevenue > 0
                      ? `${((data.totalProfit || 0) / data.totalRevenue * 100).toFixed(1)}%`
                      : '0%'}
                  </Text>
                </View>
              </View>
            )}

            {/* Detailed List */}
            <View className="bg-white rounded-lg shadow overflow-hidden">
              <View className="flex p-4 bg-gray-50 font-bold text-sm border-b">
                <Text className="flex-1">
                  {activeTab === 0 ? '供应商' : activeTab === 1 ? '客户' : '商品'}
                </Text>
                <Text className="w-24 text-right">数量</Text>
                <Text className="w-28 text-right">金额</Text>
              </View>
              {(data.items || []).length === 0 ? (
                <View className="p-6 text-center text-gray-400">
                  <Text>暂无报表数据</Text>
                </View>
              ) : (
                (data.items || []).map((item: any, idx: number) => (
                  <View key={idx} className="flex p-4 border-b border-gray-100 items-center text-sm">
                    <Text className="flex-1 text-gray-800">{item.name || item.productName || '-'}</Text>
                    <Text className="w-24 text-right text-gray-600">{item.quantity || item.totalQuantity || 0}</Text>
                    <Text className="w-28 text-right text-gray-800 font-medium">
                      ¥{Number(item.amount || item.totalAmount || 0).toFixed(2)}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View>
        )}
      </View>
    </AppShell>
  );
}
