import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Input,
  Space,
  Modal,
  Form,
  Select,
  Spin,
  Empty,
  Alert,
  message,
  Popconfirm,
  Card,
} from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { warehousesApi } from '../../api/warehouses';
import type { Warehouse } from '../../types';

export default function WarehousesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [treeData, setTreeData] = useState<Warehouse[]>([]);
  const [allWarehouses, setAllWarehouses] = useState<Warehouse[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tree, flat] = await Promise.all([
        warehousesApi.tree(),
        warehousesApi.list('limit=1000'),
      ]);
      setTreeData(tree);
      setAllWarehouses(flat.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '加载仓库失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (warehouse: Warehouse) => {
    setEditing(warehouse);
    form.setFieldsValue(warehouse);
    setModalOpen(true);
  };

  const parentOptions = allWarehouses
    .filter((w) => !w.parentId && (!editing || w.id !== editing.id))
    .map((w) => ({ label: w.name, value: w.id }));

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      if (editing) {
        await warehousesApi.update(editing.id, values);
        message.success('仓库已更新');
      } else {
        await warehousesApi.create(values);
        message.success('仓库已创建');
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
      await warehousesApi.remove(id);
      message.success('仓库已删除');
      fetchData();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '删除失败');
    }
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (v: string, record: Warehouse) => (
        <span style={{ fontWeight: record.parentId ? 'normal' : 600 }}>{v}</span>
      ),
    },
    { title: '地址', dataIndex: 'address', key: 'address', render: (v: string | null) => v || '-' },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: Warehouse) => (
        <Space>
          <Button type="link" size="small" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除此仓库？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const defaultExpandedRowKeys = treeData.map((r) => r.id);

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <Input
            placeholder="搜索仓库名称"
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onPressEnter={() => fetchData()}
            style={{ width: 250 }}
            allowClear
          />
          <Button type="primary" onClick={() => fetchData()}>
            搜索
          </Button>
          <div style={{ flex: 1 }} />
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新增仓库
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
      ) : treeData.length > 0 ? (
        <Card>
          <Table
            dataSource={treeData}
            columns={columns}
            rowKey="id"
            pagination={false}
            defaultExpandedRowKeys={defaultExpandedRowKeys}
            childrenColumnName="children"
          />
        </Card>
      ) : (
        <Empty description="暂无仓库" style={{ padding: 80 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新增仓库
          </Button>
        </Empty>
      )}

      <Modal
        title={editing ? '编辑仓库' : '新增仓库'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitting}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="仓库名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="名称" />
          </Form.Item>
          <Form.Item name="parentId" label="父级仓库">
            <Select
              placeholder="不选择则为顶级仓库"
              allowClear
              options={parentOptions}
            />
          </Form.Item>
          <Form.Item name="address" label="地址">
            <Input.TextArea placeholder="地址" rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
