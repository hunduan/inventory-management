import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import { salesApi } from '../../../services/sales';
import Taro from '@tarojs/taro';

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  DRAFT: { bg: '#f5f5f4', text: '#78716c', label: '草稿' },
  CONFIRMED: { bg: '#f0f9ff', text: '#075985', label: '已确认' },
  DELIVERED: { bg: '#f0fdf4', text: '#166534', label: '已出库' },
  CANCELLED: { bg: '#fef2f2', text: '#dc2626', label: '已取消' },
};

export default function SaleListPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await salesApi.list('page=1&limit=50');
      const items = res.items || [];
      setOrders(items);
      const single = items.find((o: any) => (o.items || []).length === 1);
      if (single) setExpandedId(single.id);
    } catch { /* silent */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const goto = (url: string) => Taro.navigateTo({ url });

  const filteredOrders = orders.filter((o: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      o.orderNo?.toLowerCase().includes(s) ||
      o.customer?.name?.toLowerCase().includes(s) ||
      o.warehouse?.name?.toLowerCase().includes(s) ||
      (o.items || []).some((i: any) => i.product?.name?.toLowerCase().includes(s))
    );
  });

  return (
    <View style={{ backgroundColor: '#f5f5f4', minHeight: '100vh' }}>
      <View style={{
        background: 'linear-gradient(135deg, #0f766e 0%, #0d3d3a 100%)',
        padding: '52px 20px 20px',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 2 }}>销售管理</Text>
            <Text style={{ fontSize: 22, fontWeight: 700, color: '#ffffff' }}>出库记录</Text>
          </View>
          <View
            style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, paddingLeft: 14, paddingRight: 14, paddingTop: 10, paddingBottom: 10 }}
            onClick={() => goto('/pages/mini/sale/index')}
          >
            <Text style={{ fontSize: 13, color: '#ffffff', fontWeight: 600 }}>+ 新建</Text>
          </View>
        </View>
      </View>

      <View style={{ padding: 16, paddingBottom: 0 }}>
        <View style={{ backgroundColor: '#ffffff', borderRadius: 10, paddingLeft: 14, paddingRight: 14, paddingTop: 2, paddingBottom: 2, flexDirection: 'row', alignItems: 'center' }}>
          <Input
            placeholder="搜索客户/商品/单号..."
            value={search}
            onInput={(e) => setSearch(e.detail.value)}
            style={{ flex: 1, fontSize: 13, paddingTop: 10, paddingBottom: 10 }}
          />
          {search ? (
            <Text style={{ fontSize: 16, color: '#a8a29e', paddingLeft: 8 }} onClick={() => setSearch('')}>×</Text>
          ) : (
            <Text style={{ fontSize: 14, paddingLeft: 8 }}>🔍</Text>
          )}
        </View>
      </View>

      <ScrollView scrollY style={{ flex: 1, padding: 16 }}>
        {loading ? (
          <View style={{ padding: 48, alignItems: 'center' }}><Text style={{ fontSize: 13, color: '#a8a29e' }}>加载中...</Text></View>
        ) : filteredOrders.length === 0 ? (
          <View style={{ backgroundColor: '#ffffff', borderRadius: 16, padding: 48, alignItems: 'center' }}>
            <Text style={{ fontSize: 32, marginBottom: 12 }}>📤</Text>
            <Text style={{ fontSize: 14, color: '#a8a29e', marginBottom: 8 }}>{search ? '无匹配结果' : '暂无销售记录'}</Text>
            {!search && (
              <View
                style={{ backgroundColor: '#0f766e', borderRadius: 8, paddingLeft: 20, paddingRight: 20, paddingTop: 10, paddingBottom: 10 }}
                onClick={() => goto('/pages/mini/sale/index')}
              >
                <Text style={{ fontSize: 13, color: '#ffffff', fontWeight: 500 }}>创建第一笔销售</Text>
              </View>
            )}
          </View>
        ) : (
          filteredOrders.map((o: any) => {
            const st = STATUS_STYLE[o.status] || STATUS_STYLE.DRAFT;
            const items = o.items || [];
            const isExpanded = expandedId === o.id;
            return (
              <View key={o.id} style={{ backgroundColor: '#ffffff', borderRadius: 14, marginBottom: 10 }}>
                <View
                  style={{ padding: 16 }}
                  onClick={() => setExpandedId(isExpanded ? null : o.id)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <Text style={{ fontSize: 14, fontWeight: 600, color: '#1c1917' }}>{o.orderNo || o.id?.slice(0, 8) || '-'}</Text>
                    <View style={{ backgroundColor: st.bg, paddingLeft: 8, paddingRight: 8, paddingTop: 3, paddingBottom: 3, borderRadius: 6 }}>
                      <Text style={{ fontSize: 11, color: st.text, fontWeight: 500 }}>{st.label}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 13, color: '#78716c' }}>{o.customer?.name || o.customerName || '-'}</Text>
                    <Text style={{ fontSize: 15, fontWeight: 700, color: '#1c1917' }}>¥{Number(o.totalAmount || 0).toFixed(2)}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                    <Text style={{ fontSize: 11, color: '#a8a29e' }}>
                      {o.createdAt ? new Date(o.createdAt).toLocaleDateString('zh-CN') : '-'}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#0f766e' }}>{isExpanded ? '收起' : `展开 ${items.length} 项`}</Text>
                  </View>
                </View>

                {isExpanded && items.length > 0 && (
                  <View style={{ borderTop: '1px solid #f5f5f4', paddingTop: 12, paddingBottom: 12, paddingLeft: 16, paddingRight: 16 }}>
                    {items.map((item: any, i: number) => (
                      <View key={i} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6, paddingBottom: 6, borderBottom: i < items.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                        <Text style={{ flex: 3, fontSize: 13, color: '#1c1917' }}>{item.product?.name || item.productName || '-'}</Text>
                        <Text style={{ flex: 2, fontSize: 13, color: '#78716c', textAlign: 'center' }}>{item.quantity} x {Number(item.unitPrice || 0).toFixed(2)}</Text>
                        <Text style={{ flex: 2, fontSize: 13, fontWeight: 600, color: '#1c1917', textAlign: 'right' }}>{((item.quantity || 0) * Number(item.unitPrice || 0)).toFixed(2)}</Text>
                      </View>
                    ))}
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 8 }}>
                      <Text style={{ fontSize: 13, fontWeight: 700, color: '#0f766e' }}>合计 {Number(o.totalAmount || 0).toFixed(2)}</Text>
                    </View>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
