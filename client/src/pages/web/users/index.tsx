import { useState, useEffect } from 'react';
import { View, Text, Input, Picker } from '@tarojs/components';
import AppShell from '../../../components/layout/app-shell';
import { usersApi } from '../../../services/users';
import { rolesApi } from '../../../services/roles';
import Taro from '@tarojs/taro';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRoleId, setFormRoleId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await usersApi.list();
      setUsers(res.items || []);
    } catch (err: any) {
      Taro.showToast({ title: err.message || '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const res = await rolesApi.list();
      setRoles(res.items || res || []);
    } catch { /* ignore */ }
  };

  useEffect(() => { loadUsers(); loadRoles(); }, []);

  const roleName = (roleId: string) => {
    const role = roles.find((r: any) => r.id === roleId);
    return role?.name || '-';
  };

  const openCreate = () => {
    setEditId(null);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormPassword('');
    setFormRoleId('');
    setShowModal(true);
  };

  const openEdit = (user: any) => {
    setEditId(user.id);
    setFormName(user.name || '');
    setFormEmail(user.email || '');
    setFormPhone(user.phone || '');
    setFormPassword('');
    setFormRoleId(user.roleId || '');
    setShowModal(true);
  };

  const handleDelete = (id: string, name: string) => {
    Taro.showModal({
      title: '确认禁用',
      content: `确定要禁用用户"${name}"吗？禁用后该用户将无法登录。`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await usersApi.remove(id);
            Taro.showToast({ title: '已禁用', icon: 'success' });
            loadUsers();
          } catch (err: any) {
            Taro.showToast({ title: err.message || '操作失败', icon: 'none' });
          }
        }
      },
    });
  };

  const handleSubmit = async () => {
    if (!formName.trim() || !formEmail.trim()) {
      Taro.showToast({ title: '请填写姓名和邮箱', icon: 'none' });
      return;
    }
    if (!editId && !formPassword.trim()) {
      Taro.showToast({ title: '请设置密码', icon: 'none' });
      return;
    }

    setSubmitting(true);
    try {
      if (editId) {
        await usersApi.update(editId, {
          name: formName.trim(),
          email: formEmail.trim(),
          phone: formPhone.trim() || undefined,
          roleId: formRoleId || undefined,
        });
        Taro.showToast({ title: '更新成功', icon: 'success' });
      } else {
        await usersApi.create({
          name: formName.trim(),
          email: formEmail.trim(),
          password: formPassword,
          phone: formPhone.trim() || undefined,
          roleId: formRoleId || undefined,
        });
        Taro.showToast({ title: '创建成功', icon: 'success' });
      }
      setShowModal(false);
      loadUsers();
    } catch (err: any) {
      Taro.showToast({ title: err.message || '操作失败', icon: 'none' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      {/* Header */}
      <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <View>
          <Text style={{ fontSize: 20, fontWeight: 700, color: '#1c1917' }}>
            用户管理
          </Text>
          <Text style={{ fontSize: 14, color: '#a8a29e', marginTop: 2, display: 'block' }}>
            共 {users.length} 个用户
          </Text>
        </View>
        <View
          style={{ backgroundColor: '#0f766e', color: '#ffffff', borderRadius: 4, padding: '8px 16px', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}
          onClick={openCreate}
        >
          <Text>+ 新增用户</Text>
        </View>
      </View>

      {/* List card */}
      <View className="card">
        <View style={{ display: 'flex', padding: '12px 20px', borderBottom: '1px solid #e7e5e4' }}>
          <Text style={{ flex: 2, fontSize: 12, fontWeight: 500, color: '#78716c' }}>姓名</Text>
          <Text style={{ flex: 2, fontSize: 12, fontWeight: 500, color: '#78716c' }}>邮箱</Text>
          <Text style={{ flex: 1, fontSize: 12, fontWeight: 500, color: '#78716c' }}>角色</Text>
          <Text style={{ flex: 1, fontSize: 12, fontWeight: 500, color: '#78716c' }}>状态</Text>
          <Text style={{ width: 112, fontSize: 12, fontWeight: 500, color: '#78716c' }}>操作</Text>
        </View>

        {loading && (
          <View style={{ padding: '64px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 14, color: '#a8a29e' }}>加载中...</Text>
          </View>
        )}

        {!loading && users.length === 0 && (
          <View style={{ padding: '64px 0', textAlign: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: 500, color: '#57534e', display: 'block' }}>暂无用户</Text>
            <Text style={{ fontSize: 14, color: '#a8a29e', marginTop: 4, display: 'block' }}>
              点击"新增用户"开始添加
            </Text>
          </View>
        )}

        {!loading && users.length > 0 && (
          <View>
            {users.map((user, idx) => (
              <View
                key={user.id}
                style={{
                  display: 'flex',
                  padding: '14px 20px',
                  alignItems: 'center',
                  fontSize: 14,
                  borderBottom: idx < users.length - 1 ? '1px solid #f5f5f4' : 'none',
                }}
              >
                <Text style={{ flex: 2, fontWeight: 500, color: '#1c1917' }}>{user.name}</Text>
                <Text style={{ flex: 2, color: '#78716c' }}>{user.email}</Text>
                <Text style={{ flex: 1, color: '#78716c' }}>{roleName(user.roleId)}</Text>
                <View style={{ flex: 1 }}>
                  <View style={{
                    display: 'inline-flex',
                    backgroundColor: user.enabled ? '#f0fdf4' : '#fef2f2',
                    color: user.enabled ? '#166534' : '#dc2626',
                    padding: '2px 8px',
                    borderRadius: 4,
                  }}>
                    <Text style={{ fontSize: 12, fontWeight: 500 }}>
                      {user.enabled ? '启用' : '已禁用'}
                    </Text>
                  </View>
                </View>
                <View style={{ width: 112, display: 'flex', gap: 6 }}>
                  <View
                    style={{ backgroundColor: '#f0fdfa', color: '#0f766e', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}
                    onClick={() => openEdit(user)}
                  >
                    <Text>编辑</Text>
                  </View>
                  {user.enabled && (
                    <View
                      style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}
                      onClick={() => handleDelete(user.id, user.name)}
                    >
                      <Text>禁用</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Modal */}
      {showModal && (
        <View style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <View className="card p-5" style={{ width: '100%', maxWidth: 420, margin: '0 16px' }}>
            <Text style={{ fontSize: 18, fontWeight: 700, color: '#1c1917', marginBottom: 20, display: 'block' }}>
              {editId ? '编辑用户' : '新增用户'}
            </Text>

            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 14, fontWeight: 500, color: '#57534e', marginBottom: 6, display: 'block' }}>
                姓名 <Text style={{ color: '#dc2626' }}>*</Text>
              </Text>
              <Input className="input-field" placeholder="请输入姓名" value={formName} onInput={(e) => setFormName(e.detail.value)} />
            </View>

            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 14, fontWeight: 500, color: '#57534e', marginBottom: 6, display: 'block' }}>
                邮箱 <Text style={{ color: '#dc2626' }}>*</Text>
              </Text>
              <Input className="input-field" placeholder="请输入邮箱" value={formEmail} onInput={(e) => setFormEmail(e.detail.value)} />
            </View>

            {!editId && (
              <View style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 14, fontWeight: 500, color: '#57534e', marginBottom: 6, display: 'block' }}>
                  密码 <Text style={{ color: '#dc2626' }}>*</Text>
                </Text>
                <Input className="input-field" type="password" placeholder="请设置密码（至少6位）" value={formPassword} onInput={(e) => setFormPassword(e.detail.value)} />
              </View>
            )}

            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 14, fontWeight: 500, color: '#57534e', marginBottom: 6, display: 'block' }}>
                手机号
              </Text>
              <Input className="input-field" placeholder="选填" value={formPhone} onInput={(e) => setFormPhone(e.detail.value)} />
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 14, fontWeight: 500, color: '#57534e', marginBottom: 6, display: 'block' }}>
                角色
              </Text>
              {roles.length > 0 ? (
                <Picker
                  mode="selector"
                  range={roles.map((r: any) => r.name)}
                  value={roles.findIndex((r: any) => r.id === formRoleId)}
                  onChange={(e) => {
                    const idx = Number(e.detail.value);
                    setFormRoleId(idx >= 0 ? roles[idx].id : '');
                  }}
                >
                  <View className="input-field" style={{ cursor: 'pointer' }}>
                    <Text style={{ color: formRoleId ? '#1c1917' : '#a8a29e', fontSize: 14 }}>
                      {formRoleId ? roleName(formRoleId) : '点击选择角色'}
                    </Text>
                  </View>
                </Picker>
              ) : (
                <Text style={{ fontSize: 13, color: '#a8a29e' }}>暂无角色，请先创建角色</Text>
              )}
            </View>

            <View style={{ display: 'flex', gap: 12 }}>
              <View
                style={{ flex: 1, padding: '10px 0', borderRadius: 4, cursor: 'pointer', fontSize: 14, fontWeight: 500, textAlign: 'center', border: '1px solid #e7e5e4', color: '#57534e' }}
                onClick={() => setShowModal(false)}
              >
                <Text>取消</Text>
              </View>
              <View
                style={{ flex: 1, padding: '10px 0', borderRadius: 4, cursor: 'pointer', fontSize: 14, fontWeight: 500, textAlign: 'center', backgroundColor: submitting ? '#0d9488' : '#0f766e', color: '#ffffff' }}
                onClick={submitting ? undefined : handleSubmit}
              >
                <Text>{submitting ? '保存中...' : editId ? '保存' : '创建'}</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </AppShell>
  );
}
