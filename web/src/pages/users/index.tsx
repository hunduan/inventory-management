import { useState, useEffect } from 'react';
import {
  Table, Button, Modal, Form, Input, Select, Switch, Tag, Spin, Empty, Alert, message, Card, Popconfirm, Typography,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { usersApi } from '../../api/users';
import { rolesApi } from '../../api/roles';
import { tenantsApi } from '../../api/tenants';
import { useAuthStore } from '../../store/auth';
import type { User, PaginatedResponse, Role, Tenant } from '../../types';

const { Title } = Typography;

export default function UsersPage() {
  const { isSuperAdmin, user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PaginatedResponse<User> | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);

  // Super admin: tenant selector
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');

  const effectiveTenantId = isSuperAdmin ? selectedTenantId : (user?.tenantId || '');

  const fetchData = async () => {
    if (!effectiveTenantId) return;
    setLoading(true);
    setError(null);
    try {
      const result = isSuperAdmin
        ? await usersApi.adminList(effectiveTenantId, 'limit=100')
        : await usersApi.list('limit=100');
      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '加载用户失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async (tid: string) => {
    try {
      const result = isSuperAdmin ? await rolesApi.adminList(tid) : await rolesApi.list();
      setRoles(Array.isArray(result) ? result : []);
    } catch {
      setRoles([]);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      tenantsApi.getAll().then((res) => {
        const list = res.data || [];
        setTenants(list);
        if (list.length > 0) {
          setSelectedTenantId(list[0].id);
        }
      }).catch(() => {});
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    if (effectiveTenantId) {
      fetchData();
      fetchRoles(effectiveTenantId);
    }
  }, [effectiveTenantId]);

  const openCreateModal = () => {
    setEditingUser(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      name: user.name,
      email: user.email,
      phone: user.phone,
      roleId: user.roleId,
      enabled: user.enabled,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      if (editingUser) {
        if (isSuperAdmin) {
          await usersApi.adminUpdate(effectiveTenantId, editingUser.id, {
            name: values.name,
            phone: values.phone,
            roleId: values.roleId,
            enabled: values.enabled,
          });
          if (values.roleId) {
            await usersApi.adminAssignRole(effectiveTenantId, editingUser.id, values.roleId);
          }
        } else {
          await usersApi.update(editingUser.id, {
            name: values.name,
            phone: values.phone,
            roleId: values.roleId,
            enabled: values.enabled,
          });
          if (values.roleId) {
            await usersApi.assignRole(editingUser.id, values.roleId);
          }
        }
        message.success('用户已更新');
      } else {
        if (isSuperAdmin) {
          await usersApi.adminCreate(effectiveTenantId, {
            email: values.email,
            password: values.password,
            name: values.name,
            phone: values.phone,
            roleId: values.roleId,
          });
        } else {
          await usersApi.create({
            email: values.email,
            password: values.password,
            name: values.name,
            phone: values.phone,
            roleId: values.roleId,
          });
        }
        message.success('用户已创建');
      }
      setModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (isSuperAdmin) {
        await usersApi.adminRemove(effectiveTenantId, id);
      } else {
        await usersApi.remove(id);
      }
      message.success('用户已删除');
      fetchData();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '删除失败');
    }
  };

  const columns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '手机', dataIndex: 'phone', key: 'phone', render: (v: string | undefined) => v || '-' },
    { title: '角色', key: 'role', render: (_: unknown, record: User) => record.role?.name || '-' },
    {
      title: '状态', dataIndex: 'enabled', key: 'enabled',
      render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? '启用' : '禁用'}</Tag>,
    },
    {
      title: '操作', key: 'actions',
      render: (_: unknown, record: User) => (
        <>
          <Button type="link" size="small" onClick={() => openEditModal(record)}>编辑</Button>
          <Popconfirm title="确定删除此用户？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isSuperAdmin && <Title level={4} style={{ margin: 0 }}>用户管理</Title>}
            {isSuperAdmin && (
              <Select
                placeholder="选择租户"
                style={{ width: 200 }}
                value={selectedTenantId || undefined}
                onChange={setSelectedTenantId}
                options={tenants.map((t) => ({ label: t.name, value: t.id }))}
              />
            )}
          </div>
          {effectiveTenantId && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>新增用户</Button>
          )}
        </div>
      </Card>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
      ) : error ? (
        <Alert message="加载失败" description={error} type="error" showIcon action={<Button onClick={fetchData}>重试</Button>} />
      ) : data && data.data.length > 0 ? (
        <Card>
          <Table dataSource={data.data} columns={columns} rowKey="id" pagination={false} />
        </Card>
      ) : (
        <Empty description={effectiveTenantId ? '暂无用户' : '请先选择租户'} style={{ padding: 80 }}>
          {effectiveTenantId && <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>新增用户</Button>}
        </Empty>
      )}

      <Modal
        title={editingUser ? '编辑用户' : '新增用户'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitting}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="姓名" />
          </Form.Item>
          <Form.Item name="email" label="邮箱" rules={[
            { required: !editingUser, message: '请输入邮箱' },
            { type: 'email', message: '邮箱格式不正确' },
          ]}>
            <Input placeholder="邮箱" disabled={!!editingUser} />
          </Form.Item>
          {!editingUser && (
            <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password placeholder="密码" />
            </Form.Item>
          )}
          <Form.Item name="phone" label="手机">
            <Input placeholder="手机" />
          </Form.Item>
          {editingUser && (
            <Form.Item name="enabled" label="状态" valuePropName="checked">
              <Switch checkedChildren="启用" unCheckedChildren="禁用" />
            </Form.Item>
          )}
          <Form.Item name="roleId" label="角色">
            <Select
              placeholder="选择角色"
              allowClear
              options={roles.map((r) => ({ label: r.name, value: r.id }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
