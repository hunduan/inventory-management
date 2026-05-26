import { useEffect, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import { purchasesApi } from '../../../services/purchases';
import { salesApi } from '../../../services/sales';
import Taro from '@tarojs/taro';

export default function MiniIndexPage() {
  const [recentPurchases, setRecentPurchases] = useState<any[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [pr, sr] = await Promise.all([
          purchasesApi.list('page=1&limit=5'),
          salesApi.list('page=1&limit=5'),
        ]);
        setRecentPurchases((pr.items || []).map((o: any) => ({ ...o, _type: 'PURCHASE', _partner: o.supplier?.name || o.supplierName || '-' })));
        setRecentSales((sr.items || []).map((o: any) => ({ ...o, _type: 'SALE', _partner: o.customer?.name || o.customerName || '-' })));
      } catch { /* silent */ }
    };
    loadData();
  }, []);

  const goto = (url: string) => Taro.navigateTo({ url });

  const today = new Date();
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const STATUS_TAG: Record<string, { label: string; bg: string; text: string }> = {
    DRAFT: { label: '草稿', bg: '#f5f5f4', text: '#78716c' },
    RECEIVED: { label: '已入库', bg: '#f0fdf4', text: '#166534' },
    DELIVERED: { label: '已出库', bg: '#f0fdf4', text: '#166534' },
    CANCELLED: { label: '已取消', bg: '#fef2f2', text: '#dc2626' },
  };

  return (
    <ScrollView scrollY style={{ backgroundColor: '#f5f5f4', minHeight: '100vh' }}>
      {/* Header */}
      <View style={{
        background: 'linear-gradient(135deg, #0f766e 0%, #0d3d3a 100%)',
        padding: '48px 16px 20px',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
      }}>
        <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 2 }}>
          {today.getFullYear()}年{today.getMonth() + 1}月{today.getDate()}日 星期{weekDays[today.getDay()]}
        </Text>
        <Text style={{ fontSize: 22, fontWeight: 700, color: '#ffffff' }}>
          库存管理
        </Text>
      </View>

      {/* 今日操作 */}
      <View style={{ paddingLeft: 12, paddingRight: 12, marginTop: 16, marginBottom: 16 }}>
        <Text style={{ fontSize: 14, fontWeight: 600, color: '#1c1917', marginBottom: 10, marginLeft: 4 }}>今日操作</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[
            { label: '采购入库', icon: '📥', path: '/pages/mini/purchase/index', color: '#0f766e', bg: '#f0fdfa' },
            { label: '销售出库', icon: '📤', path: '/pages/mini/sale/index', color: '#d97706', bg: '#fffbeb' },
            { label: '库存查询', icon: '📊', path: '/pages/mini/inventory/index', color: '#075985', bg: '#f0f9ff' },
            { label: '库存调拨', icon: '🔄', path: '/pages/mini/transfers/index', color: '#7c3aed', bg: '#f5f3ff' },
          ].map((item) => (
            <View
              key={item.path}
              style={{ flex: 1, backgroundColor: '#ffffff', borderRadius: 12, padding: '14px 6px', alignItems: 'center' }}
              onClick={() => goto(item.path)}
            >
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: item.bg, alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                <Text style={{ fontSize: 18 }}>{item.icon}</Text>
              </View>
              <Text style={{ fontSize: 12, fontWeight: 600, color: '#1c1917' }}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 快速访问 */}
      <View style={{ paddingLeft: 12, paddingRight: 12, marginBottom: 16 }}>
        <Text style={{ fontSize: 14, fontWeight: 600, color: '#1c1917', marginBottom: 10, marginLeft: 4 }}>快速访问</Text>
        <View style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: '10px 8px' }}>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {[
              { label: '扫码', icon: '📱', path: '/pages/mini/scan/index', bg: '#f0fdfa' },
              { label: '语音', icon: '🎤', path: '/pages/mini/voice/index', bg: '#fffbeb' },
              { label: '拍照', icon: '📷', path: '/pages/mini/photo/index', bg: '#f0f9ff' },
              { label: '商品', icon: '🏷️', path: '/pages/mini/products/index', bg: '#f5f3ff' },
              { label: '订单', icon: '📋', path: '/pages/mini/orders/list', bg: '#fef2f2' },
            ].map((item) => (
              <View
                key={item.path}
                style={{ flex: 1, alignItems: 'center', paddingTop: 6, paddingBottom: 6 }}
                onClick={() => goto(item.path)}
              >
                <View style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: item.bg, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                  <Text style={{ fontSize: 16 }}>{item.icon}</Text>
                </View>
                <Text style={{ fontSize: 11, color: '#78716c' }}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* 最近订单 */}
      <View style={{ paddingLeft: 12, paddingRight: 12, paddingBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text style={{ fontSize: 14, fontWeight: 600, color: '#1c1917' }}>最近采购</Text>
          <Text style={{ fontSize: 11, color: '#0f766e' }} onClick={() => goto('/pages/mini/purchase-list/index')}>全部 →</Text>
        </View>
        {recentPurchases.length === 0 ? (
          <View style={{ backgroundColor: '#ffffff', borderRadius: 10, padding: 20, alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 12, color: '#a8a29e' }}>暂无采购订单</Text>
          </View>
        ) : (
          recentPurchases.slice(0, 3).map((o) => {
            const st = STATUS_TAG[o.status] || STATUS_TAG.DRAFT;
            return (
              <View
                key={o.id}
                style={{ backgroundColor: '#ffffff', borderRadius: 10, padding: 12, marginBottom: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                onClick={() => goto(`/pages/mini/orders/detail?id=${o.id}&type=PURCHASE`)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: 500, color: '#1c1917', marginBottom: 1 }}>{o.orderNo || o.id?.slice(0, 8) || '-'}</Text>
                  <Text style={{ fontSize: 11, color: '#a8a29e' }}>{o._partner}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 13, fontWeight: 600, color: '#1c1917', marginBottom: 2 }}>¥{Number(o.totalAmount || 0).toFixed(2)}</Text>
                  <View style={{ backgroundColor: st.bg, paddingLeft: 6, paddingRight: 6, paddingTop: 2, paddingBottom: 2, borderRadius: 4 }}>
                    <Text style={{ fontSize: 10, color: st.text, fontWeight: 500 }}>{st.label}</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, marginTop: 4 }}>
          <Text style={{ fontSize: 14, fontWeight: 600, color: '#1c1917' }}>最近销售</Text>
          <Text style={{ fontSize: 11, color: '#0f766e' }} onClick={() => goto('/pages/mini/sale-list/index')}>全部 →</Text>
        </View>
        {recentSales.length === 0 ? (
          <View style={{ backgroundColor: '#ffffff', borderRadius: 10, padding: 20, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#a8a29e' }}>暂无销售订单</Text>
          </View>
        ) : (
          recentSales.slice(0, 3).map((o) => {
            const st = STATUS_TAG[o.status] || STATUS_TAG.DRAFT;
            return (
              <View
                key={o.id}
                style={{ backgroundColor: '#ffffff', borderRadius: 10, padding: 12, marginBottom: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                onClick={() => goto(`/pages/mini/orders/detail?id=${o.id}&type=SALE`)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: 500, color: '#1c1917', marginBottom: 1 }}>{o.orderNo || o.id?.slice(0, 8) || '-'}</Text>
                  <Text style={{ fontSize: 11, color: '#a8a29e' }}>{o._partner}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 13, fontWeight: 600, color: '#1c1917', marginBottom: 2 }}>¥{Number(o.totalAmount || 0).toFixed(2)}</Text>
                  <View style={{ backgroundColor: st.bg, paddingLeft: 6, paddingRight: 6, paddingTop: 2, paddingBottom: 2, borderRadius: 4 }}>
                    <Text style={{ fontSize: 10, color: st.text, fontWeight: 500 }}>{st.label}</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}
