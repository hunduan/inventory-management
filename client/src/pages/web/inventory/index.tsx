import { useState, useEffect } from 'react';
import { View, Text, Input, Picker, Switch } from '@tarojs/components';
import AppShell from '../../../components/layout/app-shell';
import { inventoryApi } from '../../../services/inventory';
import { warehousesApi } from '../../../services/warehouses';
import Taro from '@tarojs/taro';

interface StockBadge {
  label: string;
  bg: string;
  color: string;
}

const getStockBadge = (qty: number): StockBadge => {
  if (qty <= 0) return { label: '缺货', bg: '#fef2f2', color: '#dc2626' };
  if (qty <= 10) return { label: '偏低', bg: '#fffbeb', color: '#92400e' };
  return { label: '正常', bg: '#f0fdf4', color: '#166534' };
};

export default function InventoryPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [warehouseIndex, setWarehouseIndex] = useState(0);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [historyMode, setHistoryMode] = useState(false);
  const [historyDate, setHistoryDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const res = await warehousesApi.list();
        setWarehouses(res.items || []);
      } catch {
        // non-critical
      }
    };
    loadOptions();
  }, []);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (warehouseIndex > 0) {
        const wh = warehouses[warehouseIndex];
        if (wh) params.set('warehouseId', wh.id);
      }

      let res: any;
      if (historyMode) {
        params.set('date', new Date(historyDate).toISOString());
        res = await inventoryApi.history(params.toString());
      } else {
        res = await inventoryApi.list(params.toString());
      }

      setRecords(res.items || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      Taro.showToast({ title: err.message || '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRecords(); }, [page, warehouseIndex, historyMode, historyDate]);

  const handleSearch = () => { setPage(1); loadRecords(); };

  const warehouseNames = ['全部仓库', ...warehouses.map((w: any) => w.name)];
  const totalPages = Math.ceil(total / 20);

  return (
    <AppShell>
      {/* Page Header */}
      <View className="flex items-center justify-between mb-6">
        <View>
          <Text style={{ fontSize: 20, fontWeight: 700, color: '#1c1917', display: 'block' }}>
            库存管理
          </Text>
          <Text style={{ fontSize: 14, color: '#a8a29e', display: 'block', marginTop: 2 }}>
            共 {total} 条库存记录
          </Text>
        </View>

        <View className="flex items-center gap-2">
          <Text
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: historyMode ? '#0f766e' : '#a8a29e',
            }}
          >
            历史快照
          </Text>
          <Switch
            checked={historyMode}
            style={{ transform: 'scale(0.8)' }}
            onChange={(e) => setHistoryMode(e.detail.value)}
          />
        </View>
      </View>

      {/* Filters */}
      <View className="card p-4 mb-6">
        <View className="flex gap-3 items-center flex-wrap">
          <View className="flex-1 min-w-[200px]">
            <Input
              className="input-field"
              placeholder="搜索商品名称..."
              value={search}
              onInput={(e) => setSearch(e.detail.value)}
              onConfirm={handleSearch}
            />
          </View>

          <Picker
            mode="selector"
            range={warehouseNames}
            value={warehouseIndex}
            onChange={(e) => setWarehouseIndex(Number(e.detail.value))}
          >
            <View
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                border: '1px solid #e7e5e4',
                borderRadius: 4,
                background: '#fafaf9',
                padding: '8px 16px',
                minWidth: 130,
                cursor: 'pointer',
              }}
            >
              <Text style={{ fontSize: 14, color: '#78716c' }}>
                {warehouseNames[warehouseIndex] || '选择仓库'}
              </Text>
              <Text style={{ color: '#a8a29e', marginLeft: 4, fontSize: 10 }}>▼</Text>
            </View>
          </Picker>

          <View
            style={{
              backgroundColor: '#0f766e',
              color: '#ffffff',
              borderRadius: 4,
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
            }}
            onClick={handleSearch}
          >
            <Text>搜索</Text>
          </View>
        </View>

        {historyMode && (
          <View
            className="flex items-center gap-3 mt-4 pt-4"
            style={{ borderTop: '1px solid #f5f5f4' }}
          >
            <Text style={{ fontSize: 12, fontWeight: 600, color: '#78716c' }}>选择日期</Text>
            <Picker mode="date" value={historyDate} onChange={(e) => setHistoryDate(e.detail.value)}>
              <View
                style={{
                  border: '1px solid #e7e5e4',
                  borderRadius: 4,
                  padding: '8px 16px',
                  background: '#f0fdfa',
                  cursor: 'pointer',
                }}
              >
                <Text style={{ fontSize: 14, color: '#0f766e' }}>{historyDate}</Text>
              </View>
            </Picker>
            <Text style={{ fontSize: 12, color: '#a8a29e' }}>查看指定日期的库存快照</Text>
          </View>
        )}
      </View>

      {/* Table */}
      <View
        style={{
          background: '#ffffff',
          border: '1px solid #e7e5e4',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        {/* Table Header */}
        <View
          style={{
            display: 'flex',
            padding: '12px 20px',
            fontSize: 12,
            fontWeight: 600,
            color: '#78716c',
            background: '#fafaf9',
            borderBottom: '1px solid #e7e5e4',
          }}
        >
          <Text style={{ flex: 2 }}>商品名称</Text>
          <Text style={{ flex: 1 }}>仓库</Text>
          <Text style={{ flex: 1 }}>{historyMode ? '当时库存' : '库存数量'}</Text>
          {historyMode && <Text style={{ flex: 1 }}>当前库存</Text>}
          <Text style={{ flex: 1 }}>成本单价</Text>
          <Text style={{ flex: 1 }}>最后更新</Text>
        </View>

        {loading && (
          <View
            style={{
              padding: '64px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 14, color: '#a8a29e' }}>加载中...</Text>
          </View>
        )}

        {!loading && records.length === 0 && (
          <View
            style={{
              padding: '64px 0',
              textAlign: 'center' as const,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: 500,
                color: '#57534e',
                display: 'block',
              }}
            >
              暂无库存记录
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: '#a8a29e',
                marginTop: 4,
                display: 'block',
              }}
            >
              尝试调整搜索条件或切换仓库
            </Text>
          </View>
        )}

        {!loading && records.length > 0 && (
          <View>
            {records.map((r, idx) => {
              const qty = historyMode ? Number(r.quantityAtDate || 0) : Number(r.quantity || 0);
              const badge = getStockBadge(qty);
              return (
                <View
                  key={r.id}
                  style={{
                    display: 'flex',
                    padding: '14px 20px',
                    alignItems: 'center',
                    fontSize: 14,
                    borderBottom:
                      idx < records.length - 1 ? '1px solid #f5f5f4' : 'none',
                  }}
                >
                  <Text style={{ flex: 2, fontWeight: 500, color: '#1c1917' }}>
                    {r.product?.name || r.productName || '-'}
                  </Text>
                  <Text style={{ flex: 1, color: '#78716c' }}>
                    {r.warehouse?.name || r.warehouseName || '-'}
                  </Text>
                  <Text style={{ flex: 1 }}>
                    <View
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '2px 10px',
                        borderRadius: 4,
                        backgroundColor: badge.bg,
                        fontSize: 12,
                        fontWeight: 500,
                        color: badge.color,
                      }}
                    >
                      <Text>{badge.label} {qty}</Text>
                    </View>
                  </Text>
                  {historyMode && (
                    <Text style={{ flex: 1, color: '#78716c' }}>
                      {Number(r.quantity || 0)}
                    </Text>
                  )}
                  <Text style={{ flex: 1, color: '#78716c' }}>
                    ¥{Number(r.unitCost || 0).toFixed(2)}
                  </Text>
                  <Text style={{ flex: 1, color: '#a8a29e', fontSize: 12 }}>
                    {r.updatedAt ? new Date(r.updatedAt).toLocaleDateString('zh-CN') : '-'}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Pagination */}
      {totalPages > 1 && (
        <View
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8,
            marginTop: 24,
          }}
        >
          <View
            style={{
              padding: '8px 16px',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 14,
              border: page <= 1 ? '1px solid #e7e5e4' : '1px solid #d6d3d1',
              background: page <= 1 ? '#f5f5f4' : '#ffffff',
              color: page <= 1 ? '#d6d3d1' : '#57534e',
            }}
            onClick={() => page > 1 && setPage(page - 1)}
          >
            <Text>← 上一页</Text>
          </View>

          <View className="flex items-center gap-1">
            {(() => {
              const pages: number[] = [];
              if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) pages.push(i);
              } else if (page <= 4) {
                for (let i = 1; i <= 7; i++) pages.push(i);
              } else if (page >= totalPages - 3) {
                for (let i = totalPages - 6; i <= totalPages; i++) pages.push(i);
              } else {
                for (let i = page - 3; i <= page + 3; i++) pages.push(i);
              }
              return pages.map((p) => (
                <View
                  key={p}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 14,
                    background: p === page ? '#0f766e' : 'transparent',
                    color: p === page ? '#ffffff' : '#57534e',
                    fontWeight: p === page ? 600 : 400,
                  }}
                  onClick={() => setPage(p)}
                >
                  <Text>{p}</Text>
                </View>
              ));
            })()}
          </View>

          <View
            style={{
              padding: '8px 16px',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 14,
              border:
                page >= totalPages ? '1px solid #e7e5e4' : '1px solid #d6d3d1',
              background: page >= totalPages ? '#f5f5f4' : '#ffffff',
              color: page >= totalPages ? '#d6d3d1' : '#57534e',
            }}
            onClick={() => page < totalPages && setPage(page + 1)}
          >
            <Text>下一页 →</Text>
          </View>

          <Text style={{ fontSize: 12, marginLeft: 8, color: '#a8a29e' }}>
            共 {totalPages} 页
          </Text>
        </View>
      )}
    </AppShell>
  );
}
