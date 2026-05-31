import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Statistic,
  Spin,
  Alert,
  Table,
  Tag,
  Button,
} from 'antd';
import {
  ShoppingCartOutlined,
  DollarOutlined,
  AppstoreOutlined,
  WarningOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons';
import { reportsApi } from '../../api/reports';
import type { DashboardData, PurchaseOrder, SaleOrder } from '../../types';
import dayjs from 'dayjs';

const purchaseStatusMap: Record<string, { color: string; text: string }> = {
  DRAFT: { color: 'default', text: '草稿' },
  CONFIRMED: { color: 'blue', text: '已确认' },
  RECEIVED: { color: 'green', text: '已入库' },
  CANCELLED: { color: 'red', text: '已作废' },
};

const saleStatusMap: Record<string, { color: string; text: string }> = {
  DRAFT: { color: 'default', text: '草稿' },
  CONFIRMED: { color: 'blue', text: '已确认' },
  DELIVERED: { color: 'green', text: '已出库' },
  CANCELLED: { color: 'red', text: '已作废' },
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await reportsApi.dashboard();
      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '加载Dashboard失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const todayStr = dayjs().format('YYYY-MM-DD');
  const monthStart = dayjs().startOf('month').format('YYYY-MM-DD');
  const monthEnd = dayjs().endOf('month').format('YYYY-MM-DD');

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
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

  if (!data) return null;

  const purchaseColumns = [
    {
      title: '单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      render: (_: string, record: PurchaseOrder) => (
        <a onClick={() => navigate(`/purchases/${record.id}`)}>{record.orderNo}</a>
      ),
    },
    {
      title: '供应商',
      key: 'supplier',
      render: (_: unknown, record: PurchaseOrder) => record.supplier?.name || '-',
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
        const m = purchaseStatusMap[s];
        return <Tag color={m?.color}>{m?.text || s}</Tag>;
      },
    },
    {
      title: '日期',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => dayjs(v).format('MM-DD HH:mm'),
    },
  ];

  const saleColumns = [
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
        const m = saleStatusMap[s];
        return <Tag color={m?.color}>{m?.text || s}</Tag>;
      },
    },
    {
      title: '日期',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => dayjs(v).format('MM-DD HH:mm'),
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={12} md={6}>
          <Card hoverable onClick={() => navigate(`/sales?startDate=${todayStr}&endDate=${todayStr}`)}>
            <Statistic
              title="今日销售额"
              value={data.todaySales}
              precision={2}
              prefix={<DollarOutlined />}
              suffix="元"
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card hoverable onClick={() => navigate(`/purchases?startDate=${todayStr}&endDate=${todayStr}`)}>
            <Statistic
              title="今日采购额"
              value={data.todayPurchases}
              precision={2}
              prefix={<ShoppingCartOutlined />}
              suffix="元"
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card hoverable>
            <Statistic
              title="商品总数"
              value={data.totalProducts}
              prefix={<AppstoreOutlined />}
              suffix="个"
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card hoverable style={{ cursor: 'pointer' }} onClick={() => navigate('/inventory?alerts=1')}>
            <Statistic
              title="库存预警"
              value={data.lowStockCount}
              prefix={<WarningOutlined />}
              valueStyle={{ color: data.lowStockCount > 0 ? '#dc2626' : undefined }}
              suffix="项"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12}>
          <Card hoverable onClick={() => navigate(`/sales?startDate=${monthStart}&endDate=${monthEnd}`)}>
            <Statistic
              title="本月销售额"
              value={data.monthlySales}
              precision={2}
              prefix={<RiseOutlined />}
              suffix="元"
              valueStyle={{ color: '#16a34a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card hoverable onClick={() => navigate(`/purchases?startDate=${monthStart}&endDate=${monthEnd}`)}>
            <Statistic
              title="本月采购额"
              value={data.monthlyPurchases}
              precision={2}
              prefix={<FallOutlined />}
              suffix="元"
              valueStyle={{ color: '#0f766e' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <Card title="最近采购单">
            {data.recentPurchases.length > 0 ? (
              <Table
                dataSource={data.recentPurchases}
                columns={purchaseColumns}
                rowKey="id"
                pagination={false}
                size="small"
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 24, color: '#a8a29e' }}>
                暂无采购记录
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="最近销售单">
            {data.recentSales.length > 0 ? (
              <Table
                dataSource={data.recentSales}
                columns={saleColumns}
                rowKey="id"
                pagination={false}
                size="small"
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 24, color: '#a8a29e' }}>
                暂无销售记录
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
