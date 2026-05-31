import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Tag,
  message,
  Popconfirm,
  Typography,
} from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { tenantsApi } from '../../api/tenants';
import type { Tenant } from '../../types';

const { Title } = Typography;

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await tenantsApi.getAll();
      setTenants(res.data || []);
    } catch {
      message.error('加载租户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      await tenantsApi.create(values);
      message.success('租户创建成功');
      setModalOpen(false);
      form.resetFields();
      fetchData();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id: string, name: string, enabled: boolean) => {
    try {
      await tenantsApi.adminUpdate(id, { enabled });
      message.success(enabled ? `已启用租户: ${name}` : `已禁用租户: ${name}`);
      fetchData();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '操作失败');
    }
  };

  const columns = [
    {
      title: '租户名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '标识',
      dataIndex: 'slug',
      key: 'slug',
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean) =>
        enabled ? <Tag color="green">启用</Tag> : <Tag color="red">禁用</Tag>,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => (v ? new Date(v).toLocaleString('zh-CN') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Tenant) => (
        record.enabled ? (
          <Popconfirm
            title="确认禁用"
            description={`确定要禁用租户 "${record.name}" 吗？禁用后该租户所有用户无法登录`}
            onConfirm={() => handleToggle(record.id, record.name, false)}
          >
            <Button type="link" danger>禁用</Button>
          </Popconfirm>
        ) : (
          <Popconfirm
            title="确认启用"
            description={`确定要启用租户 "${record.name}" 吗？`}
            onConfirm={() => handleToggle(record.id, record.name, true)}
          >
            <Button type="link">启用</Button>
          </Popconfirm>
        )
      ),
    },
  ];

  return (
    <>
      <Card>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <Title level={4} style={{ margin: 0 }}>
            租户管理
          </Title>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchData}>
              刷新
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModalOpen(true)}
            >
              新建租户
            </Button>
          </Space>
        </div>
        <Table
          dataSource={tenants}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
        />
      </Card>

      <Modal
        title="新建租户"
        open={modalOpen}
        onOk={handleCreate}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        confirmLoading={submitting}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="租户名称"
            rules={[{ required: true, message: '请输入租户名称' }]}
          >
            <Input placeholder="例如: 测试企业C" />
          </Form.Item>
          <Form.Item
            name="slug"
            label="标识"
            rules={[{ required: true, message: '请输入标识' }]}
          >
            <Input placeholder="例如: test-c（英文，唯一标识）" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
