import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Checkbox,
  Spin,
  Empty,
  Alert,
  message,
  Card,
  Popconfirm,
  Tag,
  Typography,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { rolesApi } from '../../api/roles';
import { tenantsApi } from '../../api/tenants';
import { useAuthStore } from '../../store/auth';
import type { Role, Tenant } from '../../types';

const { Title } = Typography;

const PERMISSION_GROUPS: { label: string; keys: string[] }[] = [
  { label: '商品', keys: ['products:read', 'products:create', 'products:update', 'products:delete'] },
  { label: '采购', keys: ['purchases:read', 'purchases:create', 'purchases:update', 'purchases:delete'] },
  { label: '销售', keys: ['sales:read', 'sales:create', 'sales:update', 'sales:delete'] },
  { label: '库存', keys: ['inventory:read', 'inventory:update'] },
  { label: '仓库', keys: ['warehouses:read', 'warehouses:create', 'warehouses:update', 'warehouses:delete'] },
  { label: '盘点', keys: ['stocktakes:read', 'stocktakes:create', 'stocktakes:update', 'stocktakes:delete'] },
  { label: '调拨', keys: ['transfers:read', 'transfers:create', 'transfers:update', 'transfers:delete'] },
  { label: '报表', keys: ['reports:read'] },
  { label: '用户', keys: ['users:read', 'users:create', 'users:update', 'users:delete'] },
  { label: '角色', keys: ['roles:read', 'roles:create', 'roles:update', 'roles:delete'] },
  { label: '租户', keys: ['tenants:read', 'tenants:update'] },
];

export default function RolesPage() {
  const { isSuperAdmin, user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Role[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');

  const effectiveTenantId = isSuperAdmin ? selectedTenantId : (user?.tenantId || '');

  const fetchData = async () => {
    if (!effectiveTenantId) return;
    setLoading(true);
    setError(null);
    try {
      const result = isSuperAdmin
        ? await rolesApi.adminList(effectiveTenantId)
        : await rolesApi.list();
      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '加载角色失败');
    } finally {
      setLoading(false);
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
    }
  }, [effectiveTenantId]);

  const openCreateModal = () => {
    setEditingRole(null);
    form.resetFields();
    setSelectedPermissions([]);
    setModalOpen(true);
  };

  const openEditModal = (role: Role) => {
    setEditingRole(role);
    form.setFieldsValue({ name: role.name });
    setSelectedPermissions(role.permissions || []);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      if (editingRole) {
        if (isSuperAdmin) {
          await rolesApi.adminUpdate(effectiveTenantId, editingRole.id, {
            name: values.name,
            permissions: selectedPermissions,
          });
        } else {
          await rolesApi.update(editingRole.id, {
            name: values.name,
            permissions: selectedPermissions,
          });
        }
        message.success('角色已更新');
      } else {
        if (isSuperAdmin) {
          await rolesApi.adminCreate(effectiveTenantId, {
            name: values.name,
            permissions: selectedPermissions,
          });
        } else {
          await rolesApi.create({
            name: values.name,
            permissions: selectedPermissions,
          });
        }
        message.success('角色已创建');
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
        await rolesApi.adminRemove(effectiveTenantId, id);
      } else {
        await rolesApi.remove(id);
      }
      message.success('角色已删除');
      fetchData();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '删除失败');
    }
  };

  const columns = [
    { title: '角色名称', dataIndex: 'name', key: 'name' },
    {
      title: '权限数',
      key: 'permissions',
      render: (_: unknown, record: Role) => <Tag>{record.permissions?.length || 0}</Tag>,
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: Role) => (
        <>
          <Button type="link" size="small" onClick={() => openEditModal(record)}>编辑</Button>
          <Popconfirm title="确定删除此角色？" onConfirm={() => handleDelete(record.id)}>
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
            <Title level={4} style={{ margin: 0 }}>{isSuperAdmin ? '角色管理' : '角色管理'}</Title>
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
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>新增角色</Button>
          )}
        </div>
      </Card>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
      ) : error ? (
        <Alert message="加载失败" description={error} type="error" showIcon action={<Button onClick={fetchData}>重试</Button>} />
      ) : data.length > 0 ? (
        <Card>
          <Table dataSource={data} columns={columns} rowKey="id" pagination={false} />
        </Card>
      ) : (
        <Empty description={effectiveTenantId ? '暂无角色' : '请先选择租户'} style={{ padding: 80 }}>
          {effectiveTenantId && <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>新增角色</Button>}
        </Empty>
      )}

      <Modal
        title={editingRole ? '编辑角色' : '新增角色'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitting}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="角色名称" rules={[{ required: true, message: '请输入角色名称' }]}>
            <Input placeholder="角色名称" />
          </Form.Item>
          <Form.Item label="权限">
            <div style={{ maxHeight: 400, overflow: 'auto' }}>
              {PERMISSION_GROUPS.map((group) => (
                <div key={group.label} style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 500, marginBottom: 4, color: '#595959' }}>{group.label}</div>
                  <Checkbox.Group
                    value={selectedPermissions.filter((p) => group.keys.includes(p))}
                    onChange={(values) => {
                      const otherPerms = selectedPermissions.filter((p) => !group.keys.includes(p));
                      setSelectedPermissions([...otherPerms, ...(values as string[])]);
                    }}
                  >
                    {group.keys.map((perm) => (
                      <Checkbox key={perm} value={perm} style={{ marginRight: 8, marginBottom: 4 }}>
                        {perm.split(':')[1]}
                      </Checkbox>
                    ))}
                  </Checkbox.Group>
                </div>
              ))}
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
