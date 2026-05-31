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
  InputNumber,
  Modal,
} from 'antd';
import { salesApi } from '../../api/sales';
import type { SaleOrder, SaleItem } from '../../types';
import dayjs from 'dayjs';

const { Title } = Typography;

const statusMap: Record<string, { color: string; text: string }> = {
  DRAFT: { color: 'default', text: '草稿' },
  CONFIRMED: { color: 'blue', text: '已确认' },
  DELIVERED: { color: 'green', text: '已出库' },
  CANCELLED: { color: 'red', text: '已作废' },
};

export default function SalesDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<SaleOrder | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deliverModal, setDeliverModal] = useState<{ item: SaleItem; visible: boolean; quantity: number } | null>(null);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const result = await salesApi.getById(id);
      setOrder(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '加载销售单失败');
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

  const handleDeliverItem = async () => {
    if (!id || !deliverModal || !deliverModal.item) return;
    setActionLoading('deliver-item');
    try {
      await salesApi.deliverItem(id, deliverModal.item.id, deliverModal.quantity);
      message.success('出库成功');
      setDeliverModal(null);
      fetchData();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '出库失败');
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

  if (!order) return null;

  const statusInfo = statusMap[order.status];

  const itemColumns = [
    { title: '商品', key: 'product', dataIndex: ['product', 'name'], render: (v: string | undefined) => v || '-' },
    { title: '订购数量', dataIndex: 'quantity', key: 'quantity' },
    ...(order.status === 'CONFIRMED' ? [
      {
        title: '已出库',
        key: 'deliveredQty',
        render: (_: unknown, record: SaleItem) => String(Number(record.deliveredQty || 0)),
      },
      {
        title: '未出库',
        key: 'remaining',
        render: (_: unknown, record: SaleItem) => {
          const remaining = Number(record.quantity) - Number(record.deliveredQty || 0);
          return remaining > 0 ? remaining : 0;
        },
      },
    ] : []),
    { title: '单价', dataIndex: 'unitPrice', key: 'unitPrice', render: (v: number) => `¥${Number(v).toFixed(2)}` },
    { title: '小计', dataIndex: 'subtotal', key: 'subtotal', render: (v: number) => `¥${Number(v).toFixed(2)}` },
    ...(order.status === 'CONFIRMED' ? [
      {
        title: '操作',
        key: 'actions',
        render: (_: unknown, record: SaleItem) => {
          const remaining = Number(record.quantity) - Number(record.deliveredQty || 0);
          if (remaining <= 0) return <Tag color="green">已出库</Tag>;
          return (
            <Button
              type="link"
              size="small"
              onClick={() => setDeliverModal({ item: record, visible: true, quantity: remaining })}
            >
              出库
            </Button>
          );
        },
      },
    ] : []),
  ];

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>销售单详情</Title>
        <Space>
          {(order.status === 'DRAFT' || order.status === 'CONFIRMED') && (
            <Button onClick={() => navigate(`/sales/${order.id}/edit`)}>编辑</Button>
          )}
          {order.status === 'DRAFT' && (
            <>
              <Popconfirm title="确定确认此销售单？" onConfirm={() => handleAction('confirm', () => salesApi.confirm(order.id))}>
                <Button type="primary" loading={actionLoading === 'confirm'}>确认</Button>
              </Popconfirm>
              <Popconfirm title="确定作废此销售单？" onConfirm={() => handleAction('cancel', () => salesApi.cancel(order.id))}>
                <Button danger loading={actionLoading === 'cancel'}>作废</Button>
              </Popconfirm>
            </>
          )}
          {order.status === 'CONFIRMED' && (
            <>
              <Popconfirm title="确定一键全部出库？" onConfirm={() => handleAction('deliver', () => salesApi.deliver(order.id))}>
                <Button type="primary" loading={actionLoading === 'deliver'}>一键全部出库</Button>
              </Popconfirm>
              <Popconfirm title="确定作废此销售单？" onConfirm={() => handleAction('cancel', () => salesApi.cancel(order.id))}>
                <Button danger loading={actionLoading === 'cancel'}>作废</Button>
              </Popconfirm>
            </>
          )}
          <Button onClick={() => navigate('/sales')}>返回列表</Button>
        </Space>
      </div>

      <Descriptions bordered column={2} size="small">
        <Descriptions.Item label="单号">{order.orderNo}</Descriptions.Item>
        <Descriptions.Item label="状态">
          <Tag color={statusInfo?.color}>{statusInfo?.text || order.status}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="客户">{order.customer?.name || '-'}</Descriptions.Item>
        <Descriptions.Item label="仓库">{order.warehouse?.name || '-'}</Descriptions.Item>
        <Descriptions.Item label="总金额">¥{Number(order.totalAmount).toFixed(2)}</Descriptions.Item>
        <Descriptions.Item label="备注">{order.remark || '-'}</Descriptions.Item>
        <Descriptions.Item label="创建时间">{dayjs(order.createdAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
        <Descriptions.Item label="更新时间">{dayjs(order.updatedAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
      </Descriptions>

      <Title level={5} style={{ marginTop: 24 }}>销售商品</Title>
      <Table dataSource={order.items || []} columns={itemColumns} rowKey="id" pagination={false} />

      <Modal
        title="出库"
        open={deliverModal?.visible}
        onCancel={() => setDeliverModal(null)}
        onOk={handleDeliverItem}
        confirmLoading={actionLoading === 'deliver-item'}
      >
        <div style={{ padding: '16px 0' }}>
          <p>商品：{deliverModal?.item?.product?.name || '-'}</p>
          <p>订购数量：{deliverModal?.item?.quantity}</p>
          <p>已出库：{Number(deliverModal?.item?.deliveredQty || 0)}</p>
          <p>未出库：{deliverModal ? Number(deliverModal.item.quantity) - Number(deliverModal.item.deliveredQty || 0) : 0}</p>
          <div style={{ marginTop: 12 }}>
            <span>出库数量：</span>
            <InputNumber
              min={1}
              max={deliverModal ? Number(deliverModal.item.quantity) - Number(deliverModal.item.deliveredQty || 0) : 0}
              value={deliverModal?.quantity}
              onChange={(v) => deliverModal && setDeliverModal({ ...deliverModal, quantity: v || 0 })}
              style={{ width: 160 }}
            />
          </div>
        </div>
      </Modal>
    </Card>
  );
}
