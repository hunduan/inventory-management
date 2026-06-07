import { useState, useEffect, useRef } from 'react';
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
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { stocktakeApi } from '../../api/stocktake';
import type { Stocktake, StocktakeItem } from '../../types';
import dayjs from 'dayjs';

const { Title } = Typography;

const statusMap: Record<string, { color: string; text: string }> = {
  DRAFT: { color: 'default', text: '草稿' },
  IN_PROGRESS: { color: 'processing', text: '进行中' },
  COMPLETED: { color: 'green', text: '已完成' },
  CANCELLED: { color: 'red', text: '已作废' },
};

export default function StocktakeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stocktake, setStocktake] = useState<Stocktake | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actualQuantities, setActualQuantities] = useState<Record<string, number>>({});
  const [dirtyItems, setDirtyItems] = useState<Set<string>>(new Set());
  const [_savingItems, setSavingItems] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const result = await stocktakeApi.getById(id);
      setStocktake(result);
      const qtyMap: Record<string, number> = {};
      result.items?.forEach((item) => {
        qtyMap[item.id] = item.actualQuantity;
      });
      setActualQuantities(qtyMap);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '加载盘点单失败');
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

  const handleSaveItem = async (itemId: string) => {
    if (!id) return;
    const qty = actualQuantities[itemId];
    if (qty === undefined) return;
    setSavingItems((prev) => new Set(prev).add(itemId));
    try {
      await stocktakeApi.updateItem(id, itemId, qty);
      setDirtyItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSavingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleComplete = async () => {
    if (!id) return;
    const items: Record<string, number> = {};
    for (const itemId of dirtyItems) {
      items[itemId] = actualQuantities[itemId];
    }
    await handleAction('complete', () => stocktakeApi.complete(id, Object.keys(items).length > 0 ? items : undefined));
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

  if (!stocktake) return null;

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    setImporting(true);
    try {
      await stocktakeApi.importItems(id, file);
      message.success('导入成功');
      fetchData();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '导入失败');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const statusInfo = statusMap[stocktake.status];
  const isInProgress = stocktake.status === 'IN_PROGRESS';

  const itemColumns = [
    { title: '商品', key: 'product', dataIndex: ['product', 'name'], render: (v: string | undefined) => v || '-' },
    { title: '账面数量', dataIndex: 'bookQuantity', key: 'bookQuantity' },
    {
      title: '实际数量',
      key: 'actualQuantity',
      render: (_: unknown, record: StocktakeItem) => (
        isInProgress ? (
          <InputNumber
            min={0}
            value={actualQuantities[record.id] ?? record.actualQuantity}
            onChange={(v) => {
              setActualQuantities((prev) => ({
                ...prev,
                [record.id]: v ?? 0,
              }));
              setDirtyItems((prev) => new Set(prev).add(record.id));
            }}
            onBlur={() => handleSaveItem(record.id)}
            style={{ width: 160 }}
          />
        ) : (
          <span>{actualQuantities[record.id] ?? record.actualQuantity}</span>
        )
      ),
    },
    {
      title: '差异',
      key: 'diffQuantity',
      render: (_: unknown, record: StocktakeItem) => {
        const actual = actualQuantities[record.id] ?? record.actualQuantity;
        const diff = actual - record.bookQuantity;
        return (
          <span style={{ color: diff !== 0 ? '#dc2626' : undefined }}>
            {diff > 0 ? `+${diff}` : diff}
          </span>
        );
      },
    },
  ];

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>盘点单详情</Title>
        <Space>
          {(stocktake.status === 'DRAFT' || stocktake.status === 'IN_PROGRESS') && (
            <>
              {stocktake.status === 'DRAFT' && (
                <Popconfirm title="确定开始盘点？" onConfirm={() => handleAction('start', () => stocktakeApi.start(stocktake.id))}>
                  <Button type="primary" loading={actionLoading === 'start'}>开始盘点</Button>
                </Popconfirm>
              )}
              {stocktake.status === 'IN_PROGRESS' && (
                <>
                  <Button icon={<UploadOutlined />} loading={importing} onClick={() => fileInputRef.current?.click()}>
                    导入盘点数据
                  </Button>
                  <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleImportFile} />
                </>
              )}
              {stocktake.status === 'IN_PROGRESS' && (
                <Popconfirm title="确定完成盘点？" onConfirm={handleComplete}>
                  <Button type="primary" loading={actionLoading === 'complete'}>完成盘点</Button>
                </Popconfirm>
              )}
              <Popconfirm title="确定作废此盘点单？" onConfirm={() => handleAction('cancel', () => stocktakeApi.cancel(stocktake.id))}>
                <Button danger loading={actionLoading === 'cancel'}>作废</Button>
              </Popconfirm>
            </>
          )}
          <Button onClick={() => navigate('/stocktakes')}>返回列表</Button>
        </Space>
      </div>

      <Descriptions bordered column={2} size="small">
        <Descriptions.Item label="盘点仓库">{stocktake.warehouse?.name || '-'}</Descriptions.Item>
        <Descriptions.Item label="状态">
          <Tag color={statusInfo?.color}>{statusInfo?.text || stocktake.status}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="备注">{stocktake.remark || '-'}</Descriptions.Item>
        <Descriptions.Item label="创建时间">{dayjs(stocktake.createdAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
      </Descriptions>

      <Title level={5} style={{ marginTop: 24 }}>盘点商品</Title>
      <Table dataSource={stocktake.items || []} columns={itemColumns} rowKey="id" pagination={false} />
    </Card>
  );
}
