import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Table,
  Tag,
  Button,
  Space,
  Spin,
  Alert,
  message,
  Typography,
  Popconfirm,
} from 'antd';
import { transfersApi } from '../../api/transfers';
import type { Transfer } from '../../types';
import dayjs from 'dayjs';

const { Title } = Typography;

const statusMap: Record<string, { color: string; text: string }> = {
  DRAFT: { color: 'default', text: '草稿' },
  CONFIRMED: { color: 'blue', text: '已确认' },
  COMPLETED: { color: 'green', text: '已完成' },
  CANCELLED: { color: 'red', text: '已作废' },
};

export default function TransfersDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transfer, setTransfer] = useState<Transfer | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const result = await transfersApi.getById(id);
      setTransfer(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '加载调拨单失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleAction = async (action: string, apiFn: () => Promise<unknown>) => {
    if (!id) return;
    setActionLoading(action);
    try {
      await apiFn();
      message.success('操作成功');
      fetchData();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '操作失败');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
  }

  if (error) {
    return (
      <Alert
        message="加载失败"
        description={error}
        type="error"
        showIcon
        action={<Button onClick={fetchData}>重试</Button>}
      />
    );
  }

  if (!transfer) return null;

  const statusInfo = statusMap[transfer.status];

  const itemColumns = [
    { title: '商品', key: 'product', dataIndex: ['product', 'name'], render: (v: string | undefined) => v || '-' },
    { title: '数量', dataIndex: 'quantity', key: 'quantity' },
  ];

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>调拨单详情</Title>
        <Space>
          {transfer.status === 'DRAFT' && (
            <>
              <Popconfirm title="确定确认此调拨单？" onConfirm={() => handleAction('confirm', () => transfersApi.confirm(transfer.id))}>
                <Button type="primary" loading={actionLoading === 'confirm'}>确认</Button>
              </Popconfirm>
              <Popconfirm title="确定作废此调拨单？" onConfirm={() => handleAction('cancel', () => transfersApi.cancel(transfer.id))}>
                <Button danger loading={actionLoading === 'cancel'}>作废</Button>
              </Popconfirm>
            </>
          )}
          {transfer.status === 'CONFIRMED' && (
            <>
              <Popconfirm title="确定完成调拨？" onConfirm={() => handleAction('complete', () => transfersApi.complete(transfer.id))}>
                <Button type="primary" loading={actionLoading === 'complete'}>完成调拨</Button>
              </Popconfirm>
              <Popconfirm title="确定作废此调拨单？" onConfirm={() => handleAction('cancel', () => transfersApi.cancel(transfer.id))}>
                <Button danger loading={actionLoading === 'cancel'}>作废</Button>
              </Popconfirm>
            </>
          )}
          <Button onClick={() => navigate('/transfers')}>返回列表</Button>
        </Space>
      </div>

      <Descriptions bordered column={2} size="small">
        <Descriptions.Item label="状态">
          <Tag color={statusInfo?.color}>{statusInfo?.text || transfer.status}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="调出仓库">{transfer.fromWarehouse?.name || '-'}</Descriptions.Item>
        <Descriptions.Item label="调入仓库">{transfer.toWarehouse?.name || '-'}</Descriptions.Item>
        <Descriptions.Item label="备注">{transfer.remark || '-'}</Descriptions.Item>
        <Descriptions.Item label="创建时间">{dayjs(transfer.createdAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
        <Descriptions.Item label="更新时间">{dayjs(transfer.updatedAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
      </Descriptions>

      <Title level={5} style={{ marginTop: 24 }}>调拨商品</Title>
      <Table dataSource={transfer.items || []} columns={itemColumns} rowKey="id" pagination={false} />
    </Card>
  );
}
