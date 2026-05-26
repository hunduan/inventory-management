import { useEffect, useState } from 'react';
import { View, Text, Picker, ScrollView } from '@tarojs/components';
import { inventoryApi } from '../../../services/inventory';
import { warehousesApi } from '../../../services/warehouses';
import Taro from '@tarojs/taro';

const STOCK_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  NORMAL: { label: '正常', bg: '#f0fdf4', text: '#166534' },
  LOW: { label: '偏低', bg: '#fffbeb', text: '#92400e' },
  EMPTY: { label: '缺货', bg: '#fef2f2', text: '#dc2626' },
};

const getStatus = (qty: number) => {
  if (qty <= 0) return STOCK_BADGE.EMPTY;
  if (qty < 10) return STOCK_BADGE.LOW;
  return STOCK_BADGE.NORMAL;
};

export default function MiniInventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [whIndex, setWhIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      try { const res = await warehousesApi.list(); setWarehouses(res.items || []); } catch { /* ignore */ }
    };
    init();
  }, []);

  useEffect(() => { loadInventory(); }, [whIndex]);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const wh = warehouses[whIndex];
      const params = wh?.id ? `warehouseId=${wh.id}` : '';
      const res = await inventoryApi.list(params);
      setItems(res.items || []);
    } catch { Taro.showToast({ title: '加载库存失败', icon: 'none' }); } finally { setLoading(false); }
  };

  const warehouseNames = warehouses.map((w: any) => w.name);
  const goto = (url: string) => Taro.navigateTo({ url });

  const lowStockCount = items.filter((i: any) => (i.quantity || 0) < 10).length;

  return (
    <View style={{ backgroundColor: '#f5f5f4', minHeight: '100vh' }}>
      {/* Header */}
      <View style={{
        background: 'linear-gradient(135deg, #0f766e 0%, #0d3d3a 100%)',
        padding: '52px 20px 20px',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
      }}>
        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 2 }}>库存管理</Text>
        <Text style={{ fontSize: 22, fontWeight: 700, color: '#ffffff' }}>库存查询</Text>
      </View>

      {/* Warehouse filter + transfer button */}
      <View style={{ padding: 16, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <View style={{ flex: 1, backgroundColor: '#ffffff', borderRadius: 12, padding: '12px 16px' }}>
          {warehouses.length > 0 ? (
            <Picker mode="selector" range={warehouseNames} value={whIndex} onChange={(e) => setWhIndex(Number(e.detail.value))}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, color: '#57534e' }}>{warehouseNames[whIndex] || '全部仓库'}</Text>
                <Text style={{ color: '#d6d3d1', fontSize: 11 }}>▼</Text>
              </View>
            </Picker>
          ) : (
            <Text style={{ fontSize: 13, color: '#a8a29e' }}>加载仓库...</Text>
          )}
        </View>
        <View
          style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: '12px 16px', border: '1px solid #e7e5e4' }}
          onClick={() => goto('/pages/mini/transfers/index')}
        >
          <Text style={{ fontSize: 13, color: '#0f766e', fontWeight: 500 }}>调拨</Text>
        </View>
      </View>

      {/* Low stock alert */}
      {lowStockCount > 0 && (
        <View style={{ marginLeft: 16, marginRight: 16, marginBottom: 12, backgroundColor: '#fffbeb', borderRadius: 12, padding: '10px 14px', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 16 }}>⚠️</Text>
          <Text style={{ fontSize: 12, color: '#92400e', flex: 1 }}>{lowStockCount} 种商品库存不足</Text>
        </View>
      )}

      {/* Stock Stats */}
      <View style={{ paddingLeft: 16, paddingRight: 16, marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1, backgroundColor: '#ffffff', borderRadius: 12, padding: 14, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: 700, color: '#0f766e' }}>{items.length}</Text>
            <Text style={{ fontSize: 11, color: '#a8a29e', marginTop: 2 }}>商品种类</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#ffffff', borderRadius: 12, padding: 14, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: 700, color: '#d97706' }}>{items.reduce((s: number, i: any) => s + (i.quantity || 0), 0)}</Text>
            <Text style={{ fontSize: 11, color: '#a8a29e', marginTop: 2 }}>总数量</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#ffffff', borderRadius: 12, padding: 14, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: 700, color: '#dc2626' }}>{lowStockCount}</Text>
            <Text style={{ fontSize: 11, color: '#a8a29e', marginTop: 2 }}>缺货/偏低</Text>
          </View>
        </View>
      </View>

      {/* Inventory List */}
      <ScrollView scrollY style={{ flex: 1, paddingLeft: 16, paddingRight: 16 }}>
        {loading ? (
          <View style={{ padding: 48, alignItems: 'center' }}><Text style={{ fontSize: 13, color: '#a8a29e' }}>加载中...</Text></View>
        ) : items.length === 0 ? (
          <View style={{ backgroundColor: '#ffffff', borderRadius: 16, padding: 48, alignItems: 'center' }}>
            <Text style={{ fontSize: 32, marginBottom: 12 }}>📦</Text>
            <Text style={{ fontSize: 14, color: '#a8a29e' }}>暂无库存数据</Text>
          </View>
        ) : (
          items.map((item: any, idx: number) => {
            const status = getStatus(item.quantity || 0);
            return (
              <View key={item.id || idx} style={{ backgroundColor: '#ffffff', borderRadius: 14, padding: 16, marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 14, fontWeight: 600, color: '#1c1917' }}>{item.product?.name || item.productName || '-'}</Text>
                  <View style={{ backgroundColor: status.bg, paddingLeft: 8, paddingRight: 8, paddingTop: 3, paddingBottom: 3, borderRadius: 6 }}>
                    <Text style={{ fontSize: 11, fontWeight: 500, color: status.text }}>{status.label}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 12, color: '#a8a29e' }}>{item.product?.barcode || item.barcode || '-'}</Text>
                  <Text style={{ fontSize: 20, fontWeight: 700, color: '#1c1917' }}>{item.quantity || 0} <Text style={{ fontSize: 12, color: '#a8a29e' }}>{item.unit || '个'}</Text></Text>
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}
