import { useState, useEffect } from 'react';
import { View, Text, Input, Picker, Switch } from '@tarojs/components';
import AppShell from '../../../components/layout/app-shell';
import { inventoryApi } from '../../../services/inventory';
import { warehousesApi } from '../../../services/warehouses';
import Taro from '@tarojs/taro';

interface StockTag {
  label: string;
  dot: string;
}

const getStockTag = (qty: number): StockTag => {
  if (qty <= 0) return { label: '缺货', dot: '#dc2626' };
  if (qty <= 10) return { label: '偏低', dot: '#d97706' };
  return { label: '正常', dot: '#16a34a' };
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
          <Text className="page-title">库存管理</Text>
          <Text className="page-subtitle">共 {total} 条库存记录</Text>
        </View>

        <View className="flex items-center gap-2">
          <Text className="text-xs font-medium" style={{ color: historyMode ? '#0f766e' : '#a8a29e' }}>
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
      <View
        className="rounded-xl p-5 mb-6"
        style={{ background: '#ffffff', border: '1px solid #e7e5e4' }}
      >
        <View className="flex gap-3 items-center flex-wrap">
          <View className="flex-1 min-w-[200px] relative">
            <View
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1,
                fontSize: 14,
                color: '#a8a29e',
                pointerEvents: 'none',
              }}
            >
              🔍
            </View>
            <Input
              className="input-field"
              style={{ paddingLeft: 36 }}
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
              className="flex items-center gap-1 rounded-lg px-4 py-2.5 cursor-pointer"
              style={{
                border: '1px solid #e7e5e4',
                background: '#fafaf9',
                minWidth: 130,
              }}
            >
              <Text className="text-sm" style={{ color: '#78716c' }}>
                {warehouseNames[warehouseIndex] || '选择仓库'}
              </Text>
              <Text style={{ color: '#a8a29e', marginLeft: 4, fontSize: 10 }}>▼</Text>
            </View>
          </Picker>

          <View
            className="px-5 py-2.5 rounded-lg cursor-pointer text-sm font-medium"
            style={{
              background: '#0f766e',
              color: 'white',
              transition: 'background 0.2s ease',
            }}
            onClick={handleSearch}
          >
            <Text>搜索</Text>
          </View>
        </View>

        {historyMode && (
          <View className="flex items-center gap-3 mt-4 pt-4" style={{ borderTop: '1px solid #f5f5f4' }}>
            <Text className="text-xs font-medium" style={{ color: '#78716c' }}>选择日期</Text>
            <Picker mode="date" value={historyDate} onChange={(e) => setHistoryDate(e.detail.value)}>
              <View
                className="rounded-lg px-4 py-2 cursor-pointer"
                style={{ border: '1px solid #e7e5e4', background: '#f0fdfa' }}
              >
                <Text className="text-sm" style={{ color: '#0f766e' }}>{historyDate}</Text>
              </View>
            </Picker>
            <Text className="text-xs" style={{ color: '#a8a29e' }}>查看指定日期的库存快照</Text>
          </View>
        )}
      </View>

      {/* Table */}
      <View
        className="rounded-xl overflow-hidden"
        style={{ background: '#ffffff', border: '1px solid #e7e5e4' }}
      >
        <View className="table-header">
          <Text className="flex-[2]">商品名称</Text>
          <Text className="flex-1">仓库</Text>
          <Text className="flex-1">{historyMode ? '当时库存' : '库存数量'}</Text>
          {historyMode && <Text className="flex-1">当前库存</Text>}
          <Text className="flex-1">成本单价</Text>
          <Text className="flex-1">最后更新</Text>
        </View>

        {loading && (
          <View className="py-16 flex items-center justify-center">
            <View className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  className="loading-dot"
                  style={{ width: 8, height: 8, borderRadius: 9999, background: '#0f766e' }}
                />
              ))}
            </View>
          </View>
        )}

        {!loading && records.length === 0 && (
          <View className="py-16 text-center">
            <Text style={{ fontSize: 40, display: 'block' }}>📦</Text>
            <Text className="text-base font-medium mt-3" style={{ color: '#57534e' }}>暂无库存记录</Text>
            <Text className="text-sm mt-1" style={{ color: '#a8a29e' }}>尝试调整搜索条件或切换仓库</Text>
          </View>
        )}

        {!loading && records.length > 0 && (
          <View>
            {records.map((r, idx) => {
              const qty = historyMode ? Number(r.quantityAtDate || 0) : Number(r.quantity || 0);
              const tag = getStockTag(qty);
              return (
                <View
                  key={r.id}
                  className="flex px-5 py-3.5 items-center text-sm"
                  style={{
                    background: idx % 2 === 0 ? '#ffffff' : '#fafaf9',
                    borderBottom: idx < records.length - 1 ? '1px solid #f5f5f4' : 'none',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <Text className="flex-[2] font-medium" style={{ color: '#292524' }}>
                    {r.product?.name || r.productName || '-'}
                  </Text>
                  <Text className="flex-1" style={{ color: '#78716c' }}>
                    {r.warehouse?.name || r.warehouseName || '-'}
                  </Text>
                  <Text className="flex-1">
                    <View
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full"
                      style={{
                        background:
                          qty <= 0 ? '#fef2f2' :
                          qty <= 10 ? '#fffbeb' :
                          '#f0fdf4',
                        fontSize: 12,
                        fontWeight: 500,
                        color:
                          qty <= 0 ? '#dc2626' :
                          qty <= 10 ? '#d97706' :
                          '#16a34a',
                      }}
                    >
                      <View style={{ width: 6, height: 6, borderRadius: 9999, background: tag.dot }} />
                      <Text>{tag.label} {qty}</Text>
                    </View>
                  </Text>
                  {historyMode && (
                    <Text className="flex-1" style={{ color: '#78716c' }}>
                      {Number(r.quantity || 0)}
                    </Text>
                  )}
                  <Text className="flex-1" style={{ color: '#78716c' }}>
                    ¥{Number(r.unitCost || 0).toFixed(2)}
                  </Text>
                  <Text className="flex-1" style={{ color: '#a8a29e', fontSize: 12 }}>
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
        <View className="flex justify-center items-center gap-2 mt-6">
          <View
            className="px-4 py-2 rounded-lg cursor-pointer text-sm"
            style={{
              border: page <= 1 ? '1px solid #e7e5e4' : '1px solid #d6d3d1',
              background: page <= 1 ? '#f5f5f4' : '#ffffff',
              color: page <= 1 ? '#d6d3d1' : '#57534e',
              transition: 'all 0.15s ease',
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
                  className="px-3 py-2 rounded-lg cursor-pointer text-sm"
                  style={{
                    background: p === page ? '#0f766e' : 'transparent',
                    color: p === page ? '#ffffff' : '#57534e',
                    fontWeight: p === page ? 600 : 400,
                    transition: 'all 0.15s ease',
                  }}
                  onClick={() => setPage(p)}
                >
                  <Text>{p}</Text>
                </View>
              ));
            })()}
          </View>

          <View
            className="px-4 py-2 rounded-lg cursor-pointer text-sm"
            style={{
              border: page >= totalPages ? '1px solid #e7e5e4' : '1px solid #d6d3d1',
              background: page >= totalPages ? '#f5f5f4' : '#ffffff',
              color: page >= totalPages ? '#d6d3d1' : '#57534e',
            }}
            onClick={() => page < totalPages && setPage(page + 1)}
          >
            <Text>下一页 →</Text>
          </View>

          <Text className="text-xs ml-2" style={{ color: '#a8a29e' }}>共 {totalPages} 页</Text>
        </View>
      )}
    </AppShell>
  );
}
