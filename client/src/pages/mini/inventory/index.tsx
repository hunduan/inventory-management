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

  return (
    <ScrollView className="min-h-screen" style={{ backgroundColor: '#f5f5f4' }}>
      <View style={{ backgroundColor: '#0f766e', padding: '20px 20px 16px' }}>
        <Text className="text-lg font-bold" style={{ color: '#ffffff' }} onClick={() => Taro.navigateBack()}>
          ← 库存查询
        </Text>
      </View>

      <View className="p-4">
        {warehouses.length > 0 && (
          <View className="card p-3 mb-4">
            <Picker mode="selector" range={warehouseNames} value={whIndex} onChange={(e) => setWhIndex(Number(e.detail.value))}>
              <View className="flex items-center justify-between" style={{ flexDirection: 'row' }}>
                <Text className="text-sm" style={{ color: '#57534e' }}>{warehouseNames[whIndex] || '全部仓库'}</Text>
                <Text style={{ color: '#d6d3d1', fontSize: 12 }}>▼</Text>
              </View>
            </Picker>
          </View>
        )}

        {loading ? (
          <View className="py-12 text-center"><Text className="text-sm" style={{ color: '#a8a29e' }}>加载中...</Text></View>
        ) : items.length === 0 ? (
          <View className="py-12 text-center"><Text className="text-sm" style={{ color: '#a8a29e' }}>暂无库存数据</Text></View>
        ) : (
          items.map((item: any, idx: number) => {
            const status = getStatus(item.quantity || 0);
            return (
              <View key={item.id || idx} className="card p-4 mb-3">
                <View className="flex items-center justify-between mb-2" style={{ flexDirection: 'row' }}>
                  <Text className="text-sm font-medium" style={{ color: '#1c1917' }}>{item.product?.name || item.productName || '-'}</Text>
                  <View className="px-2 py-0.5 rounded" style={{ backgroundColor: status.bg }}>
                    <Text className="text-xs font-medium" style={{ color: status.text }}>{status.label}</Text>
                  </View>
                </View>
                <View className="flex items-center justify-between" style={{ flexDirection: 'row' }}>
                  <Text className="text-xs" style={{ color: '#a8a29e' }}>{item.product?.barcode || item.barcode || '-'}</Text>
                  <Text className="text-sm font-semibold" style={{ color: '#1c1917' }}>{item.quantity || 0} {item.unit || '个'}</Text>
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}
