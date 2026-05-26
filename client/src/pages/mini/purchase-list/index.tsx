import { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import { purchasesApi } from '../../../services/purchases';
import Taro from '@tarojs/taro';

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  DRAFT: { bg: '#f5f5f4', text: '#78716c', label: '草稿' },
  CONFIRMED: { bg: '#f0f9ff', text: '#075985', label: '已确认' },
  RECEIVED: { bg: '#f0fdf4', text: '#166534', label: '已入库' },
  CANCELLED: { bg: '#fef2f2', text: '#dc2626', label: '已取消' },
};

export default function PurchaseListPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await purchasesApi.list('page=1&limit=50');
      setOrders(res.items || []);
    } catch { /* silent */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const goto = (url: string) => Taro.navigateTo({ url });

  return (
    <View style={{ backgroundColor: '#f5f5f4', minHeight: '100vh' }}>
      {/* Header */}
      <View style={{
        background: 'linear-gradient(135deg, #0f766e 0%, #0d3d3a 100%)',
        padding: '52px 20px 20px',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 2 }}>采购管理</Text>
            <Text style={{ fontSize: 22, fontWeight: 700, color: '#ffffff' }}>入库记录</Text>
          </View>
          <View
            style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, paddingLeft: 14, paddingRight: 14, paddingTop: 10, paddingBottom: 10 }}
            onClick={() => goto('/pages/mini/purchase/index')}
          >
            <Text style={{ fontSize: 13, color: '#ffffff', fontWeight: 600 }}>+ 新建</Text>
          </View>
        </View>
      </View>

      {/* List */}
      <ScrollView scrollY style={{ flex: 1, padding: 16 }}>
        {loading ? (
          <View style={{ padding: 48, alignItems: 'center' }}><Text style={{ fontSize: 13, color: '#a8a29e' }}>加载中...</Text></View>
        ) : orders.length === 0 ? (
          <View style={{ backgroundColor: '#ffffff', borderRadius: 16, padding: 48, alignItems: 'center' }}>
            <Text style={{ fontSize: 32, marginBottom: 12 }}>📦</Text>
            <Text style={{ fontSize: 14, color: '#a8a29e', marginBottom: 8 }}>暂无采购记录</Text>
            <View
              style={{ backgroundColor: '#0f766e', borderRadius: 8, paddingLeft: 20, paddingRight: 20, paddingTop: 10, paddingBottom: 10 }}
              onClick={() => goto('/pages/mini/purchase/index')}
            >
              <Text style={{ fontSize: 13, color: '#ffffff', fontWeight: 500 }}>创建第一笔采购</Text>
            </View>
          </View>
        ) : (
          orders.map((o) => {
            const st = STATUS_STYLE[o.status] || STATUS_STYLE.DRAFT;
            return (
              <View
                key={o.id}
                style={{ backgroundColor: '#ffffff', borderRadius: 14, padding: 16, marginBottom: 10 }}
                onClick={() => goto(`/pages/mini/orders/detail?id=${o.id}&type=PURCHASE`)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <Text style={{ fontSize: 14, fontWeight: 600, color: '#1c1917' }}>{o.orderNo || o.id?.slice(0, 8) || '-'}</Text>
                  <View style={{ backgroundColor: st.bg, paddingLeft: 8, paddingRight: 8, paddingTop: 3, paddingBottom: 3, borderRadius: 6 }}>
                    <Text style={{ fontSize: 11, color: st.text, fontWeight: 500 }}>{st.label}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: '#78716c' }}>{o.supplier?.name || o.supplierName || '-'}</Text>
                  <Text style={{ fontSize: 15, fontWeight: 700, color: '#1c1917' }}>¥{Number(o.totalAmount || 0).toFixed(2)}</Text>
                </View>
                {o.warehouse?.name && (
                  <Text style={{ fontSize: 11, color: '#a8a29e', marginTop: 6 }}>仓库: {o.warehouse.name}</Text>
                )}
                <Text style={{ fontSize: 11, color: '#d6d3d1', marginTop: 2 }}>
                  {o.createdAt ? new Date(o.createdAt).toLocaleString('zh-CN') : '-'}
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
