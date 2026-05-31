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
import { transfersApi } from '../../api/transfers';
import type { Transfer, PaginatedResponse } from '../../types';
import dayjs from 'dayjs';

const statusMap: Record<string, { color: string; text: string }> = {
  DRAFT: { color: 'default', text: '草稿' },
  CONFIRMED: { color: 'blue', text: '已确认' },
  COMPLETED: { color: 'green', text: '已完成' },
  CANCELLED: { color: 'red', text: '已作废' },
};

export default function TransfersList() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PaginatedResponse<Transfer> | null>(null);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      params.set('page', String(page));
      params.set('limit', '20');
      const result = await transfersApi.list(params.toString());
      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '加载调拨单失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, status]);

  const columns = [
    { title: '调出仓库', key: 'fromWarehouse', render: (_: unknown, record: Transfer) => record.fromWarehouse?.name || '-' },
    { title: '调入仓库', key: 'toWarehouse', render: (_: unknown, record: Transfer) => record.toWarehouse?.name || '-' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => { const m = statusMap[s]; return <Tag color={m?.color}>{m?.text || s}</Tag>; } },
    { title: '备注', dataIndex: 'remark', key: 'remark', render: (v: string | null) => v || '-' },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm') },
    { title: '操作', key: 'actions', render: (_: unknown, record: Transfer) => (
      <Button type="link" size="small" onClick={() => navigate(`/transfers/${record.id}`)}>查看</Button>
    )},
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <Select placeholder="状态筛选" value={status} onChange={(v) => { setStatus(v); setPage(1); }} allowClear style={{ width: 150 }}
            options={[
              { label: '草稿', value: 'DRAFT' },
              { label: '已确认', value: 'CONFIRMED' },
              { label: '已完成', value: 'COMPLETED' },
              { label: '已作废', value: 'CANCELLED' },
            ]}
          />
          <div style={{ flex: 1 }} />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/transfers/new')}>新增调拨</Button>
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
          <Empty description="暂无调拨单" style={{ padding: 80 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/transfers/new')}>新增调拨</Button>
          </Empty>
        )}
    </div>
  );
}
