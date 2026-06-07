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
  DatePicker,
  Divider,
} from 'antd';
import dayjs from 'dayjs';
import { productsApi } from '../../api/products';
import { categoriesApi } from '../../api/categories';
import type { Category, CategoryAttribute } from '../../types';

const { Title, Text } = Typography;

export default function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryAttrs, setCategoryAttrs] = useState<CategoryAttribute[]>([]);
  const [error, setError] = useState<string | null>(null);
  const selectedCategoryId = Form.useWatch('categoryId', form);

  useEffect(() => {
    categoriesApi
      .list()
      .then(setCategories)
      .catch(() => {});
  }, []);

  const findAttrsForCategory = (catId: string): CategoryAttribute[] => {
    const walk = (items: Category[]): CategoryAttribute[] | null => {
      for (const item of items) {
        if (item.id === catId) return item.attributes ?? [];
        if (item.children) {
          const found = walk(item.children);
          if (found) return found;
        }
      }
      return null;
    };
    return walk(categories) ?? [];
  };

  useEffect(() => {
    if (selectedCategoryId) {
      setCategoryAttrs(findAttrsForCategory(selectedCategoryId));
    } else {
      setCategoryAttrs([]);
    }
  }, [selectedCategoryId, categories]);

  useEffect(() => {
    if (isEdit && id) {
      setLoading(true);
      setError(null);
      productsApi
        .getById(id)
        .then((product) => {
          const specs = { ...(product.specs ?? {}) };
          // Convert date strings to dayjs for DatePicker
          if (categoryAttrs.length > 0) {
            for (const attr of categoryAttrs) {
              if (attr.fieldType === 'date' && specs[attr.name] && typeof specs[attr.name] === 'string') {
                specs[attr.name] = dayjs(specs[attr.name] as string);
              }
            }
          }
          form.setFieldsValue({
            ...product,
            specs,
          });
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : '加载商品失败');
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, form]);

  // Re-run when categoryAttrs loads after product data
  useEffect(() => {
    if (isEdit && categoryAttrs.length > 0) {
      const specs = form.getFieldValue('specs');
      if (specs) {
        const updated = { ...specs };
        let changed = false;
        for (const attr of categoryAttrs) {
          if (attr.fieldType === 'date' && updated[attr.name] && typeof updated[attr.name] === 'string') {
            updated[attr.name] = dayjs(updated[attr.name] as string);
            changed = true;
          }
        }
        if (changed) form.setFieldsValue({ specs: updated });
      }
    }
  }, [isEdit, categoryAttrs, form]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      const payload = { ...values };
      // Convert dayjs values in specs to date strings
      if (payload.specs && typeof payload.specs === 'object') {
        const specs = { ...(payload.specs as Record<string, unknown>) };
        for (const [key, val] of Object.entries(specs)) {
          if (val && typeof val === 'object' && 'format' in (val as object)) {
            specs[key] = (val as dayjs.Dayjs).format('YYYY-MM-DD');
          }
        }
        payload.specs = specs;
      }
      if (isEdit && id) {
        await productsApi.update(id, payload as never);
        message.success('商品已更新');
      } else {
        await productsApi.create(payload as never);
        message.success('商品已创建');
      }
      navigate('/products');
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSubmitting(false);
    }
  };

  const renderAttrField = (attr: CategoryAttribute) => {
    const fieldName = ['specs', attr.name];
    const isRequired = attr.required;

    switch (attr.fieldType) {
      case 'number':
        return (
          <Form.Item
            key={attr.id}
            name={fieldName}
            label={attr.name}
            rules={isRequired ? [{ required: true, message: `请输入${attr.name}` }] : undefined}
          >
            <InputNumber style={{ width: '100%' }} placeholder={`请输入${attr.name}`} />
          </Form.Item>
        );
      case 'select':
        return (
          <Form.Item
            key={attr.id}
            name={fieldName}
            label={attr.name}
            rules={isRequired ? [{ required: true, message: `请选择${attr.name}` }] : undefined}
          >
            <Select
              placeholder={`请选择${attr.name}`}
              allowClear
              options={(attr.options ?? []).map((o) => ({ label: o, value: o }))}
            />
          </Form.Item>
        );
      case 'date':
        return (
          <Form.Item
            key={attr.id}
            name={fieldName}
            label={attr.name}
            rules={isRequired ? [{ required: true, message: `请选择${attr.name}` }] : undefined}
          >
            <DatePicker style={{ width: '100%' }} placeholder={`请选择${attr.name}`} />
          </Form.Item>
        );
      default:
        return (
          <Form.Item
            key={attr.id}
            name={fieldName}
            label={attr.name}
            rules={isRequired ? [{ required: true, message: `请输入${attr.name}` }] : undefined}
          >
            <Input placeholder={`请输入${attr.name}`} />
          </Form.Item>
        );
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
          specs: {},
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

        {categoryAttrs.length > 0 && (
          <>
            <Divider orientation="left" plain>
              <Text type="secondary">自定义属性</Text>
            </Divider>
            {categoryAttrs.map(renderAttrField)}
          </>
        )}

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
