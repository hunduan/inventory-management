import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Input,
  Space,
  Modal,
  Form,
  Spin,
  Empty,
  Alert,
  Pagination,
  message,
  Popconfirm,
  Card,
} from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { warehousesApi } from '../../api/warehouses';
import type { Warehouse, PaginatedResponse } from '../../types';

export default function WarehousesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PaginatedResponse<Warehouse> | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('page', String(page));
      params.set('limit', '20');
      const result = await warehousesApi.list(params.toString());
      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '加载仓库失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

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
    { title: '名称', dataIndex: 'name', key: 'name' },
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

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <Input
            placeholder="搜索仓库名称"
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 250 }}
            allowClear
          />
          <Button type="primary" onClick={handleSearch}>
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
      ) : data && data.data.length > 0 ? (
        <Card>
          <div style={{ marginBottom: 12, color: '#78716c' }}>
            共 {data.total} 个仓库
          </div>
          <Table dataSource={data.data} columns={columns} rowKey="id" pagination={false} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <Pagination
              current={page}
              total={data.total}
              pageSize={20}
              onChange={(p) => setPage(p)}
              showTotal={(t) => `共 ${t} 条`}
              showSizeChanger={false}
            />
          </div>
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
          <Form.Item name="address" label="地址">
            <Input.TextArea placeholder="地址" rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
