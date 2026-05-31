import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Form,
  Select,
  InputNumber,
  Button,
  Input,
  Table,
  message,
  Typography,
} from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { transfersApi } from '../../api/transfers';
import { warehousesApi } from '../../api/warehouses';
import { productsApi } from '../../api/products';
import type { Warehouse, Product } from '../../types';

const { Title } = Typography;

interface LineItem {
  key: string;
  productId: string;
  productName: string;
  quantity: number;
}

export default function TransfersNew() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<LineItem[]>([]);
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    Promise.all([
      warehousesApi.list('limit=100'),
      productsApi.list('limit=200'),
    ]).then(([w, p]) => {
      setWarehouses(w.data);
      setProducts(p.data);
    }).catch(() => message.error('加载基础数据失败'));
  }, []);

  const filteredProducts = products.filter(
    (p) =>
      p.enabled &&
      (p.name.includes(productSearch) ||
        (p.barcode && p.barcode.includes(productSearch))),
  );

  const addItem = (product: Product) => {
    if (items.find((i) => i.productId === product.id)) {
      message.warning('商品已添加');
      return;
    }
    const newItem: LineItem = {
      key: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      productId: product.id,
      productName: product.name,
      quantity: 1,
    };
    setItems([...items, newItem]);
    setProductSearch('');
  };

  const updateQuantity = (key: string, quantity: number) => {
    setItems(
      items.map((item) =>
        item.key === key ? { ...item, quantity } : item,
      ),
    );
  };

  const removeItem = (key: string) => {
    setItems(items.filter((i) => i.key !== key));
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (values.fromWarehouseId === values.toWarehouseId) {
      message.error('调出仓库和调入仓库不能相同');
      return;
    }
    if (items.length === 0) {
      message.error('请至少添加一个商品');
      return;
    }
    setSubmitting(true);
    try {
      await transfersApi.create({
        fromWarehouseId: values.fromWarehouseId,
        toWarehouseId: values.toWarehouseId,
        remark: values.remark,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      });
      message.success('调拨单已创建');
      navigate('/transfers');
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  const itemColumns = [
    { title: '商品', dataIndex: 'productName', key: 'productName' },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (_: unknown, record: LineItem) => (
        <InputNumber
          min={0.01}
          value={record.quantity}
          onChange={(v) => updateQuantity(record.key, v ?? 0)}
          style={{ width: 100 }}
        />
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: LineItem) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeItem(record.key)}
        />
      ),
    },
  ];

  return (
    <Card>
      <Title level={4} style={{ marginBottom: 24 }}>新增调拨单</Title>
      <Form form={form} layout="vertical" style={{ maxWidth: 800 }}>
        <Form.Item name="fromWarehouseId" label="调出仓库" rules={[{ required: true, message: '请选择调出仓库' }]}>
          <Select
            placeholder="选择调出仓库"
            options={warehouses.map((w) => ({ label: w.name, value: w.id }))}
          />
        </Form.Item>
        <Form.Item name="toWarehouseId" label="调入仓库" rules={[{ required: true, message: '请选择调入仓库' }]}>
          <Select
            placeholder="选择调入仓库"
            options={warehouses.map((w) => ({ label: w.name, value: w.id }))}
          />
        </Form.Item>

        <div style={{ marginBottom: 16 }}>
          <Title level={5}>调拨商品</Title>
          <Select
            placeholder="搜索并选择商品"
            value={undefined}
            onChange={(v) => {
              const product = products.find((p) => p.id === v);
              if (product) addItem(product);
            }}
            onSearch={setProductSearch}
            showSearch
            filterOption={false}
            style={{ width: '100%' }}
            notFoundContent={null}
            options={filteredProducts.map((p) => ({
              label: `${p.name}${p.barcode ? ` (${p.barcode})` : ''}`,
              value: p.id,
            }))}
          />
        </div>

        <Table
          dataSource={items}
          columns={itemColumns}
          rowKey="key"
          pagination={false}
        />

        <Form.Item name="remark" label="备注" style={{ marginTop: 16 }}>
          <Input.TextArea rows={2} placeholder="备注" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" onClick={handleSubmit} loading={submitting} style={{ marginRight: 12 }}>
            创建调拨单
          </Button>
          <Button onClick={() => navigate('/transfers')}>取消</Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
