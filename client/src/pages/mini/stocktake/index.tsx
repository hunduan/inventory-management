import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Picker } from '@tarojs/components';
import { stocktakeApi } from '../../../services/stocktake';
import { warehousesApi } from '../../../services/warehouses';
import Taro from '@tarojs/taro';

const STATUS_STYLE: Record<string, { label: string; bg: string; text: string }> = {
  DRAFT: { label: '草稿', bg: '#f5f5f4', text: '#78716c' },
  IN_PROGRESS: { label: '盘点中', bg: '#f0f9ff', text: '#075985' },
  COMPLETED: { label: '已完成', bg: '#f0fdf4', text: '#166534' },
  CANCELLED: { label: '已取消', bg: '#fef2f2', text: '#dc2626' },
};

export default function MiniStocktakePage() {
  const [items, setItems] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [whIndex, setWhIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await stocktakeApi.list('page=1&limit=50');
      setItems(res.items || []);
    } catch { /* silent */ } finally { setLoading(false); }
  };

  const loadWarehouses = async () => {
    try {
      const res = await warehousesApi.list();
      setWarehouses(res.items || []);
    } catch { /* silent */ }
  };

  useEffect(() => { load(); loadWarehouses(); }, []);

  const handleAction = async (id: string, action: string) => {
    try {
      if (action === 'start') await stocktakeApi.start(id);
      else if (action === 'complete') await stocktakeApi.complete(id);
      else if (action === 'cancel') await stocktakeApi.cancel(id);
      Taro.showToast({ title: '操作成功', icon: 'success' });
      load();
    } catch (err: any) {
      Taro.showToast({ title: err.message || '操作失败', icon: 'none' });
    }
  };

  const handleCreate = async () => {
    if (warehouses.length === 0) {
      Taro.showToast({ title: '请先创建仓库', icon: 'none' });
      return;
    }
    Taro.showModal({
      title: '创建盘点单',
      content: `将在"${warehouses[whIndex]?.name}"仓库创建盘点单`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await stocktakeApi.create({ warehouseId: warehouses[whIndex].id });
            Taro.showToast({ title: '创建成功', icon: 'success' });
            load();
          } catch (err: any) {
            Taro.showToast({ title: err.message || '创建失败', icon: 'none' });
          }
        }
      },
    });
  };

  const warehouseNames = warehouses.map((w: any) => w.name);

  return (
    <View style={{ backgroundColor: '#f5f5f4', minHeight: '100vh' }}>
      <View style={{ background: 'linear-gradient(135deg, #0f766e 0%, #0d3d3a 100%)', padding: '52px 20px 20px', borderBottomLeftRadius: 20, borderBottomRightRadius: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 2 }}>库存盘点</Text>
            <Text style={{ fontSize: 22, fontWeight: 700, color: '#ffffff' }}>盘点管理</Text>
          </View>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, paddingLeft: 14, paddingRight: 14, paddingTop: 10, paddingBottom: 10 }} onClick={handleCreate}>
            <Text style={{ fontSize: 13, color: '#ffffff', fontWeight: 600 }}>+ 新建</Text>
          </View>
        </View>
      </View>

      {warehouses.length > 0 && (
        <View style={{ padding: 16, paddingBottom: 0 }}>
          <Picker mode="selector" range={warehouseNames} value={whIndex} onChange={(e) => setWhIndex(Number(e.detail.value))}>
            <View style={{ backgroundColor: '#ffffff', borderRadius: 10, padding: '10px 14px', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, color: '#57534e' }}>仓库: {warehouseNames[whIndex]}</Text>
              <Text style={{ fontSize: 11, color: '#d6d3d1' }}>▼</Text>
            </View>
          </Picker>
        </View>
      )}

      <ScrollView scrollY style={{ flex: 1, padding: 16 }}>
        {loading ? (
          <View style={{ padding: 48, alignItems: 'center' }}><Text style={{ fontSize: 13, color: '#a8a29e' }}>加载中...</Text></View>
        ) : items.length === 0 ? (
          <View style={{ backgroundColor: '#ffffff', borderRadius: 16, padding: 48, alignItems: 'center' }}>
            <Text style={{ fontSize: 32, marginBottom: 12 }}>📋</Text>
            <Text style={{ fontSize: 14, color: '#a8a29e', marginBottom: 8 }}>暂无盘点单</Text>
            <View style={{ backgroundColor: '#0f766e', borderRadius: 8, paddingLeft: 20, paddingRight: 20, paddingTop: 10, paddingBottom: 10 }} onClick={handleCreate}>
              <Text style={{ fontSize: 13, color: '#ffffff', fontWeight: 500 }}>创建盘点单</Text>
            </View>
          </View>
        ) : (
          items.map((s) => {
            const st = STATUS_STYLE[s.status] || STATUS_STYLE.DRAFT;
            return (
              <View key={s.id} style={{ backgroundColor: '#ffffff', borderRadius: 14, padding: 16, marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 14, fontWeight: 600, color: '#1c1917' }}>{s.id?.slice(0, 8) || '-'}</Text>
                  <View style={{ backgroundColor: st.bg, paddingLeft: 8, paddingRight: 8, paddingTop: 3, paddingBottom: 3, borderRadius: 6 }}>
                    <Text style={{ fontSize: 11, color: st.text, fontWeight: 500 }}>{st.label}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 13, color: '#78716c', marginBottom: 2 }}>仓库: {s.warehouse?.name || '-'}</Text>
                <Text style={{ fontSize: 11, color: '#a8a29e', marginBottom: 10 }}>{s.items?.length || 0} 项 · {s.createdAt ? new Date(s.createdAt).toLocaleDateString('zh-CN') : '-'}</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {s.status === 'DRAFT' && (
                    <>
                      <View style={{ flex: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center', backgroundColor: '#0f766e' }} onClick={() => handleAction(s.id, 'start')}>
                        <Text style={{ fontSize: 12, color: '#ffffff', fontWeight: 500 }}>开始盘点</Text>
                      </View>
                      <View style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 6, alignItems: 'center', backgroundColor: '#fef2f2' }} onClick={() => handleAction(s.id, 'cancel')}>
                        <Text style={{ fontSize: 12, color: '#dc2626', fontWeight: 500 }}>取消</Text>
                      </View>
                    </>
                  )}
                  {s.status === 'IN_PROGRESS' && (
                    <>
                      <View style={{ flex: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center', backgroundColor: '#0f766e' }} onClick={() => handleAction(s.id, 'complete')}>
                        <Text style={{ fontSize: 12, color: '#ffffff', fontWeight: 500 }}>完成盘点</Text>
                      </View>
                      <View style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 6, alignItems: 'center', backgroundColor: '#fef2f2' }} onClick={() => handleAction(s.id, 'cancel')}>
                        <Text style={{ fontSize: 12, color: '#dc2626', fontWeight: 500 }}>取消</Text>
                      </View>
                    </>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
