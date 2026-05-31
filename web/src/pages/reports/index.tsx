import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tabs,
  DatePicker,
  Statistic,
  Row,
  Col,
  Spin,
  Empty,
  Alert,
  Button,
  Typography,
} from 'antd';
import { reportsApi } from '../../api/reports';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

interface ReportRow {
  date: string;
  count: number;
  totalAmount: number;
  costAmount?: number;
  profit?: number;
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('purchases');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ReportRow[]>([]);
  const [dateRange, setDateRange] = useState<[string, string]>([
    dayjs().startOf('month').format('YYYY-MM-DD'),
    dayjs().endOf('month').format('YYYY-MM-DD'),
  ]);
  const [summary, setSummary] = useState<{ totalAmount: number; count: number } | null>(null);

  const fetchReport = async (tab: string) => {
    setLoading(true);
    setError(null);
    const [startDate, endDate] = dateRange;
    try {
      let result: ReportRow[];
      switch (tab) {
        case 'purchases':
          result = await reportsApi.purchases(startDate, endDate);
          break;
        case 'sales':
          result = await reportsApi.sales(startDate, endDate);
          break;
        case 'profit':
          result = await reportsApi.profit(startDate, endDate);
          break;
        case 'inventory':
          result = await reportsApi.inventoryValue();
          break;
        default:
          result = [];
      }
      setData(Array.isArray(result) ? result : []);
      if (Array.isArray(result) && result.length > 0) {
        const totalAmount = result.reduce((s, r) => s + (r.totalAmount || 0), 0);
        const count = result.reduce((s, r) => s + (r.count || 0), 0);
        setSummary({ totalAmount, count });
      } else {
        setSummary(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '加载报表失败');
      setData([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'inventory') {
      fetchReport(activeTab);
    } else {
      fetchReport('inventory');
    }
  }, [activeTab, dateRange]);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  const handleDateChange = (_: unknown, dateStrings: [string, string]) => {
    if (dateStrings[0] && dateStrings[1]) {
      setDateRange(dateStrings);
    }
  };

  const columns = [
    { title: '日期', dataIndex: 'date', key: 'date' },
    { title: '笔数', dataIndex: 'count', key: 'count' },
    { title: '金额', dataIndex: 'totalAmount', key: 'totalAmount', render: (v: number) => `¥${Number(v || 0).toFixed(2)}` },
  ];

  const profitColumns = [
    { title: '日期', dataIndex: 'date', key: 'date' },
    { title: '笔数', dataIndex: 'count', key: 'count' },
    { title: '销售收入', dataIndex: 'totalAmount', key: 'totalAmount', render: (v: number) => `¥${Number(v || 0).toFixed(2)}` },
    { title: '成本', dataIndex: 'costAmount', key: 'costAmount', render: (v: number | undefined) => `¥${Number(v || 0).toFixed(2)}` },
    { title: '利润', dataIndex: 'profit', key: 'profit', render: (v: number | undefined) => `¥${Number(v || 0).toFixed(2)}` },
  ];

  const inventoryColumns = [
    { title: '商品', dataIndex: 'productName', key: 'productName' },
    { title: '仓库', dataIndex: 'warehouseName', key: 'warehouseName' },
    { title: '数量', dataIndex: 'quantity', key: 'quantity' },
    { title: '成本单价', dataIndex: 'unitCost', key: 'unitCost', render: (v: number) => `¥${Number(v || 0).toFixed(2)}` },
    { title: '库存价值', key: 'value', render: (_: unknown, record: any) => `¥${(Number(record.quantity || 0) * Number(record.unitCost || 0)).toFixed(2)}` },
  ];

  const tabItems = [
    {
      key: 'purchases',
      label: '采购报表',
      children: (
        <>
          {summary && (
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Card><Statistic title="采购总额" value={summary.totalAmount} precision={2} prefix="¥" /></Card>
              </Col>
              <Col span={12}>
                <Card><Statistic title="采购笔数" value={summary.count} /></Card>
              </Col>
            </Row>
          )}
          <Table dataSource={data} columns={columns} rowKey="date" pagination={false} size="small" />
        </>
      ),
    },
    {
      key: 'sales',
      label: '销售报表',
      children: (
        <>
          {summary && (
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Card><Statistic title="销售总额" value={summary.totalAmount} precision={2} prefix="¥" /></Card>
              </Col>
              <Col span={12}>
                <Card><Statistic title="销售笔数" value={summary.count} /></Card>
              </Col>
            </Row>
          )}
          <Table dataSource={data} columns={columns} rowKey="date" pagination={false} size="small" />
        </>
      ),
    },
    {
      key: 'profit',
      label: '利润报表',
      children: (
        <>
          <Table dataSource={data} columns={profitColumns} rowKey="date" pagination={false} size="small" />
        </>
      ),
    },
    {
      key: 'inventory',
      label: '库存价值',
      children: (
        <>
          <Table
            dataSource={data}
            columns={inventoryColumns}
            rowKey={(r: any) => `${r.productId}_${r.warehouseId}`}
            pagination={false}
            size="small"
          />
        </>
      ),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <Title level={4} style={{ margin: 0 }}>报表</Title>
          {activeTab !== 'inventory' && (
            <RangePicker
              value={[dayjs(dateRange[0]), dayjs(dateRange[1])]}
              onChange={handleDateChange}
              allowClear={false}
            />
          )}
        </div>
      </Card>

      {error && (
        <Alert message="加载失败" description={error} type="error" showIcon style={{ marginBottom: 16 }}
          action={<Button onClick={() => fetchReport(activeTab)}>重试</Button>}
        />
      )}

      <Card>
        <Tabs activeKey={activeTab} onChange={handleTabChange} items={tabItems} />
      </Card>

      {loading && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
        </div>
      )}

      {!loading && !error && data.length === 0 && activeTab !== 'inventory' && (
        <Empty description="暂无报表数据" style={{ padding: 40 }} />
      )}
    </div>
  );
}
