import { useState, useEffect } from 'react';
import { View, Text, Input, Picker } from '@tarojs/components';
import AppShell from '../../../components/layout/app-shell';
import { transfersApi } from '../../../services/transfers';
import { warehousesApi } from '../../../services/warehouses';
import { productsApi } from '../../../services/products';
import Pagination from '../../../components/ui/Pagination';
import Taro from '@tarojs/taro';

const STATUS_MAP: Record<string, { bg: string; text: string; label: string }> = {
  DRAFT: { bg: '#f5f5f4', text: '#78716c', label: '草稿' },
  CONFIRMED: { bg: '#f0f9ff', text: '#075985', label: '已确认' },
  COMPLETED: { bg: '#f0fdf4', text: '#166534', label: '已完成' },
  CANCELLED: { bg: '#fef2f2', text: '#dc2626', label: '已取消' },
};

export default function TransfersPage() {
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [fromIndex, setFromIndex] = useState(0);
  const [toIndex, setToIndex] = useState(1);
  const [remark, setRemark] = useState('');
  const [transferItems, setTransferItems] = useState<Array<{ productId: string; quantity: string }>>([{ productId: '', quantity: '1' }]);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await transfersApi.list(`page=${page}&limit=20`);
      setItems(res.items || []);
      setTotal(res.total || 0);
    } catch { /* toast */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page]);

  const handleAction = async (id: string, action: string) => {
    try {
      if (action === 'confirm') await transfersApi.confirm(id);
      else if (action === 'complete') await transfersApi.complete(id);
      else if (action === 'cancel') await transfersApi.cancel(id);
      Taro.showToast({ title: '操作成功', icon: 'success' });
      load();
    } catch (err: any) { Taro.showToast({ title: err.message || '操作失败', icon: 'none' }); }
  };

  const openCreate = async () => {
    try {
      const [whRes, prRes] = await Promise.all([warehousesApi.list(), productsApi.list('page=1&limit=200')]);
      setWarehouses(whRes.items || []);
      setProducts(prRes.items || []);
      setFromIndex(0);
      setToIndex((whRes.items?.length || 0) > 1 ? 1 : 0);
      setRemark('');
      setTransferItems([{ productId: '', quantity: '1' }]);
      setShowModal(true);
    } catch (err: any) { Taro.showToast({ title: err.message || '加载数据失败', icon: 'none' }); }
  };

  const addRow = () => setTransferItems([...transferItems, { productId: '', quantity: '1' }]);
  const removeRow = (idx: number) => setTransferItems(transferItems.filter((_, i) => i !== idx));
  const updateRow = (idx: number, field: string, value: string) => {
    const updated = [...transferItems];
    (updated[idx] as any)[field] = value;
    setTransferItems(updated);
  };

  const handleSubmit = async () => {
    if (warehouses[fromIndex]?.id === warehouses[toIndex]?.id) {
      Taro.showToast({ title: '源仓库和目标仓库不能相同', icon: 'none' }); return;
    }
    const validItems = transferItems.filter(i => i.productId && parseFloat(i.quantity) > 0);
    if (validItems.length === 0) { Taro.showToast({ title: '请添加至少一个商品', icon: 'none' }); return; }
    setSubmitting(true);
    try {
      await transfersApi.create({
        fromWarehouseId: warehouses[fromIndex].id,
        toWarehouseId: warehouses[toIndex].id,
        remark: remark || undefined,
        items: validItems.map(i => ({ productId: i.productId, quantity: parseFloat(i.quantity) })),
      });
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
          <Text style={{ fontSize: 20, fontWeight: 700, color: '#1c1917' }}>调拨管理</Text>
          <Text style={{ fontSize: 14, color: '#a8a29e', marginTop: 2 }}>共 {total} 条</Text>
        </View>
        <View style={{ backgroundColor: '#0f766e', color: '#ffffff', borderRadius: 4, padding: '8px 16px', cursor: 'pointer', fontSize: 14, fontWeight: 500 }} onClick={openCreate}>
          <Text>+ 新建调拨</Text>
        </View>
      </View>

      <View className="card" style={{ overflow: 'hidden' }}>
        <View className="data-table-row text-xs" style={{ color: '#78716c', borderBottom: '1px solid #e7e5e4', backgroundColor: '#fafaf9', padding: '10px 16px', fontWeight: 500 }}>
          <Text className="data-col-no">调拨单号</Text>
          <Text className="data-col-partner">源仓库</Text>
          <Text className="data-col-wh">目标仓库</Text>
          <Text className="data-col-amount">状态</Text>
          <Text className="data-col-time">创建时间</Text>
          <Text className="data-col-actions">操作</Text>
        </View>

        {loading ? (
          <View style={{ padding: '48px 0', textAlign: 'center' }}><Text style={{ fontSize: 14, color: '#a8a29e' }}>加载中...</Text></View>
        ) : items.length === 0 ? (
          <View style={{ padding: '48px 0', textAlign: 'center' }}><Text style={{ fontSize: 14, color: '#a8a29e' }}>暂无调拨单，点击"新建调拨"开始</Text></View>
        ) : (
          items.map((t: any, idx: number) => {
            const st = STATUS_MAP[t.status] || STATUS_MAP.DRAFT;
            return (
              <View key={t.id} className="data-table-row text-sm" style={{ padding: '10px 16px', borderBottom: idx < items.length - 1 ? '1px solid #f5f5f4' : 'none' }}>
                <Text className="data-col-no" style={{ fontWeight: 500, color: '#1c1917' }}>{t.id?.slice(0, 8) || '-'}</Text>
                <Text className="data-col-partner" style={{ color: '#78716c' }}>{t.fromWarehouse?.name || '-'}</Text>
                <Text className="data-col-wh" style={{ color: '#78716c' }}>{t.toWarehouse?.name || '-'}</Text>
                <View className="data-col-amount">
                  <View style={{ backgroundColor: st.bg, color: st.text, padding: '2px 6px', borderRadius: 4, display: 'inline-flex' }}>
                    <Text className="text-xs" style={{ fontWeight: 500 }}>{st.label}</Text>
                  </View>
                </View>
                <Text className="data-col-time" style={{ color: '#a8a29e', fontSize: 12 }}>{t.createdAt ? new Date(t.createdAt).toLocaleDateString('zh-CN') : '-'}</Text>
                <View className="data-col-actions" style={{ flexDirection: 'row', gap: 4, justifyContent: 'center' }}>
                  {t.status === 'DRAFT' && <View style={{ padding: '4px 8px', borderRadius: 4, backgroundColor: '#f0f9ff', color: '#075985' }} onClick={() => handleAction(t.id, 'confirm')}><Text className="text-xs">确认</Text></View>}
                  {t.status === 'CONFIRMED' && <View style={{ padding: '4px 8px', borderRadius: 4, backgroundColor: '#f0fdf4', color: '#166534' }} onClick={() => handleAction(t.id, 'complete')}><Text className="text-xs">完成</Text></View>}
                  {(t.status === 'DRAFT' || t.status === 'CONFIRMED') && <View style={{ padding: '4px 8px', borderRadius: 4, backgroundColor: '#fef2f2', color: '#dc2626' }} onClick={() => handleAction(t.id, 'cancel')}><Text className="text-xs">取消</Text></View>}
                  {(t.status === 'COMPLETED' || t.status === 'CANCELLED') && <Text style={{ fontSize: 12, color: '#d6d3d1', lineHeight: '28px' }}>-</Text>}
                </View>
              </View>
            );
          })
        )}
      </View>

      <Pagination page={page} totalPages={Math.ceil(total / 20)} total={total} onPrev={() => setPage(page - 1)} onNext={() => setPage(page + 1)} />

      {showModal && (
        <View style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <View className="card p-5" style={{ width: '100%', maxWidth: 500, margin: '0 16px', maxHeight: '80vh', overflowY: 'auto' }}>
            <Text style={{ fontSize: 18, fontWeight: 700, color: '#1c1917', marginBottom: 20, display: 'block' }}>新建调拨单</Text>

            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 14, fontWeight: 500, color: '#57534e', marginBottom: 6, display: 'block' }}>源仓库 <Text style={{ color: '#dc2626' }}>*</Text></Text>
              <Picker mode="selector" range={warehouses.map((w: any) => w.name)} value={fromIndex} onChange={(e) => setFromIndex(Number(e.detail.value))}>
                <View className="input-field"><Text style={{ fontSize: 14 }}>{warehouses[fromIndex]?.name || '选择仓库'}</Text></View>
              </Picker>
            </View>

            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 14, fontWeight: 500, color: '#57534e', marginBottom: 6, display: 'block' }}>目标仓库 <Text style={{ color: '#dc2626' }}>*</Text></Text>
              <Picker mode="selector" range={warehouses.map((w: any) => w.name)} value={toIndex} onChange={(e) => setToIndex(Number(e.detail.value))}>
                <View className="input-field"><Text style={{ fontSize: 14 }}>{warehouses[toIndex]?.name || '选择仓库'}</Text></View>
              </Picker>
            </View>

            <View style={{ marginBottom: 14 }}>
              <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: 500, color: '#57534e' }}>商品明细</Text>
                <Text style={{ fontSize: 12, color: '#0f766e', cursor: 'pointer' }} onClick={addRow}>+ 添加商品</Text>
              </View>
              {transferItems.map((item, idx) => (
                <View key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                  <Picker mode="selector" range={products.map((p: any) => p.name)} value={products.findIndex((p: any) => p.id === item.productId)} onChange={(e) => updateRow(idx, 'productId', products[Number(e.detail.value)]?.id || '')}>
                    <View className="input-field" style={{ flex: 3, cursor: 'pointer' }}>
                      <Text style={{ fontSize: 13, color: item.productId ? '#1c1917' : '#a8a29e' }}>{item.productId ? products.find((p: any) => p.id === item.productId)?.name : '选择商品'}</Text>
                    </View>
                  </Picker>
                  <Input className="input-field" style={{ flex: 1, fontSize: 13 }} type="number" placeholder="数量" value={item.quantity} onInput={(e) => updateRow(idx, 'quantity', e.detail.value)} />
                  {transferItems.length > 1 && <Text style={{ color: '#dc2626', cursor: 'pointer', fontSize: 18 }} onClick={() => removeRow(idx)}>×</Text>}
                </View>
              ))}
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 14, fontWeight: 500, color: '#57534e', marginBottom: 6, display: 'block' }}>备注</Text>
              <Input className="input-field" placeholder="选填" value={remark} onInput={(e) => setRemark(e.detail.value)} />
            </View>

            <View style={{ display: 'flex', gap: 12 }}>
              <View style={{ flex: 1, padding: '10px 0', borderRadius: 4, cursor: 'pointer', fontSize: 14, fontWeight: 500, textAlign: 'center', border: '1px solid #e7e5e4', color: '#57534e' }} onClick={() => setShowModal(false)}><Text>取消</Text></View>
              <View style={{ flex: 1, padding: '10px 0', borderRadius: 4, cursor: 'pointer', fontSize: 14, fontWeight: 500, textAlign: 'center', backgroundColor: submitting ? '#0d9488' : '#0f766e', color: '#ffffff' }} onClick={submitting ? undefined : handleSubmit}>
                <Text>{submitting ? '创建中...' : '创建调拨单'}</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </AppShell>
  );
}
