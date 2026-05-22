import { useState, useEffect } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
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

const QUICK_ACTIONS = [
  { label: '新建采购', icon: '📥', color: '#0f766e', bg: '#f0fdfa', path: '/pages/web/purchases/new' },
  { label: '新建销售', icon: '📤', color: '#d97706', bg: '#fffbeb', path: '/pages/web/sales/new' },
  { label: '库存查看', icon: '📋', color: '#0284c7', bg: '#f0f9ff', path: '/pages/web/inventory/index' },
  { label: '新增商品', icon: '🏷️', color: '#7c3aed', bg: '#f5f3ff', path: '/pages/web/products/new' },
];

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
        purchasesApi.list('page=1&limit=5'),
        salesApi.list('page=1&limit=5'),
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

      try {
        const salesReport = await reportsApi.sales(`startDate=${today}&endDate=${today}&page=1&limit=1`);
        const purchaseReport = await reportsApi.purchases(`startDate=${today}&endDate=${today}&page=1&limit=1`);
        setSummary({
          todaySales: salesReport.totalAmount || 0,
          todayPurchases: purchaseReport.totalAmount || 0,
          lowStockCount: lowStockItems.length,
        });
      } catch {
        // Reports not available
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
      {/* Welcome Section */}
      <View
        className="rounded-2xl p-6 mb-8"
        style={{
          background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative dots */}
        <View style={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 160,
          height: 160,
          borderRadius: 9999,
          background: 'rgba(255,255,255,0.06)',
        }} />
        <View style={{
          position: 'absolute',
          bottom: -40,
          right: 40,
          width: 100,
          height: 100,
          borderRadius: 9999,
          background: 'rgba(255,255,255,0.04)',
        }} />

        <View className="relative" style={{ zIndex: 1 }}>
          <Text className="text-xl font-bold text-white" style={{ letterSpacing: '-0.02em' }}>
            欢迎回来，{userName}
          </Text>
          <Text className="text-base mt-1" style={{ color: 'rgba(255,255,255,0.75)' }}>
            {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </Text>
        </View>
      </View>

      {/* Quick Actions */}
      <Text className="text-sm font-semibold mb-3" style={{ color: '#78716c', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: 11 }}>
        快捷操作
      </Text>
      <View
        className="rounded-2xl p-4 mb-8"
        style={{ background: '#ffffff', border: '1px solid #e7e5e4' }}
      >
        <View className="grid grid-cols-4 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <View
              key={action.path}
              className="flex flex-col items-center gap-2 cursor-pointer rounded-xl py-4 px-2"
              style={{
                transition: 'all 0.2s ease',
                background: action.bg,
              }}
              hoverClass="none"
              onMouseEnter={(e: any) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
              }}
              onMouseLeave={(e: any) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              onClick={() => Taro.navigateTo({ url: action.path })}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  border: '1px solid rgba(0,0,0,0.04)',
                }}
              >
                <Text>{action.icon}</Text>
              </View>
              <Text className="text-xs font-medium" style={{ color: '#57534e' }}>
                {action.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Summary Cards */}
      <Text className="text-sm font-semibold mb-3" style={{ color: '#78716c', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: 11 }}>
        今日概况
      </Text>
      <View className="grid grid-cols-3 gap-4 mb-8">
        <View
          className="rounded-xl p-5"
          style={{ background: '#ffffff', border: '1px solid #e7e5e4' }}
        >
          <View className="flex items-center justify-between mb-3">
            <Text className="text-xs font-medium" style={{ color: '#a8a29e' }}>今日销售</Text>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: '#f0fdfa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 14 }}>📈</Text>
            </View>
          </View>
          <Text className="text-2xl font-bold" style={{ color: '#0f766e' }}>
            ¥{summary.todaySales.toFixed(2)}
          </Text>
          <View className="mt-2" style={{ height: 3, background: '#f0fdfa', borderRadius: 9999 }}>
            <View style={{ width: '60%', height: '100%', background: '#14b8a6', borderRadius: 9999 }} />
          </View>
        </View>

        <View
          className="rounded-xl p-5"
          style={{ background: '#ffffff', border: '1px solid #e7e5e4' }}
        >
          <View className="flex items-center justify-between mb-3">
            <Text className="text-xs font-medium" style={{ color: '#a8a29e' }}>今日采购</Text>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: '#fffbeb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 14 }}>📦</Text>
            </View>
          </View>
          <Text className="text-2xl font-bold" style={{ color: '#d97706' }}>
            ¥{summary.todayPurchases.toFixed(2)}
          </Text>
          <View className="mt-2" style={{ height: 3, background: '#fffbeb', borderRadius: 9999 }}>
            <View style={{ width: '45%', height: '100%', background: '#f59e0b', borderRadius: 9999 }} />
          </View>
        </View>

        <View
          className="rounded-xl p-5"
          style={{ background: '#ffffff', border: '1px solid #e7e5e4' }}
        >
          <View className="flex items-center justify-between mb-3">
            <Text className="text-xs font-medium" style={{ color: '#a8a29e' }}>低库存预警</Text>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: summary.lowStockCount > 0 ? '#fef2f2' : '#f0fdf4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 14 }}>{summary.lowStockCount > 0 ? '⚠️' : '✅'}</Text>
            </View>
          </View>
          <Text
            className="text-2xl font-bold"
            style={{ color: summary.lowStockCount > 0 ? '#dc2626' : '#16a34a' }}
          >
            {summary.lowStockCount}
          </Text>
          <Text className="text-xs mt-2" style={{ color: '#a8a29e' }}>
            {summary.lowStockCount > 0 ? '需要补货' : '库存充足'}
          </Text>
        </View>
      </View>

      {/* Recent Orders */}
      <View className="grid grid-cols-2 gap-6">
        {/* Recent Purchases */}
        <View
          className="rounded-xl overflow-hidden"
          style={{ background: '#ffffff', border: '1px solid #e7e5e4' }}
        >
          <View
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid #f5f5f4' }}
          >
            <View className="flex items-center gap-2">
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 9999,
                  background: '#0f766e',
                }}
              />
              <Text className="font-semibold text-base" style={{ color: '#292524' }}>最近采购</Text>
            </View>
            <Text
              className="text-sm cursor-pointer"
              style={{ color: '#0f766e', fontWeight: 500 }}
              onClick={() => Taro.navigateTo({ url: '/pages/web/purchases/index' })}
            >
              查看全部 →
            </Text>
          </View>

          {recentPurchases.length === 0 ? (
            <View className="py-12 text-center">
              <Text style={{ fontSize: 32, display: 'block' }}>📭</Text>
              <Text className="text-sm mt-2" style={{ color: '#a8a29e' }}>暂无采购记录</Text>
            </View>
          ) : (
            recentPurchases.map((o, idx) => (
              <View
                key={o.id}
                className="flex items-center justify-between px-5 py-3.5"
                style={{ borderBottom: idx < recentPurchases.length - 1 ? '1px solid #f5f5f4' : 'none' }}
              >
                <View className="flex-1 min-w-0">
                  <Text className="text-sm font-medium" style={{ color: '#292524' }} numberOfLines={1}>
                    {o.orderNo || '-'}
                  </Text>
                  <Text className="text-xs mt-0.5" style={{ color: '#a8a29e' }} numberOfLines={1}>
                    {o.supplier?.name || o.supplierName || '-'}
                  </Text>
                </View>
                <Text className="text-sm font-semibold" style={{ color: '#0f766e' }}>
                  ¥{Number(o.totalAmount || 0).toFixed(2)}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Recent Sales */}
        <View
          className="rounded-xl overflow-hidden"
          style={{ background: '#ffffff', border: '1px solid #e7e5e4' }}
        >
          <View
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid #f5f5f4' }}
          >
            <View className="flex items-center gap-2">
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 9999,
                  background: '#d97706',
                }}
              />
              <Text className="font-semibold text-base" style={{ color: '#292524' }}>最近销售</Text>
            </View>
            <Text
              className="text-sm cursor-pointer"
              style={{ color: '#0f766e', fontWeight: 500 }}
              onClick={() => Taro.navigateTo({ url: '/pages/web/sales/index' })}
            >
              查看全部 →
            </Text>
          </View>

          {recentSales.length === 0 ? (
            <View className="py-12 text-center">
              <Text style={{ fontSize: 32, display: 'block' }}>📭</Text>
              <Text className="text-sm mt-2" style={{ color: '#a8a29e' }}>暂无销售记录</Text>
            </View>
          ) : (
            recentSales.map((o, idx) => (
              <View
                key={o.id}
                className="flex items-center justify-between px-5 py-3.5"
                style={{ borderBottom: idx < recentSales.length - 1 ? '1px solid #f5f5f4' : 'none' }}
              >
                <View className="flex-1 min-w-0">
                  <Text className="text-sm font-medium" style={{ color: '#292524' }} numberOfLines={1}>
                    {o.orderNo || '-'}
                  </Text>
                  <Text className="text-xs mt-0.5" style={{ color: '#a8a29e' }} numberOfLines={1}>
                    {o.customer?.name || o.customerName || '-'}
                  </Text>
                </View>
                <Text className="text-sm font-semibold" style={{ color: '#d97706' }}>
                  ¥{Number(o.totalAmount || 0).toFixed(2)}
                </Text>
              </View>
            ))
          )}
        </View>
      </View>
    </AppShell>
  );
}
