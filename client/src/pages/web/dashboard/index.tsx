import { useState, useEffect } from 'react';
import { View, Text } from '@tarojs/components';
import AppShell from '../../../components/layout/app-shell';
import { purchasesApi } from '../../../services/purchases';
import { salesApi } from '../../../services/sales';
import { inventoryApi } from '../../../services/inventory';
import { reportsApi } from '../../../services/reports';
import Taro from '@tarojs/taro';
import KpiCard from '../../../components/ui/KpiCard';
import EmptyState from '../../../components/ui/EmptyState';

export default function DashboardPage() {
  const [userName, setUserName] = useState('');
  const [summary, setSummary] = useState({ todaySales: 0, todayPurchases: 0, lowStockCount: 0 });
  const [recentPurchases, setRecentPurchases] = useState<any[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const userInfo = Taro.getStorageSync('user');
      if (userInfo) setUserName(userInfo.name || userInfo.email || '用户');
    } catch { setUserName('用户'); }
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const [purchasesRes, salesRes, alertsRes] = await Promise.all([
        purchasesApi.list('page=1&limit=5'),
        salesApi.list('page=1&limit=5'),
        inventoryApi.alerts(10),
      ]);

      setRecentPurchases(purchasesRes.items || []);
      setRecentSales(salesRes.items || []);
      const lowStockItems = Array.isArray(alertsRes) ? alertsRes : [];
      setSummary(s => ({ ...s, lowStockCount: lowStockItems.length }));

      try {
        const [salesReport, purchaseReport] = await Promise.all([
          reportsApi.sales(`startDate=${today}&endDate=${today}&page=1&limit=1`),
          reportsApi.purchases(`startDate=${today}&endDate=${today}&page=1&limit=1`),
        ]);
        setSummary({
          todaySales: salesReport.totalAmount || 0,
          todayPurchases: purchaseReport.totalAmount || 0,
          lowStockCount: lowStockItems.length,
        });
      } catch { /* reports optional */ }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboard(); }, []);

  const QuickAction = ({ label, path }: { label: string; path: string }) => (
    <View
      className="card px-4 py-3 cursor-pointer"
      style={{ borderLeft: '3px solid #0f766e' }}
      onClick={() => Taro.navigateTo({ url: path })}
    >
      <Text className="text-sm font-medium" style={{ color: '#1c1917' }}>{label}</Text>
    </View>
  );

  return (
    <AppShell>
      {/* Header */}
      <View className="flex items-center justify-between mb-6">
        <View>
          <Text className="text-xl font-bold" style={{ color: '#1c1917' }}>首页</Text>
          <Text className="text-sm mt-0.5" style={{ color: '#a8a29e' }}>
            {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </Text>
        </View>
        <Text className="text-sm" style={{ color: '#78716c' }}>欢迎回来，{userName}</Text>
      </View>

      {/* Quick Actions Row */}
      <View className="flex gap-3 mb-6" style={{ flexDirection: 'row' }}>
        <View style={{ flex: 1 }}><QuickAction label="+ 新建采购" path="/pages/web/purchases/new" /></View>
        <View style={{ flex: 1 }}><QuickAction label="+ 新建销售" path="/pages/web/sales/new" /></View>
        <View style={{ flex: 1 }}><QuickAction label="+ 新增商品" path="/pages/web/products/new" /></View>
        <View style={{ flex: 1 }}><QuickAction label="库存查看" path="/pages/web/inventory/index" /></View>
      </View>

      {/* KPI Cards */}
      <View className="flex gap-4 mb-8" style={{ flexDirection: 'row' }}>
        <View style={{ flex: 1 }}>
          <KpiCard label="今日销售" value={`¥${summary.todaySales.toFixed(2)}`} color="#1c1917" />
        </View>
        <View style={{ flex: 1 }}>
          <KpiCard label="今日采购" value={`¥${summary.todayPurchases.toFixed(2)}`} color="#1c1917" />
        </View>
        <View style={{ flex: 1 }}>
          <KpiCard
            label="低库存预警"
            value={`${summary.lowStockCount}`}
            color={summary.lowStockCount > 0 ? '#dc2626' : '#16a34a'}
            subtitle={summary.lowStockCount > 0 ? '需要补货' : '库存充足'}
          />
        </View>
      </View>

      {/* Recent Orders */}
      <View className="flex gap-6" style={{ flexDirection: 'row' }}>
        {/* Purchases */}
        <View className="card" style={{ flex: 1 }}>
          <View className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #f5f5f4' }}>
            <Text className="font-semibold" style={{ color: '#1c1917' }}>最近采购</Text>
            <Text
              className="text-sm cursor-pointer"
              style={{ color: '#78716c' }}
              onClick={() => Taro.navigateTo({ url: '/pages/web/purchases/index' })}
            >
              查看全部 →
            </Text>
          </View>
          {recentPurchases.length === 0 ? (
            <EmptyState message="暂无采购记录" />
          ) : (
            recentPurchases.map((o, idx) => (
              <View
                key={o.id}
                className="flex items-center justify-between px-5 py-3"
                style={{ borderBottom: idx < recentPurchases.length - 1 ? '1px solid #f5f5f4' : 'none' }}
              >
                <View>
                  <Text className="text-sm font-medium" style={{ color: '#1c1917' }}>{o.orderNo || '-'}</Text>
                  <Text className="text-xs mt-0.5" style={{ color: '#a8a29e' }}>{o.supplier?.name || o.supplierName || '-'}</Text>
                </View>
                <Text className="text-sm font-semibold" style={{ color: '#1c1917' }}>¥{Number(o.totalAmount || 0).toFixed(2)}</Text>
              </View>
            ))
          )}
        </View>

        {/* Sales */}
        <View className="card" style={{ flex: 1 }}>
          <View className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #f5f5f4' }}>
            <Text className="font-semibold" style={{ color: '#1c1917' }}>最近销售</Text>
            <Text
              className="text-sm cursor-pointer"
              style={{ color: '#78716c' }}
              onClick={() => Taro.navigateTo({ url: '/pages/web/sales/index' })}
            >
              查看全部 →
            </Text>
          </View>
          {recentSales.length === 0 ? (
            <EmptyState message="暂无销售记录" />
          ) : (
            recentSales.map((o, idx) => (
              <View
                key={o.id}
                className="flex items-center justify-between px-5 py-3"
                style={{ borderBottom: idx < recentSales.length - 1 ? '1px solid #f5f5f4' : 'none' }}
              >
                <View>
                  <Text className="text-sm font-medium" style={{ color: '#1c1917' }}>{o.orderNo || '-'}</Text>
                  <Text className="text-xs mt-0.5" style={{ color: '#a8a29e' }}>{o.customer?.name || o.customerName || '-'}</Text>
                </View>
                <Text className="text-sm font-semibold" style={{ color: '#1c1917' }}>¥{Number(o.totalAmount || 0).toFixed(2)}</Text>
              </View>
            ))
          )}
        </View>
      </View>
    </AppShell>
  );
}
