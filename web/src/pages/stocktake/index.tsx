import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { stocktakeApi } from '../../api/stocktake';
import { warehousesApi } from '../../api/warehouses';
import type { Stocktake, PaginatedResponse, Warehouse } from '../../types';
import dayjs from 'dayjs';

const statusMap: Record<string, { color: string; text: string }> = {
  DRAFT: { color: 'default', text: '草稿' },
  IN_PROGRESS: { color: 'processing', text: '进行中' },
  COMPLETED: { color: 'green', text: '已完成' },
  CANCELLED: { color: 'red', text: '已作废' },
};

export default function StocktakeList() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PaginatedResponse<Stocktake> | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [warehouseId, setWarehouseId] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (warehouseId) params.set('warehouseId', warehouseId);
      params.set('page', String(page));
      params.set('limit', '20');
      const result = await stocktakeApi.list(params.toString());
      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '加载盘点单失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    warehousesApi.list('limit=100').then((r) => setWarehouses(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    fetchData();
  }, [page, status, warehouseId]);

  const columns = [
    { title: '仓库', key: 'warehouse', render: (_: unknown, record: Stocktake) => record.warehouse?.name || '-' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => { const m = statusMap[s]; return <Tag color={m?.color}>{m?.text || s}</Tag>; } },
    { title: '备注', dataIndex: 'remark', key: 'remark', render: (v: string | null) => v || '-' },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm') },
    { title: '操作', key: 'actions', render: (_: unknown, record: Stocktake) => (
      <Button type="link" size="small" onClick={() => navigate(`/stocktakes/${record.id}`)}>查看</Button>
    )},
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <Select placeholder="状态筛选" value={status} onChange={(v) => { setStatus(v); setPage(1); }} allowClear style={{ width: 150 }}
            options={[
              { label: '草稿', value: 'DRAFT' },
              { label: '进行中', value: 'IN_PROGRESS' },
              { label: '已完成', value: 'COMPLETED' },
              { label: '已作废', value: 'CANCELLED' },
            ]}
          />
          <Select placeholder="选择仓库" value={warehouseId} onChange={(v) => { setWarehouseId(v); setPage(1); }} allowClear style={{ width: 180 }}
            options={warehouses.map((w) => ({ label: w.name, value: w.id }))}
          />
          <div style={{ flex: 1 }} />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/stocktakes/new')}>新增盘点</Button>
        </div>
      </Card>

      {loading ? <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
        : error ? <Alert message="加载失败" description={error} type="error" showIcon action={<Button onClick={fetchData}>重试</Button>} />
        : data && data.data.length > 0 ? (
          <Card>
            <Table dataSource={data.data} columns={columns} rowKey="id" pagination={false} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <Pagination current={page} total={data.total} pageSize={20} onChange={(p) => setPage(p)} showTotal={(t) => `共 ${t} 条`} showSizeChanger={false} />
            </div>
          </Card>
        ) : (
          <Empty description="暂无盘点单" style={{ padding: 80 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/stocktakes/new')}>新增盘点</Button>
          </Empty>
        )}
    </div>
  );
}
