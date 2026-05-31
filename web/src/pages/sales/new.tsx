import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
  Spin,
  Alert,
} from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { salesApi } from '../../api/sales';
import { customersApi } from '../../api/customers';
import { warehousesApi } from '../../api/warehouses';
import { productsApi } from '../../api/products';
import type { Customer, Warehouse, Product } from '../../types';

const { Title } = Typography;

interface LineItem {
  key: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export default function SalesNew() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<LineItem[]>([]);
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    Promise.all([
      customersApi.list('limit=100'),
      warehousesApi.list('limit=100'),
      productsApi.list('limit=200'),
    ]).then(([c, w, p]) => {
      setCustomers(c.data);
      setWarehouses(w.data);
      setProducts(p.data);
      const prefillProductId = searchParams.get('productId');
      const prefillWarehouseId = searchParams.get('warehouseId');
      if (prefillWarehouseId) {
        form.setFieldsValue({ warehouseId: prefillWarehouseId });
      }
      if (prefillProductId) {
        const product = p.data.find((prod) => prod.id === prefillProductId && prod.enabled);
        if (product && !items.find((i) => i.productId === product.id)) {
          setItems([{
            key: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
            productId: product.id,
            productName: product.name,
            quantity: 1,
            unitPrice: Number(product.salePrice),
            subtotal: Number(product.salePrice),
          }]);
        }
      }
      if (isEdit && id) {
        salesApi.getById(id).then((order) => {
          form.setFieldsValue({
            customerId: order.customerId,
            warehouseId: order.warehouseId,
            remark: order.remark,
          });
          setItems(
            (order.items || []).map((item) => ({
              key: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
              productId: item.productId,
              productName: item.product?.name || '',
              quantity: Number(item.quantity),
              unitPrice: Number(item.unitPrice),
              subtotal: Number(item.subtotal),
            }))
          );
          setLoading(false);
        }).catch((err) => {
          setError(err instanceof Error ? err.message : '加载销售单失败');
          setLoading(false);
        });
      }
    }).catch(() => message.error('加载基础数据失败'));
  }, [id]);

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
      unitPrice: Number(product.salePrice),
      subtotal: Number(product.salePrice),
    };
    setItems([...items, newItem]);
    setProductSearch('');
  };

  const updateItem = (key: string, field: keyof LineItem, value: number) => {
    setItems(
      items.map((item) => {
        if (item.key !== key) return item;
        const updated = { ...item, [field]: value };
        updated.subtotal = updated.quantity * updated.unitPrice;
        return updated;
      }),
    );
  };

  const removeItem = (key: string) => {
    setItems(items.filter((i) => i.key !== key));
  };

  const totalAmount = items.reduce((sum, i) => sum + i.subtotal, 0);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (items.length === 0) {
      message.error('请至少添加一个商品');
      return;
    }
    setSubmitting(true);
    try {
      const data = {
        customerId: values.customerId,
        warehouseId: values.warehouseId,
        remark: values.remark,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
      };
      if (isEdit && id) {
        await salesApi.update(id, data);
        message.success('销售单已更新');
      } else {
        await salesApi.create(data);
        message.success('销售单已创建');
      }
      navigate('/sales');
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : (isEdit ? '更新失败' : '创建失败'));
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
          onChange={(v) => updateItem(record.key, 'quantity', v ?? 0)}
          style={{ width: 100 }}
        />
      ),
    },
    {
      title: '单价',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      render: (_: unknown, record: LineItem) => (
        <InputNumber
          min={0}
          precision={2}
          value={record.unitPrice}
          onChange={(v) => updateItem(record.key, 'unitPrice', v ?? 0)}
          prefix="¥"
          style={{ width: 120 }}
        />
      ),
    },
    {
      title: '小计',
      key: 'subtotal',
      render: (_: unknown, record: LineItem) => `¥${Number(record.subtotal).toFixed(2)}`,
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
        action={<Button onClick={() => navigate('/sales')}>返回列表</Button>}
      />
    );
  }

  return (
    <Card>
      <Title level={4} style={{ marginBottom: 24 }}>{isEdit ? '编辑销售单' : '新增销售单'}</Title>
      <Form form={form} layout="vertical" style={{ maxWidth: 800 }}>
        <Form.Item name="customerId" label="客户" rules={[{ required: true, message: '请选择客户' }]}>
          <Select
            placeholder="选择客户"
            showSearch
            optionFilterProp="label"
            options={customers.map((c) => ({ label: c.name, value: c.id }))}
          />
        </Form.Item>
        <Form.Item name="warehouseId" label="出库仓库" rules={[{ required: true, message: '请选择仓库' }]}>
          <Select
            placeholder="选择仓库"
            options={warehouses.map((w) => ({ label: w.name, value: w.id }))}
          />
        </Form.Item>

        <div style={{ marginBottom: 16 }}>
          <Title level={5}>销售商品</Title>
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
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={3}>
                <strong>合计</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1}>
                <strong>¥{Number(totalAmount).toFixed(2)}</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} />
            </Table.Summary.Row>
          )}
        />

        <Form.Item name="remark" label="备注" style={{ marginTop: 16 }}>
          <Input.TextArea rows={2} placeholder="备注" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" onClick={handleSubmit} loading={submitting} style={{ marginRight: 12 }}>
            {isEdit ? '保存修改' : '创建销售单'}
          </Button>
          <Button onClick={() => navigate('/sales')}>取消</Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
