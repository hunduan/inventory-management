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
import { suppliersApi } from '../../api/suppliers';
import type { Supplier, PaginatedResponse } from '../../types';
import dayjs from 'dayjs';

export default function SuppliersPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PaginatedResponse<Supplier> | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
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
      const result = await suppliersApi.list(params.toString());
      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '加载供应商失败');
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

  const openEdit = (supplier: Supplier) => {
    setEditing(supplier);
    form.setFieldsValue(supplier);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      if (editing) {
        await suppliersApi.update(editing.id, values);
        message.success('供应商已更新');
      } else {
        await suppliersApi.create(values);
        message.success('供应商已创建');
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
      await suppliersApi.remove(id);
      message.success('供应商已删除');
      fetchData();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '删除失败');
    }
  };

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    {
      title: '联系人',
      dataIndex: 'contact',
      key: 'contact',
      render: (v: string | null) => v || '-',
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
      render: (v: string | null) => v || '-',
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      render: (v: string | null) => v || '-',
    },
    {
      title: '往来金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (v: number | undefined) => (v != null ? `¥${Number(v).toFixed(2)}` : '¥0.00'),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: Supplier) => (
        <Space>
          <Button type="link" size="small" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除此供应商？" onConfirm={() => handleDelete(record.id)}>
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
            placeholder="搜索供应商名称"
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
            新增供应商
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
            共 {data.total} 个供应商
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
        <Empty description="暂无供应商" style={{ padding: 80 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新增供应商
          </Button>
        </Empty>
      )}

      <Modal
        title={editing ? '编辑供应商' : '新增供应商'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitting}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="供应商名称"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input placeholder="名称" />
          </Form.Item>
          <Form.Item name="contact" label="联系人">
            <Input placeholder="联系人" />
          </Form.Item>
          <Form.Item name="phone" label="电话">
            <Input placeholder="电话" />
          </Form.Item>
          <Form.Item name="address" label="地址">
            <Input.TextArea placeholder="地址" rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
