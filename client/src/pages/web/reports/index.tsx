import { useState } from 'react';
import { View, Text, Input } from '@tarojs/components';
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

  const setQuickDate = (daysAgo: number) => {
    if (daysAgo === 0) {
      setStartDate(today);
      setEndDate(today);
    } else {
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      setStartDate(d.toISOString().slice(0, 10));
      setEndDate(today);
    }
  };

  return (
    <AppShell>
      <View className="max-w-4xl mx-auto">
        <View className="mb-6">
          <Text className="page-title">报表统计</Text>
          <Text className="page-subtitle">查看业务数据概览</Text>
        </View>

        {/* Tabs */}
        <View
          className="rounded-xl p-1 mb-6 flex"
          style={{ background: '#f5f5f4' }}
        >
          {TABS.map((tab, idx) => (
            <View
              key={idx}
              className="flex-1 py-2.5 text-center text-sm font-medium rounded-lg cursor-pointer transition-all"
              style={{
                background: activeTab === idx ? '#ffffff' : 'transparent',
                color: activeTab === idx ? '#0f766e' : '#78716c',
                boxShadow: activeTab === idx ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
              onClick={() => {
                setActiveTab(idx);
                setData(null);
              }}
            >
              <Text>{tab}</Text>
            </View>
          ))}
        </View>

        {/* Date Range */}
        <View
          className="rounded-xl p-5 mb-6"
          style={{ background: '#ffffff', border: '1px solid #e7e5e4' }}
        >
          <Text className="text-sm font-semibold mb-3" style={{ color: '#292524' }}>
            {TABS[activeTab]} - 日期范围
          </Text>

          <View className="flex items-center gap-3">
            <View className="flex-1">
              <Text className="text-xs font-medium mb-1.5" style={{ color: '#78716c' }}>开始日期</Text>
              <Input
                className="input-field"
                style={{ width: '100%' }}
                placeholder="YYYY-MM-DD"
                value={startDate}
                onInput={(e) => setStartDate(e.detail.value)}
              />
            </View>
            <Text className="text-sm mt-6" style={{ color: '#a8a29e' }}>至</Text>
            <View className="flex-1">
              <Text className="text-xs font-medium mb-1.5" style={{ color: '#78716c' }}>结束日期</Text>
              <Input
                className="input-field"
                style={{ width: '100%' }}
                placeholder="YYYY-MM-DD"
                value={endDate}
                onInput={(e) => setEndDate(e.detail.value)}
              />
            </View>
            <View
              className="px-6 py-2.5 rounded-lg cursor-pointer text-sm font-medium mt-5"
              style={{ background: '#0f766e', color: 'white' }}
              onClick={loadReport}
            >
              <Text>查询</Text>
            </View>
          </View>

          {/* Quick date buttons */}
          <View className="flex gap-2 mt-4">
            {[
              { label: '今日', days: 0 },
              { label: '近7天', days: 7 },
              { label: '近30天', days: 30 },
              { label: '近90天', days: 90 },
            ].map((btn) => (
              <View
                key={btn.days}
                className="px-4 py-1.5 rounded-lg cursor-pointer text-xs font-medium"
                style={{ background: '#f5f5f4', color: '#57534e' }}
                onClick={() => setQuickDate(btn.days)}
              >
                <Text>{btn.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Results */}
        {data && (
          <View>
            {/* Summary Cards */}
            <View className="grid grid-cols-3 gap-4 mb-6">
              <View className="rounded-xl p-5" style={{ background: '#ffffff', border: '1px solid #e7e5e4' }}>
                <Text className="text-xs font-medium mb-2" style={{ color: '#a8a29e' }}>
                  {activeTab === 0 ? '采购总额' : activeTab === 1 ? '销售总额' : '总收入'}
                </Text>
                <Text className="text-2xl font-bold" style={{ color: '#0f766e' }}>
                  ¥{Number(data.totalAmount || data.totalRevenue || 0).toFixed(2)}
                </Text>
              </View>
              <View className="rounded-xl p-5" style={{ background: '#ffffff', border: '1px solid #e7e5e4' }}>
                <Text className="text-xs font-medium mb-2" style={{ color: '#a8a29e' }}>
                  {activeTab === 2 ? '总成本' : '订单数'}
                </Text>
                <Text className="text-2xl font-bold" style={{ color: '#d97706' }}>
                  {activeTab === 2 ? `¥${Number(data.totalCost || 0).toFixed(2)}` : (data.totalOrders || data.totalCount || 0)}
                </Text>
              </View>
              <View className="rounded-xl p-5" style={{ background: '#ffffff', border: '1px solid #e7e5e4' }}>
                <Text className="text-xs font-medium mb-2" style={{ color: '#a8a29e' }}>
                  {activeTab === 2 ? '利润' : '商品数'}
                </Text>
                <Text className="text-2xl font-bold" style={{ color: activeTab === 2 ? '#16a34a' : '#7c3aed' }}>
                  {activeTab === 2
                    ? `¥${Number(data.totalProfit || 0).toFixed(2)}`
                    : (data.totalItems || 0)}
                </Text>
              </View>
            </View>

            {/* Profit Rate */}
            {activeTab === 2 && data.totalRevenue && (
              <View className="rounded-xl p-5 mb-6" style={{ background: '#ffffff', border: '1px solid #e7e5e4' }}>
                <View className="flex items-center justify-between">
                  <Text className="text-sm" style={{ color: '#78716c' }}>利润率</Text>
                  <Text className="text-xl font-bold" style={{ color: '#16a34a' }}>
                    {data.totalRevenue > 0
                      ? `${((data.totalProfit || 0) / data.totalRevenue * 100).toFixed(1)}%`
                      : '0%'}
                  </Text>
                </View>
                <View className="mt-3" style={{ height: 4, background: '#f5f5f4', borderRadius: 9999 }}>
                  <View
                    style={{
                      width: data.totalRevenue > 0 ? `${Math.min(((data.totalProfit || 0) / data.totalRevenue * 100), 100)}%` : '0%',
                      height: '100%',
                      background: '#16a34a',
                      borderRadius: 9999,
                    }}
                  />
                </View>
              </View>
            )}

            {/* Detail Table */}
            <View
              className="rounded-xl overflow-hidden"
              style={{ background: '#ffffff', border: '1px solid #e7e5e4' }}
            >
              <View className="table-header">
                <Text className="flex-1">
                  {activeTab === 0 ? '供应商' : activeTab === 1 ? '客户' : '商品'}
                </Text>
                <Text className="w-24 text-right">数量</Text>
                <Text className="w-28 text-right">金额</Text>
              </View>

              {(!data.items || data.items.length === 0) ? (
                <View className="py-16 text-center">
                  <Text style={{ fontSize: 40, display: 'block' }}>📊</Text>
                  <Text className="text-base font-medium mt-3" style={{ color: '#57534e' }}>暂无报表数据</Text>
                  <Text className="text-sm mt-1" style={{ color: '#a8a29e' }}>选择一个日期范围后点击查询</Text>
                </View>
              ) : (
                <View>
                  {(data.items || []).map((item: any, idx: number) => (
                    <View
                      key={idx}
                      className="flex px-5 py-3.5 items-center text-sm"
                      style={{
                        background: idx % 2 === 0 ? '#ffffff' : '#fafaf9',
                        borderBottom: idx < data.items.length - 1 ? '1px solid #f5f5f4' : 'none',
                      }}
                    >
                      <Text className="flex-1 font-medium" style={{ color: '#292524' }}>
                        {item.name || item.productName || '-'}
                      </Text>
                      <Text className="w-24 text-right" style={{ color: '#78716c' }}>
                        {item.quantity || item.totalQuantity || 0}
                      </Text>
                      <Text className="w-28 text-right font-medium" style={{ color: '#292524' }}>
                        ¥{Number(item.amount || item.totalAmount || 0).toFixed(2)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Initial Empty State */}
        {!data && !loading && (
          <View className="py-20 text-center">
            <Text style={{ fontSize: 56, display: 'block' }}>📊</Text>
            <Text className="text-lg font-medium mt-4" style={{ color: '#57534e' }}>选择日期范围查看报表</Text>
            <Text className="text-sm mt-1" style={{ color: '#a8a29e' }}>
              选择 {TABS[activeTab]} 的起止日期并点击查询
            </Text>
          </View>
        )}
      </View>
    </AppShell>
  );
}
