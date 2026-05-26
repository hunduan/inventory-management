import { useState, useEffect } from 'react';
import { View, Text } from '@tarojs/components';
import AppShell from '../../../components/layout/app-shell';
import { api } from '../../../utils/request';
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

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get<any>(`/transfers?page=${page}&limit=20`);
      setItems(res.items || []);
      setTotal(res.total || 0);
    } catch { /* toast */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page]);

  const handleAction = async (id: string, action: string) => {
    try {
      await api.post(`/transfers/${id}/${action}`);
      Taro.showToast({ title: '操作成功', icon: 'success' });
      load();
    } catch (err: any) { Taro.showToast({ title: err.message || '操作失败', icon: 'none' }); }
  };

  return (
    <AppShell>
      <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <View>
          <Text style={{ fontSize: 20, fontWeight: 700, color: '#1c1917' }}>调拨管理</Text>
          <Text style={{ fontSize: 14, color: '#a8a29e', marginTop: 2 }}>共 {total} 条</Text>
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
          <View style={{ padding: '48px 0', textAlign: 'center' }}><Text style={{ fontSize: 14, color: '#a8a29e' }}>暂无调拨单</Text></View>
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
                  {t.status === 'DRAFT' && (
                    <View style={{ padding: '4px 8px', borderRadius: 4, backgroundColor: '#f0f9ff', color: '#075985' }} onClick={() => handleAction(t.id, 'confirm')}>
                      <Text className="text-xs">确认</Text></View>
                  )}
                  {t.status === 'CONFIRMED' && (
                    <View style={{ padding: '4px 8px', borderRadius: 4, backgroundColor: '#f0fdf4', color: '#166534' }} onClick={() => handleAction(t.id, 'complete')}>
                      <Text className="text-xs">完成</Text></View>
                  )}
                  {(t.status === 'DRAFT' || t.status === 'CONFIRMED') && (
                    <View style={{ padding: '4px 8px', borderRadius: 4, backgroundColor: '#fef2f2', color: '#dc2626' }} onClick={() => handleAction(t.id, 'cancel')}>
                      <Text className="text-xs">取消</Text></View>
                  )}
                  {t.status === 'COMPLETED' || t.status === 'CANCELLED' ? (
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
