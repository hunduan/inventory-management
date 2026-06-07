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
  Switch,
  Spin,
  Empty,
  Alert,
  message,
  Popconfirm,
  Typography,
  Card,
  Tag,
} from 'antd';
import { PlusOutlined, SettingOutlined } from '@ant-design/icons';
import { categoriesApi } from '../../api/categories';
import type { Category, CategoryAttribute } from '../../types';

const { Title, Text } = Typography;
const FIELD_TYPE_OPTIONS = [
  { label: '文本', value: 'text' },
  { label: '数字', value: 'number' },
  { label: '下拉选择', value: 'select' },
  { label: '日期', value: 'date' },
];

export default function CategoriesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // Attribute modal state
  const [attrModalOpen, setAttrModalOpen] = useState(false);
  const [attrCategory, setAttrCategory] = useState<Category | null>(null);
  const [attributes, setAttributes] = useState<CategoryAttribute[]>([]);
  const [attrLoading, setAttrLoading] = useState(false);
  const [attrFormOpen, setAttrFormOpen] = useState(false);
  const [editingAttr, setEditingAttr] = useState<CategoryAttribute | null>(null);
  const [attrSubmitting, setAttrSubmitting] = useState(false);
  const [attrForm] = Form.useForm();

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

  // === Attribute handlers ===

  const openAttrModal = async (category: Category) => {
    setAttrCategory(category);
    setAttrModalOpen(true);
    setAttrLoading(true);
    try {
      const attrs = await categoriesApi.getAttributes(category.id);
      setAttributes(attrs);
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '加载属性失败');
      setAttributes([]);
    } finally {
      setAttrLoading(false);
    }
  };

  const openCreateAttr = () => {
    setEditingAttr(null);
    attrForm.resetFields();
    attrForm.setFieldsValue({ fieldType: 'text', required: false, sortOrder: 0 });
    setAttrFormOpen(true);
  };

  const openEditAttr = (attr: CategoryAttribute) => {
    setEditingAttr(attr);
    attrForm.setFieldsValue(attr);
    setAttrFormOpen(true);
  };

  const handleAttrSubmit = async () => {
    const values = await attrForm.validateFields();
    if (!attrCategory) return;
    setAttrSubmitting(true);
    try {
      if (editingAttr) {
        await categoriesApi.updateAttribute(attrCategory.id, editingAttr.id, values);
        message.success('属性已更新');
      } else {
        await categoriesApi.createAttribute(attrCategory.id, values);
        message.success('属性已创建');
      }
      setAttrFormOpen(false);
      const attrs = await categoriesApi.getAttributes(attrCategory.id);
      setAttributes(attrs);
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '保存失败');
    } finally {
      setAttrSubmitting(false);
    }
  };

  const handleDeleteAttr = async (id: string) => {
    if (!attrCategory) return;
    try {
      await categoriesApi.removeAttribute(attrCategory.id, id);
      message.success('属性已删除');
      setAttributes(attributes.filter((a) => a.id !== id));
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '删除失败');
    }
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
      title: '自定义属性',
      key: 'attributeCount',
      render: (_: unknown, record: Category) => {
        const count = record.attributes?.length ?? 0;
        return <Tag color={count > 0 ? 'blue' : 'default'}>{count} 项</Tag>;
      },
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: Category) => (
        <Space>
          <Button type="link" size="small" icon={<SettingOutlined />} onClick={() => openAttrModal(record)}>
            属性配置
          </Button>
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

      {/* Category create/edit modal */}
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

      {/* Attribute management modal */}
      <Modal
        title={`属性配置 - ${attrCategory?.name ?? ''}`}
        open={attrModalOpen}
        onCancel={() => setAttrModalOpen(false)}
        footer={null}
        width={640}
      >
        {attrLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin />
          </div>
        ) : (
          <>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreateAttr}
              style={{ marginBottom: 16 }}
            >
              新增属性
            </Button>
            {attributes.length === 0 ? (
              <Empty description="暂无自定义属性，点击上方按钮添加" />
            ) : (
              <div>
                {attributes.map((attr) => (
                  <div
                    key={attr.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '10px 0',
                      borderBottom: '1px solid #f0f0f0',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <Text strong>{attr.name}</Text>
                      <Tag style={{ marginLeft: 8 }}>{FIELD_TYPE_OPTIONS.find((o) => o.value === attr.fieldType)?.label || attr.fieldType}</Tag>
                      {attr.required && <Tag color="red">必填</Tag>}
                      {attr.fieldType === 'select' && attr.options && attr.options.length > 0 && (
                        <div style={{ marginTop: 4 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            选项: {attr.options.join(', ')}
                          </Text>
                        </div>
                      )}
                    </div>
                    <Space>
                      <Button type="link" size="small" onClick={() => openEditAttr(attr)}>
                        编辑
                      </Button>
                      <Popconfirm title="确定删除此属性？" onConfirm={() => handleDeleteAttr(attr.id)}>
                        <Button type="link" size="small" danger>
                          删除
                        </Button>
                      </Popconfirm>
                    </Space>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </Modal>

      {/* Attribute create/edit modal */}
      <Modal
        title={editingAttr ? '编辑属性' : '新增属性'}
        open={attrFormOpen}
        onOk={handleAttrSubmit}
        onCancel={() => setAttrFormOpen(false)}
        confirmLoading={attrSubmitting}
      >
        <Form form={attrForm} layout="vertical" initialValues={{ fieldType: 'text', required: false, sortOrder: 0 }}>
          <Form.Item
            name="name"
            label="属性名称"
            rules={[{ required: true, message: '请输入属性名称' }]}
          >
            <Input placeholder="例如：颜色、尺码、材质" />
          </Form.Item>
          <Form.Item name="fieldType" label="字段类型">
            <Select options={FIELD_TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.fieldType !== cur.fieldType}>
            {({ getFieldValue }) =>
              getFieldValue('fieldType') === 'select' ? (
                <Form.Item
                  name="options"
                  label="选项列表"
                  rules={[{ required: true, message: '请至少输入一个选项' }]}
                >
                  <Select
                    mode="tags"
                    placeholder="输入选项后回车"
                    open={false}
                  />
                </Form.Item>
              ) : null
            }
          </Form.Item>
          <Form.Item name="required" label="必填" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="sortOrder" label="排序">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
