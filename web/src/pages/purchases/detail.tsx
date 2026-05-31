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
import { purchasesApi } from '../../api/purchases';
import type { PurchaseOrder, PurchaseItem } from '../../types';
import dayjs from 'dayjs';

const { Title } = Typography;

const statusMap: Record<string, { color: string; text: string }> = {
  DRAFT: { color: 'default', text: '草稿' },
  CONFIRMED: { color: 'blue', text: '已确认' },
  RECEIVED: { color: 'green', text: '已入库' },
  CANCELLED: { color: 'red', text: '已作废' },
};

export default function PurchasesDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [receiveModal, setReceiveModal] = useState<{ item: PurchaseItem; visible: boolean; quantity: number } | null>(null);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const result = await purchasesApi.getById(id);
      setOrder(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '加载采购单失败');
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

  const handleReceiveItem = async () => {
    if (!id || !receiveModal || !receiveModal.item) return;
    setActionLoading('receive-item');
    try {
      await purchasesApi.receiveItem(id, receiveModal.item.id, receiveModal.quantity);
      message.success('入库成功');
      setReceiveModal(null);
      fetchData();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '入库失败');
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
        title: '已入库',
        key: 'receivedQty',
        render: (_: unknown, record: PurchaseItem) => String(Number(record.receivedQty || 0)),
      },
      {
        title: '未入库',
        key: 'remaining',
        render: (_: unknown, record: PurchaseItem) => {
          const remaining = Number(record.quantity) - Number(record.receivedQty || 0);
          return remaining > 0 ? remaining : 0;
        },
      },
    ] : []),
    { title: '单价', dataIndex: 'unitCost', key: 'unitCost', render: (v: number) => `¥${Number(v).toFixed(2)}` },
    { title: '小计', dataIndex: 'subtotal', key: 'subtotal', render: (v: number) => `¥${Number(v).toFixed(2)}` },
    ...(order.status === 'CONFIRMED' ? [
      {
        title: '操作',
        key: 'actions',
        render: (_: unknown, record: PurchaseItem) => {
          const remaining = Number(record.quantity) - Number(record.receivedQty || 0);
          if (remaining <= 0) return <Tag color="green">已入库</Tag>;
          return (
            <Button
              type="link"
              size="small"
              onClick={() => setReceiveModal({ item: record, visible: true, quantity: remaining })}
            >
              入库
            </Button>
          );
        },
      },
    ] : []),
  ];

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>采购单详情</Title>
        <Space>
          {(order.status === 'DRAFT' || order.status === 'CONFIRMED') && (
            <Button onClick={() => navigate(`/purchases/${order.id}/edit`)}>编辑</Button>
          )}
          {order.status === 'DRAFT' && (
            <>
              <Popconfirm title="确定确认此采购单？" onConfirm={() => handleAction('confirm', () => purchasesApi.confirm(order.id))}>
                <Button type="primary" loading={actionLoading === 'confirm'}>确认</Button>
              </Popconfirm>
              <Popconfirm title="确定作废此采购单？" onConfirm={() => handleAction('cancel', () => purchasesApi.cancel(order.id))}>
                <Button danger loading={actionLoading === 'cancel'}>作废</Button>
              </Popconfirm>
            </>
          )}
          {order.status === 'CONFIRMED' && (
            <>
              <Popconfirm title="确定一键全部入库？" onConfirm={() => handleAction('receive', () => purchasesApi.receive(order.id))}>
                <Button type="primary" loading={actionLoading === 'receive'}>一键全部入库</Button>
              </Popconfirm>
              <Popconfirm title="确定作废此采购单？" onConfirm={() => handleAction('cancel', () => purchasesApi.cancel(order.id))}>
                <Button danger loading={actionLoading === 'cancel'}>作废</Button>
              </Popconfirm>
            </>
          )}
          <Button onClick={() => navigate('/purchases')}>返回列表</Button>
        </Space>
      </div>

      <Descriptions bordered column={2} size="small">
        <Descriptions.Item label="单号">{order.orderNo}</Descriptions.Item>
        <Descriptions.Item label="状态">
          <Tag color={statusInfo?.color}>{statusInfo?.text || order.status}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="供应商">{order.supplier?.name || '-'}</Descriptions.Item>
        <Descriptions.Item label="仓库">{order.warehouse?.name || '-'}</Descriptions.Item>
        <Descriptions.Item label="总金额">¥{Number(order.totalAmount).toFixed(2)}</Descriptions.Item>
        <Descriptions.Item label="备注">{order.remark || '-'}</Descriptions.Item>
        <Descriptions.Item label="创建时间">{dayjs(order.createdAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
        <Descriptions.Item label="更新时间">{dayjs(order.updatedAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
      </Descriptions>

      <Title level={5} style={{ marginTop: 24 }}>采购商品</Title>
      <Table dataSource={order.items || []} columns={itemColumns} rowKey="id" pagination={false} />

      <Modal
        title="入库"
        open={receiveModal?.visible}
        onCancel={() => setReceiveModal(null)}
        onOk={handleReceiveItem}
        confirmLoading={actionLoading === 'receive-item'}
      >
        <div style={{ padding: '16px 0' }}>
          <p>商品：{receiveModal?.item?.product?.name || '-'}</p>
          <p>订购数量：{receiveModal?.item?.quantity}</p>
          <p>已入库：{Number(receiveModal?.item?.receivedQty || 0)}</p>
          <p>未入库：{receiveModal ? Number(receiveModal.item.quantity) - Number(receiveModal.item.receivedQty || 0) : 0}</p>
          <div style={{ marginTop: 12 }}>
            <span>入库数量：</span>
            <InputNumber
              min={1}
              max={receiveModal ? Number(receiveModal.item.quantity) - Number(receiveModal.item.receivedQty || 0) : 0}
              value={receiveModal?.quantity}
              onChange={(v) => receiveModal && setReceiveModal({ ...receiveModal, quantity: v || 0 })}
              style={{ width: 160 }}
            />
          </div>
        </div>
      </Modal>
    </Card>
  );
}
