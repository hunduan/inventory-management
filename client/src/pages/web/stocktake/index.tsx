import { useState, useEffect } from 'react';
import { View, Text } from '@tarojs/components';
import AppShell from '../../../components/layout/app-shell';
import { api } from '../../../utils/request';
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

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get<any>(`/stocktakes?page=${page}&limit=20`);
      setItems(res.items || []);
      setTotal(res.total || 0);
    } catch { /* toast */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page]);

  const handleAction = async (id: string, action: string) => {
    try {
      await api.post(`/stocktakes/${id}/${action}`);
      Taro.showToast({ title: '操作成功', icon: 'success' });
      load();
    } catch (err: any) { Taro.showToast({ title: err.message || '操作失败', icon: 'none' }); }
  };

  return (
    <AppShell>
      <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <View>
          <Text style={{ fontSize: 20, fontWeight: 700, color: '#1c1917' }}>盘点管理</Text>
          <Text style={{ fontSize: 14, color: '#a8a29e', marginTop: 2 }}>共 {total} 条</Text>
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
          <View style={{ padding: '48px 0', textAlign: 'center' }}><Text style={{ fontSize: 14, color: '#a8a29e' }}>暂无盘点单</Text></View>
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
                  {s.status === 'DRAFT' && (
                    <View style={{ padding: '4px 8px', borderRadius: 4, backgroundColor: '#f0f9ff', color: '#075985' }} onClick={() => handleAction(s.id, 'start')}>
                      <Text className="text-xs">开始</Text></View>
                  )}
                  {s.status === 'IN_PROGRESS' && (
                    <View style={{ padding: '4px 8px', borderRadius: 4, backgroundColor: '#f0fdf4', color: '#166534' }} onClick={() => handleAction(s.id, 'complete')}>
                      <Text className="text-xs">完成</Text></View>
                  )}
                  {(s.status === 'DRAFT' || s.status === 'IN_PROGRESS') && (
                    <View style={{ padding: '4px 8px', borderRadius: 4, backgroundColor: '#fef2f2', color: '#dc2626' }} onClick={() => handleAction(s.id, 'cancel')}>
                      <Text className="text-xs">取消</Text></View>
                  )}
                  {s.status === 'COMPLETED' || s.status === 'CANCELLED' ? (
                    <Text style={{ fontSize: 12, color: '#d6d3d1', lineHeight: '28px' }}>-</Text>
                  ) : null}
                </View>
              </View>
            );
          })
        )}
      </View>

      <Pagination page={page} totalPages={Math.ceil(total / 20)} total={total} onPrev={() => setPage(page - 1)} onNext={() => setPage(page + 1)} />
    </AppShell>
  );
}
