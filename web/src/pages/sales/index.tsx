import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Table,
  Button,
  Select,
  Tag,
  Spin,
  Empty,
  Alert,
  Pagination,
  Card,
  DatePicker,
} from 'antd';
import { PlusOutlined, SearchOutlined, DownloadOutlined } from '@ant-design/icons';
import { salesApi } from '../../api/sales';
import { warehousesApi } from '../../api/warehouses';
import { productsApi } from '../../api/products';
import type { SaleOrder, PaginatedResponse, Warehouse, Product } from '../../types';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const statusMap: Record<string, { color: string; text: string }> = {
  DRAFT: { color: 'default', text: '草稿' },
  CONFIRMED: { color: 'blue', text: '已确认' },
  DELIVERED: { color: 'green', text: '已出库' },
  CANCELLED: { color: 'red', text: '已作废' },
};

export default function SalesList() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PaginatedResponse<SaleOrder> | null>(null);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [warehouseId, setWarehouseId] = useState<string | undefined>(undefined);
  const [productId, setProductId] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);

  const allRowKeys = data?.data.map((r) => r.id) ?? [];
  const isAllExpanded = expandedRowKeys.length === allRowKeys.length && allRowKeys.length > 0;

  const toggleExpandAll = () => {
    if (isAllExpanded) {
      setExpandedRowKeys([]);
    } else {
      setExpandedRowKeys(allRowKeys);
    }
  };

  useEffect(() => {
    Promise.all([
      warehousesApi.list('limit=100'),
      productsApi.list('limit=1000'),
    ]).then(([w, p]) => {
      setWarehouses(w.data);
      setProducts(p.data);
    }).catch(() => {});
  }, []);

  // Read URL date params from dashboard navigation on mount
  useEffect(() => {
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const hasNavDate = startDate && endDate;
    if (hasNavDate) {
      setDateRange([startDate, endDate]);
    }
    fetchData(hasNavDate ? { startDate, endDate } : undefined);
  }, []);

  const fetchData = async (navDateRange?: { startDate: string; endDate: string }) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (warehouseId) params.set('warehouseId', warehouseId);
      if (productId) params.set('productId', productId);
      const dr = navDateRange || dateRange;
      if (dr) {
        params.set('startDate', 'startDate' in dr ? dr.startDate : dr[0]);
        params.set('endDate', 'endDate' in dr ? dr.endDate : dr[1]);
      }
      params.set('page', String(page));
      params.set('limit', '20');
      const result = await salesApi.list(params.toString());
      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '加载销售单失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  // Re-fetch when page/status changes (not on initial mount)
  const didMount = useRef(false);
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    fetchData();
  }, [page, status]);

  const columns = [
    {
      title: '单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      render: (_: string, record: SaleOrder) => (
        <a onClick={() => navigate(`/sales/${record.id}`)}>{record.orderNo}</a>
      ),
    },
    {
      title: '客户',
      key: 'customer',
      render: (_: unknown, record: SaleOrder) => record.customer?.name || '-',
    },
    {
      title: '仓库',
      key: 'warehouse',
      render: (_: unknown, record: SaleOrder) => record.warehouse?.name || '-',
    },
    {
      title: '金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (v: number) => `¥${Number(v).toFixed(2)}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => {
        const m = statusMap[s];
        return <Tag color={m?.color}>{m?.text || s}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: SaleOrder) => (
        <Button type="link" size="small" onClick={() => navigate(`/sales/${record.id}`)}>
          查看
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <Select
            placeholder="选择仓库"
            value={warehouseId}
            onChange={(v) => setWarehouseId(v)}
            allowClear
            style={{ width: 160 }}
            options={warehouses.map((w) => ({ label: w.name, value: w.id }))}
          />
          <Select
            placeholder="选择商品"
            value={productId}
            onChange={(v) => setProductId(v)}
            allowClear
            showSearch
            filterOption={(input, option) =>
              (option?.label as string || '').toLowerCase().includes(input.toLowerCase())
            }
            style={{ width: 200 }}
            options={products.map((p) => ({ label: `${p.name}${p.barcode ? ` (${p.barcode})` : ''}`, value: p.id }))}
          />
          <RangePicker
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setDateRange([dates[0].toISOString(), dates[1].toISOString()]);
              } else {
                setDateRange(null);
              }
            }}
            style={{ width: 240 }}
          />
          <Select
            placeholder="状态筛选"
            value={status}
            onChange={(v) => { setStatus(v); setPage(1); }}
            allowClear
            style={{ width: 120 }}
            options={[
              { label: '草稿', value: 'DRAFT' },
              { label: '已确认', value: 'CONFIRMED' },
              { label: '已出库', value: 'DELIVERED' },
              { label: '已作废', value: 'CANCELLED' },
            ]}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>搜索</Button>
          <Button icon={<DownloadOutlined />} onClick={() => salesApi.exportExcel()}>导出</Button>
          <Button onClick={toggleExpandAll}>{isAllExpanded ? '全部收起' : '全部展开'}</Button>
          <div style={{ flex: 1 }} />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/sales/new')}>
            新增销售单
          </Button>
        </div>
      </Card>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <Spin size="large" />
        </div>
      ) : error ? (
        <Alert
          message="加载失败"
          description={error}
          type="error"
          showIcon
          action={<Button onClick={() => fetchData()}>重试</Button>}
        />
      ) : data && data.data.length > 0 ? (
        <Card>
          <div style={{ marginBottom: 12, color: '#78716c' }}>
            共 {data.total} 个销售单
          </div>
          <Table
            dataSource={data.data}
            columns={columns}
            rowKey="id"
            pagination={false}
            expandable={{
              expandedRowKeys,
              onExpandedRowsChange: (keys) => setExpandedRowKeys(keys as string[]),
              expandedRowRender: (record) => (
                <Table
                  dataSource={record.items || []}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  columns={[
                    { title: '商品', key: 'product', render: (_, item) => item.product?.name || '-' },
                    { title: '数量', dataIndex: 'quantity', key: 'quantity' },
                    { title: '单价', dataIndex: 'unitPrice', key: 'unitPrice', render: (v: number) => `¥${Number(v).toFixed(2)}` },
                    { title: '小计', dataIndex: 'subtotal', key: 'subtotal', render: (v: number) => `¥${Number(v).toFixed(2)}` },
                    { title: '已出库', dataIndex: 'deliveredQty', key: 'deliveredQty', render: (v: number) => v || 0 },
                  ]}
                />
              ),
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <Pagination
              current={page}
              total={data.total}
              pageSize={20}
              onChange={(p) => setPage(p)}
              showTotal={(t) => `共 ${t} 条`}
              showSizeChanger={false}
            />
          </div>
        </Card>
      ) : (
        <Empty description="暂无销售单" style={{ padding: 80 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/sales/new')}>
            新增销售单
          </Button>
        </Empty>
      )}
    </div>
  );
}
