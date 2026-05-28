import { useState, useEffect } from 'react';
import { View, Text, Picker } from '@tarojs/components';
import AppShell from '../../../components/layout/app-shell';
import { stocktakeApi } from '../../../services/stocktake';
import { warehousesApi } from '../../../services/warehouses';
import Pagination from '../../../components/ui/Pagination';
import Taro from '@tarojs/taro';

const STATUS_MAP: Record<string, { bg: string; text: string; label: string }> = {
  DRAFT: { bg: '#f5f5f4', text: '#78716c', label: '草稿' },
  IN_PROGRESS: { bg: '#f0f9ff', text: '#075985', label: '盘点中' },
  COMPLETED: { bg: '#f0fdf4', text: '#166534', label: '已完成' },
  CANCELLED: { bg: '#fef2f2', text: '#dc2626', label: '已取消' },
};

export default function StocktakePage() {
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [whIndex, setWhIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await stocktakeApi.list(`page=${page}&limit=20`);
      setItems(res.items || []);
      setTotal(res.total || 0);
    } catch { /* toast */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page]);

  const handleAction = async (id: string, action: string) => {
    try {
      if (action === 'start') await stocktakeApi.start(id);
      else if (action === 'complete') await stocktakeApi.complete(id);
      else if (action === 'cancel') await stocktakeApi.cancel(id);
      Taro.showToast({ title: '操作成功', icon: 'success' });
      load();
    } catch (err: any) { Taro.showToast({ title: err.message || '操作失败', icon: 'none' }); }
  };

  const openCreate = async () => {
    try {
      const res = await warehousesApi.list();
      setWarehouses(res.items || []);
      setWhIndex(0);
      setShowModal(true);
    } catch (err: any) { Taro.showToast({ title: err.message || '加载仓库失败', icon: 'none' }); }
  };

  const handleSubmit = async () => {
    if (!warehouses[whIndex]) { Taro.showToast({ title: '请选择仓库', icon: 'none' }); return; }
    setSubmitting(true);
    try {
      await stocktakeApi.create({ warehouseId: warehouses[whIndex].id });
      Taro.showToast({ title: '创建成功', icon: 'success' });
      setShowModal(false);
      load();
    } catch (err: any) { Taro.showToast({ title: err.message || '创建失败', icon: 'none' }); }
    finally { setSubmitting(false); }
  };

  return (
    <AppShell>
      <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <View>
          <Text style={{ fontSize: 20, fontWeight: 700, color: '#1c1917' }}>盘点管理</Text>
          <Text style={{ fontSize: 14, color: '#a8a29e', marginTop: 2 }}>共 {total} 条</Text>
        </View>
        <View style={{ backgroundColor: '#0f766e', color: '#ffffff', borderRadius: 4, padding: '8px 16px', cursor: 'pointer', fontSize: 14, fontWeight: 500 }} onClick={openCreate}>
          <Text>+ 新建盘点</Text>
        </View>
      </View>

      <View className="card" style={{ overflow: 'hidden' }}>
        <View className="data-table-row text-xs" style={{ color: '#78716c', borderBottom: '1px solid #e7e5e4', backgroundColor: '#fafaf9', padding: '10px 16px', fontWeight: 500 }}>
          <Text className="data-col-no">盘点单号</Text>
          <Text className="data-col-partner">仓库</Text>
          <Text className="data-col-wh">状态</Text>
          <Text className="data-col-amount">商品数</Text>
          <Text className="data-col-time">创建时间</Text>
          <Text className="data-col-actions">操作</Text>
        </View>

        {loading ? (
          <View style={{ padding: '48px 0', textAlign: 'center' }}><Text style={{ fontSize: 14, color: '#a8a29e' }}>加载中...</Text></View>
        ) : items.length === 0 ? (
          <View style={{ padding: '48px 0', textAlign: 'center' }}><Text style={{ fontSize: 14, color: '#a8a29e' }}>暂无盘点单，点击"新建盘点"开始</Text></View>
        ) : (
          items.map((s: any, idx: number) => {
            const st = STATUS_MAP[s.status] || STATUS_MAP.DRAFT;
            return (
              <View key={s.id} className="data-table-row text-sm" style={{ padding: '10px 16px', borderBottom: idx < items.length - 1 ? '1px solid #f5f5f4' : 'none' }}>
                <Text className="data-col-no" style={{ fontWeight: 500, color: '#1c1917' }}>{s.id?.slice(0, 8) || '-'}</Text>
                <Text className="data-col-partner" style={{ color: '#78716c' }}>{s.warehouse?.name || '-'}</Text>
                <View className="data-col-wh">
                  <View style={{ backgroundColor: st.bg, color: st.text, padding: '2px 6px', borderRadius: 4, display: 'inline-flex' }}>
                    <Text className="text-xs" style={{ fontWeight: 500 }}>{st.label}</Text>
                  </View>
                </View>
                <Text className="data-col-amount" style={{ color: '#1c1917' }}>{s.items?.length || 0} 项</Text>
                <Text className="data-col-time" style={{ color: '#a8a29e', fontSize: 12 }}>{s.createdAt ? new Date(s.createdAt).toLocaleDateString('zh-CN') : '-'}</Text>
                <View className="data-col-actions" style={{ flexDirection: 'row', gap: 4, justifyContent: 'center' }}>
                  {s.status === 'DRAFT' && <View style={{ padding: '4px 8px', borderRadius: 4, backgroundColor: '#f0f9ff', color: '#075985' }} onClick={() => handleAction(s.id, 'start')}><Text className="text-xs">开始</Text></View>}
                  {s.status === 'IN_PROGRESS' && <View style={{ padding: '4px 8px', borderRadius: 4, backgroundColor: '#f0fdf4', color: '#166534' }} onClick={() => handleAction(s.id, 'complete')}><Text className="text-xs">完成</Text></View>}
                  {(s.status === 'DRAFT' || s.status === 'IN_PROGRESS') && <View style={{ padding: '4px 8px', borderRadius: 4, backgroundColor: '#fef2f2', color: '#dc2626' }} onClick={() => handleAction(s.id, 'cancel')}><Text className="text-xs">取消</Text></View>}
                  {(s.status === 'COMPLETED' || s.status === 'CANCELLED') && <Text style={{ fontSize: 12, color: '#d6d3d1', lineHeight: '28px' }}>-</Text>}
                </View>
              </View>
            );
          })
        )}
      </View>

      <Pagination page={page} totalPages={Math.ceil(total / 20)} total={total} onPrev={() => setPage(page - 1)} onNext={() => setPage(page + 1)} />

      {showModal && (
        <View style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <View className="card p-5" style={{ width: '100%', maxWidth: 400, margin: '0 16px' }}>
            <Text style={{ fontSize: 18, fontWeight: 700, color: '#1c1917', marginBottom: 20, display: 'block' }}>新建盘点单</Text>

            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 14, fontWeight: 500, color: '#57534e', marginBottom: 6, display: 'block' }}>选择仓库 <Text style={{ color: '#dc2626' }}>*</Text></Text>
              {warehouses.length > 0 ? (
                <Picker mode="selector" range={warehouses.map((w: any) => w.name)} value={whIndex} onChange={(e) => setWhIndex(Number(e.detail.value))}>
                  <View className="input-field"><Text style={{ fontSize: 14 }}>{warehouses[whIndex]?.name || '选择仓库'}</Text></View>
                </Picker>
              ) : (
                <Text style={{ fontSize: 13, color: '#a8a29e' }}>暂无仓库，请先创建仓库</Text>
              )}
            </View>

            <View style={{ display: 'flex', gap: 12 }}>
              <View style={{ flex: 1, padding: '10px 0', borderRadius: 4, cursor: 'pointer', fontSize: 14, fontWeight: 500, textAlign: 'center', border: '1px solid #e7e5e4', color: '#57534e' }} onClick={() => setShowModal(false)}><Text>取消</Text></View>
              <View style={{ flex: 1, padding: '10px 0', borderRadius: 4, cursor: 'pointer', fontSize: 14, fontWeight: 500, textAlign: 'center', backgroundColor: submitting ? '#0d9488' : '#0f766e', color: '#ffffff' }} onClick={submitting ? undefined : handleSubmit}>
                <Text>{submitting ? '创建中...' : '创建盘点单'}</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </AppShell>
  );
}
