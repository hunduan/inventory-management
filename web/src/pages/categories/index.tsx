import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Spin,
  Empty,
  Alert,
  message,
  Popconfirm,
  Typography,
  Card,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { categoriesApi } from '../../api/categories';
import type { Category } from '../../types';

const { Title } = Typography;

export default function CategoriesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await categoriesApi.list();
      setCategories(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '加载分类失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const flattenTree = (items: Category[]): (Category & { level: number })[] => {
    const result: (Category & { level: number })[] = [];
    const walk = (list: Category[], level: number) => {
      for (const item of list) {
        result.push({ ...item, level });
        if (item.children) {
          walk(item.children, level + 1);
        }
      }
    };
    walk(items, 0);
    return result;
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    form.setFieldsValue(category);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      if (editingCategory) {
        await categoriesApi.update(editingCategory.id, values);
        message.success('分类已更新');
      } else {
        await categoriesApi.create(values);
        message.success('分类已创建');
      }
      setModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await categoriesApi.remove(id);
      message.success('分类已删除');
      fetchData();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '删除失败');
    }
  };

  const getParentOptions = () => {
    const opts: { label: string; value: string }[] = [{ label: '无（顶级分类）', value: '' }];
    const addItems = (items: Category[], prefix: string) => {
      for (const item of items) {
        const label = prefix + item.name;
        if (editingCategory && item.id === editingCategory.id) continue;
        opts.push({ label, value: item.id });
        if (item.children) {
          addItems(item.children, prefix + '-- ');
        }
      }
    };
    addItems(categories, '');
    return opts;
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (_: string, record: Category & { level: number }) => (
        <span style={{ paddingLeft: record.level * 20 }}>{record.name}</span>
      ),
    },
    {
      title: '父分类',
      key: 'parent',
      render: (_: unknown, record: Category) => {
        if (!record.parentId) return <span style={{ color: '#a8a29e' }}>顶级</span>;
        const parent = categories.find((c) => c.id === record.parentId);
        return parent?.name || '-';
      },
    },
    {
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 80,
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: Category) => (
        <Space>
          <Button type="link" size="small" onClick={() => openEditModal(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除此分类？"
            description={
              record.children && record.children.length > 0
                ? '此分类下有子分类，删除后子分类将变为顶级分类'
                : undefined
            }
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Title level={4} style={{ margin: 0 }}>
            商品分类
          </Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            新增分类
          </Button>
        </div>
      </Card>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <Spin size="large" />
        </div>
      ) : error ? (
        <Alert
          message="加载失败"
          description={error}
          type="error"
          showIcon
          action={<Button onClick={fetchData}>重试</Button>}
        />
      ) : categories.length > 0 ? (
        <Card>
          <Table
            dataSource={flattenTree(categories)}
            columns={columns}
            rowKey="id"
            pagination={false}
          />
        </Card>
      ) : (
        <Empty description="暂无分类" style={{ padding: 80 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            新增分类
          </Button>
        </Empty>
      )}

      <Modal
        title={editingCategory ? '编辑分类' : '新增分类'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitting}
      >
        <Form form={form} layout="vertical" initialValues={{ sortOrder: 0 }}>
          <Form.Item
            name="name"
            label="分类名称"
            rules={[{ required: true, message: '请输入分类名称' }]}
          >
            <Input placeholder="分类名称" />
          </Form.Item>
          <Form.Item name="parentId" label="父分类">
            <Select
              placeholder="选择父分类"
              allowClear
              options={getParentOptions()}
            />
          </Form.Item>
          <Form.Item name="sortOrder" label="排序">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
