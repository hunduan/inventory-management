import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Spin,
  Alert,
  message,
  Typography,
  Switch,
} from 'antd';
import { productsApi } from '../../api/products';
import { categoriesApi } from '../../api/categories';
import type { Category } from '../../types';

const { Title } = Typography;

export default function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    categoriesApi
      .list()
      .then(setCategories)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      setLoading(true);
      setError(null);
      productsApi
        .getById(id)
        .then((product) => {
          form.setFieldsValue(product);
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : '加载商品失败');
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, form]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      if (isEdit && id) {
        await productsApi.update(id, values as never);
        message.success('商品已更新');
      } else {
        await productsApi.create(values as never);
        message.success('商品已创建');
      }
      navigate('/products');
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSubmitting(false);
    }
  };

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
        action={<Button onClick={() => navigate('/products')}>返回列表</Button>}
      />
    );
  }

  return (
    <Card>
      <Title level={4} style={{ marginBottom: 24 }}>
        {isEdit ? '编辑商品' : '新增商品'}
      </Title>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ maxWidth: 600 }}
        initialValues={{
          unit: '个',
          salePrice: 0,
          costPrice: 0,
          enabled: true,
        }}
      >
        <Form.Item
          name="name"
          label="商品名称"
          rules={[{ required: true, message: '请输入商品名称' }]}
        >
          <Input placeholder="商品名称" />
        </Form.Item>

        <Form.Item name="categoryId" label="所属分类">
          <Select
            placeholder="选择分类"
            allowClear
            options={categories.map((c) => ({ label: c.name, value: c.id }))}
          />
        </Form.Item>

        <Form.Item name="barcode" label="条码">
          <Input placeholder="商品条码" />
        </Form.Item>

        <Form.Item name="sku" label="SKU">
          <Input placeholder="商品SKU" />
        </Form.Item>

        <Form.Item name="unit" label="单位">
          <Input placeholder="个" />
        </Form.Item>

        <Form.Item name="salePrice" label="销售价">
          <InputNumber min={0} precision={2} prefix="¥" style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="costPrice" label="成本价">
          <InputNumber min={0} precision={2} prefix="¥" style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="enabled" label="启用" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting} style={{ marginRight: 12 }}>
            {isEdit ? '更新' : '创建'}
          </Button>
          <Button onClick={() => navigate('/products')}>取消</Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
