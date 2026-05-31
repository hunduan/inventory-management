import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Table,
  Button,
  Input,
  Select,
  Spin,
  Empty,
  Alert,
  Pagination,
  message,
  Card,
  Modal,
  Tag,
} from 'antd';
import { SearchOutlined, WarningOutlined, BellOutlined } from '@ant-design/icons';
import { inventoryApi } from '../../api/inventory';
import { warehousesApi } from '../../api/warehouses';
import { productsApi } from '../../api/products';
import type { Inventory, InventoryLog, PaginatedResponse, Warehouse, Product } from '../../types';
import dayjs from 'dayjs';

const refTypeRouteMap: Record<string, string> = {
  PURCHASE_ORDER: '/purchases/',
  SALE_ORDER: '/sales/',
  TRANSFER: '/transfers/',
  STOCKTAKE: '/stocktakes/',
};

export default function InventoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PaginatedResponse<Inventory> | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [warehouseId, setWarehouseId] = useState<string | undefined>(undefined);
  const [alertCount, setAlertCount] = useState(0);
  const [alertMode, setAlertMode] = useState(() => searchParams.get('alerts') === '1');
  const [page, setPage] = useState(1);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [logLoading, setLogLoading] = useState(false);
  const [logProductId, setLogProductId] = useState<string | null>(null);
  const [logPage, setLogPage] = useState(1);
  const [logTotal, setLogTotal] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (productSearch) {
        const found = products.find((p) => p.name.includes(productSearch) || p.barcode === productSearch);
        if (found) params.set('productId', found.id);
      }
      if (warehouseId) params.set('warehouseId', warehouseId);
      params.set('page', String(page));
      params.set('limit', '20');
      if (alertMode) {
        params.set('threshold', '10');
        const result = await inventoryApi.alerts(params.toString());
        setData(result);
      } else {
        const result = await inventoryApi.list(params.toString());
        setData(result);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '加载库存失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchAlertsCount = async () => {
    try {
      const result = await inventoryApi.alerts('threshold=10&limit=1');
      setAlertCount(result.total);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    warehousesApi.list('limit=100').then((r) => setWarehouses(r.data)).catch(() => {});
    productsApi.list('limit=1000').then((r) => setProducts(r.data)).catch(() => {});
    fetchAlertsCount();
  }, []);

  useEffect(() => {
    fetchData();
  }, [page, warehouseId, alertMode]);

  const handleSearch = () => {
    setPage(1);
  };

  const fetchLogs = async (productId: string, pageNum: number) => {
    setLogLoading(true);
    try {
      const result = await inventoryApi.logs(`productId=${productId}&page=${pageNum}&limit=20`);
      setLogs(result.data);
      setLogTotal(result.total);
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '加载日志失败');
    } finally {
      setLogLoading(false);
    }
  };

  const showLogs = (productId: string) => {
    setLogProductId(productId);
    setLogPage(1);
    setLogModalOpen(true);
    fetchLogs(productId, 1);
  };

  // Group inventory records by product, sorted by latest update time desc
  const groups = useMemo(() => {
    if (!data?.data) return [];
    const map = new Map<string, Inventory[]>();
    for (const item of data.data) {
      const existing = map.get(item.productId);
      if (existing) {
        existing.push(item);
      } else {
        map.set(item.productId, [item]);
      }
    }
    return Array.from(map.entries())
      .map(([productId, items]) => ({
        productId,
        productName: items[0]?.product?.name || '-',
        items,
        totalQty: items.reduce((s, i) => s + Number(i.quantity), 0),
        latestUpdatedAt: items.reduce((latest, i) => i.updatedAt > latest ? i.updatedAt : latest, items[0]?.updatedAt || ''),
      }))
      .sort((a, b) => b.latestUpdatedAt.localeCompare(a.latestUpdatedAt));
  }, [data]);

  const columns: any[] = [
    {
      title: '商品',
      key: 'product',
      render: (_: unknown, record: typeof groups[0]) => (
        <div>
          <strong>{record.productName}</strong>
          {record.items.map((item) => (
            <div key={item.id} style={{ fontSize: 13, color: '#78716c', marginTop: 4, paddingLeft: 16, borderLeft: '2px solid #e7e5e4' }}>
              <span style={{ display: 'inline-block', width: 100 }}>{item.warehouse?.name || '-'}</span>
              <span style={{ display: 'inline-block', width: 80 }}>
                数量: {Number(item.quantity)}
                {Number(item.quantity) < 10 && <WarningOutlined style={{ color: '#dc2626', marginLeft: 4 }} />}
              </span>
              <span style={{ display: 'inline-block', width: 100 }}>成本: ¥{Number(item.unitCost).toFixed(2)}</span>
              <span>{dayjs(item.updatedAt).format('YYYY-MM-DD HH:mm')}</span>
              <span style={{ marginLeft: 12 }}>
                <Button type="link" size="small" style={{ fontSize: 12, padding: 0 }} onClick={() => navigate('/purchases/new?warehouseId=' + item.warehouseId + '&productId=' + record.productId)}>
                  采购
                </Button>
                <Button type="link" size="small" style={{ fontSize: 12, padding: 0, marginLeft: 8 }} onClick={() => navigate('/sales/new?warehouseId=' + item.warehouseId + '&productId=' + record.productId)}>
                  销售
                </Button>
              </span>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: '总数量',
      key: 'totalQty',
      align: 'center' as const,
      render: (_: unknown, record: typeof groups[0]) => (
        <span>
          {record.totalQty}
          {record.totalQty < 10 && <WarningOutlined style={{ color: '#dc2626', marginLeft: 4 }} />}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: typeof groups[0]) => (
        <span>
          <Button type="link" size="small" onClick={() => navigate('/sales/new?productId=' + record.productId)}>
            新建销售
          </Button>
          <Button type="link" size="small" onClick={() => navigate('/purchases/new?productId=' + record.productId)}>
            新建采购
          </Button>
          <Button type="link" size="small" onClick={() => showLogs(record.productId)}>
            日志
          </Button>
        </span>
      ),
    },
  ];

  const logColumns = [
    { title: '类型', dataIndex: 'type', key: 'type', render: (v: string) => <Tag>{v}</Tag> },
    { title: '数量', dataIndex: 'quantity', key: 'quantity', render: (v: number) => (v > 0 ? `+${v}` : v) },
    { title: '变动前', dataIndex: 'beforeQty', key: 'beforeQty' },
    { title: '变动后', dataIndex: 'afterQty', key: 'afterQty' },
    {
      title: '关联单据',
      key: 'refOrder',
      render: (_: unknown, record: InventoryLog) => {
        if (!record.refOrder) return '-';
        const typeLabel: Record<string, string> = { PURCHASE_ORDER: '采购', SALE_ORDER: '销售', TRANSFER: '调拨', STOCKTAKE: '盘点' };
        return (
          <span>
            <Tag>{typeLabel[record.refOrder.type] || record.refOrder.type}</Tag>
            {record.refOrder.orderNo}
            <span style={{ color: '#78716c', marginLeft: 4, fontSize: 12 }}>{record.refOrder.counterpartyName}</span>
          </span>
        );
      },
    },
    { title: '时间', dataIndex: 'createdAt', key: 'createdAt', render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm') },
    { title: '备注', dataIndex: 'remark', key: 'remark', render: (v: string | null) => v || '-' },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: InventoryLog) => {
        if (!record.refOrder || !record.refId) return null;
        const route = refTypeRouteMap[record.refOrder.type];
        if (!route) return null;
        return (
          <Button type="link" size="small" onClick={() => navigate(route + record.refId)}>
            查看详情
          </Button>
        );
      },
    },
  ];

  return (
    <div>
      {alertCount > 0 && (
        <Card style={{ marginBottom: 16, borderColor: '#dc2626' }}>
          <WarningOutlined style={{ fontSize: 18, color: '#dc2626', marginRight: 8 }} />
          <span style={{ color: '#dc2626' }}>
            有 {alertCount} 个商品库存数量低于预警阈值（10）
          </span>
        </Card>
      )}

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <Input
            placeholder="搜索商品名称/条码"
            prefix={<SearchOutlined />}
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 250 }}
            allowClear
          />
          <Select
            placeholder="选择仓库"
            value={warehouseId}
            onChange={(v) => setWarehouseId(v)}
            allowClear
            style={{ width: 180 }}
            options={warehouses.map((w) => ({ label: w.name, value: w.id }))}
          />
          <Button type="primary" onClick={handleSearch}>搜索</Button>
          <Button
            type={alertMode ? 'primary' : 'default'}
            danger={alertMode}
            icon={<BellOutlined />}
            onClick={() => {
              const newMode = !alertMode;
              setAlertMode(newMode);
              setPage(1);
              if (newMode) {
                setSearchParams({ alerts: '1' });
              } else {
                setSearchParams({});
              }
            }}
          >
            库存预警 {alertCount > 0 && `(${alertCount})`}
          </Button>
        </div>
      </Card>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
      ) : error ? (
        <Alert message="加载失败" description={error} type="error" showIcon action={<Button onClick={fetchData}>重试</Button>} />
      ) : data && data.data.length > 0 ? (
        <Card>
          <Table dataSource={groups} columns={columns} rowKey="productId" pagination={false} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <Pagination current={page} total={data.total} pageSize={20} onChange={(p) => setPage(p)} showTotal={(t) => `共 ${t} 条`} showSizeChanger={false} />
          </div>
        </Card>
      ) : (
        <Empty description="暂无库存数据" style={{ padding: 80 }} />
      )}

      <Modal title="库存变动日志" open={logModalOpen} onCancel={() => setLogModalOpen(false)} footer={null} width={1000}>
        {logLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
        ) : (
          <>
            <Table dataSource={logs} columns={logColumns} rowKey="id" pagination={false} size="small" />
            {logTotal > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                <Pagination current={logPage} total={logTotal} pageSize={20} onChange={(p) => { setLogPage(p); fetchLogs(logProductId!, p); }} showTotal={(t) => `共 ${t} 条`} showSizeChanger={false} />
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
