import { useState, useEffect } from 'react';
import { View, Text, Input } from '@tarojs/components';
import AppShell from '../../../components/layout/app-shell';
import { rolesApi } from '../../../services/roles';
import Taro from '@tarojs/taro';

const PERMISSION_PRESETS = [
  { group: '采购管理', keys: ['purchase.read', 'purchase.create', 'purchase.update', 'purchase.delete'] },
  { group: '销售管理', keys: ['sale.read', 'sale.create', 'sale.update', 'sale.delete'] },
  { group: '库存管理', keys: ['inventory.read', 'inventory.adjust', 'inventory.transfer'] },
  { group: '基础数据', keys: ['product.read', 'product.create', 'product.update', 'product.delete', 'category.*', 'warehouse.*', 'supplier.*', 'customer.*'] },
  { group: '系统管理', keys: ['user.*', 'role.*', 'tenant.*', 'report.*'] },
];

export default function RolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formPermissions, setFormPermissions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const loadRoles = async () => {
    setLoading(true);
    try {
      const res = await rolesApi.list();
      setRoles(res.items || res || []);
    } catch (err: any) {
      Taro.showToast({ title: err.message || '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRoles(); }, []);

  const openCreate = () => {
    setEditId(null);
    setFormName('');
    setFormPermissions([]);
    setShowModal(true);
  };

  const openEdit = (role: any) => {
    setEditId(role.id);
    setFormName(role.name || '');
    setFormPermissions(Array.isArray(role.permissions) ? role.permissions : []);
    setShowModal(true);
  };

  const togglePermission = (key: string) => {
    setFormPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const toggleGroup = (keys: string[]) => {
    const allSelected = keys.every((k) => formPermissions.includes(k));
    if (allSelected) {
      setFormPermissions((prev) => prev.filter((p) => !keys.includes(p)));
    } else {
      setFormPermissions((prev) => [...new Set([...prev, ...keys])]);
    }
  };

  const handleDelete = (id: string, name: string) => {
    Taro.showModal({
      title: '确认删除',
      content: `确定要删除角色"${name}"吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await rolesApi.remove(id);
            Taro.showToast({ title: '删除成功', icon: 'success' });
            loadRoles();
          } catch (err: any) {
            Taro.showToast({ title: err.message || '删除失败', icon: 'none' });
          }
        }
      },
    });
  };

  const handleSubmit = async () => {
    if (!formName.trim()) {
      Taro.showToast({ title: '请输入角色名称', icon: 'none' });
      return;
    }
    setSubmitting(true);
    try {
      const data = { name: formName.trim(), permissions: formPermissions };
      if (editId) {
        await rolesApi.update(editId, data);
        Taro.showToast({ title: '更新成功', icon: 'success' });
      } else {
        await rolesApi.create(data);
        Taro.showToast({ title: '创建成功', icon: 'success' });
      }
      setShowModal(false);
      loadRoles();
    } catch (err: any) {
      Taro.showToast({ title: err.message || '操作失败', icon: 'none' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <View>
          <Text style={{ fontSize: 20, fontWeight: 700, color: '#1c1917' }}>角色权限管理</Text>
          <Text style={{ fontSize: 14, color: '#a8a29e', marginTop: 2, display: 'block' }}>共 {roles.length} 个角色</Text>
        </View>
        <View
          style={{ backgroundColor: '#0f766e', color: '#ffffff', borderRadius: 4, padding: '8px 16px', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}
          onClick={openCreate}
        >
          <Text>+ 新增角色</Text>
        </View>
      </View>

      <View className="card">
        <View style={{ display: 'flex', padding: '12px 20px', borderBottom: '1px solid #e7e5e4' }}>
          <Text style={{ flex: 2, fontSize: 12, fontWeight: 500, color: '#78716c' }}>角色名称</Text>
          <Text style={{ flex: 3, fontSize: 12, fontWeight: 500, color: '#78716c' }}>权限数</Text>
          <Text style={{ width: 112, fontSize: 12, fontWeight: 500, color: '#78716c' }}>操作</Text>
        </View>

        {loading && (
          <View style={{ padding: '64px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 14, color: '#a8a29e' }}>加载中...</Text>
          </View>
        )}

        {!loading && roles.length === 0 && (
          <View style={{ padding: '64px 0', textAlign: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: 500, color: '#57534e', display: 'block' }}>暂无角色</Text>
          </View>
        )}

        {!loading && roles.length > 0 && (
          <View>
            {roles.map((role, idx) => {
              const perms = Array.isArray(role.permissions) ? role.permissions : [];
              return (
                <View
                  key={role.id}
                  style={{ display: 'flex', padding: '14px 20px', alignItems: 'center', fontSize: 14, borderBottom: idx < roles.length - 1 ? '1px solid #f5f5f4' : 'none' }}
                >
                  <Text style={{ flex: 2, fontWeight: 500, color: '#1c1917' }}>{role.name}</Text>
                  <Text style={{ flex: 3, color: perms.length > 0 ? '#78716c' : '#a8a29e', fontSize: 13 }}>
                    {perms.length > 0 ? `${perms.length} 项权限` : '未设置权限'}
                  </Text>
                  <View style={{ width: 112, display: 'flex', gap: 6 }}>
                    <View style={{ backgroundColor: '#f0fdfa', color: '#0f766e', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 500 }} onClick={() => openEdit(role)}>
                      <Text>编辑</Text>
                    </View>
                    <View style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 500 }} onClick={() => handleDelete(role.id, role.name)}>
                      <Text>删除</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {showModal && (
        <View style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <View className="card p-5" style={{ width: '100%', maxWidth: 480, margin: '0 16px', maxHeight: '80vh', overflowY: 'auto' }}>
            <Text style={{ fontSize: 18, fontWeight: 700, color: '#1c1917', marginBottom: 20, display: 'block' }}>
              {editId ? '编辑角色' : '新增角色'}
            </Text>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: 500, color: '#57534e', marginBottom: 6, display: 'block' }}>
                角色名称 <Text style={{ color: '#dc2626' }}>*</Text>
              </Text>
              <Input className="input-field" placeholder="请输入角色名称" value={formName} onInput={(e) => setFormName(e.detail.value)} />
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 14, fontWeight: 500, color: '#57534e', marginBottom: 10, display: 'block' }}>权限配置</Text>
              {PERMISSION_PRESETS.map((preset) => (
                <View key={preset.group} style={{ marginBottom: 12, border: '1px solid #e7e5e4', borderRadius: 8, padding: 12 }}>
                  <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, cursor: 'pointer' }} onClick={() => toggleGroup(preset.keys)}>
                    <Text style={{ fontSize: 13, fontWeight: 600, color: '#1c1917' }}>{preset.group}</Text>
                    <Text style={{ fontSize: 11, color: '#0f766e', cursor: 'pointer' }}>
                      {preset.keys.every((k) => formPermissions.includes(k)) ? '取消全选' : '全选'}
                    </Text>
                  </View>
                  <View style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {preset.keys.map((key) => (
                      <View
                        key={key}
                        style={{
                          padding: '4px 10px', borderRadius: 4, fontSize: 12, cursor: 'pointer',
                          backgroundColor: formPermissions.includes(key) ? '#f0fdfa' : '#f5f5f4',
                          color: formPermissions.includes(key) ? '#0f766e' : '#78716c',
                          border: formPermissions.includes(key) ? '1px solid #99f6e4' : '1px solid #e7e5e4',
                        }}
                        onClick={() => togglePermission(key)}
                      >
                        <Text>{key}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>

            <View style={{ display: 'flex', gap: 12 }}>
              <View style={{ flex: 1, padding: '10px 0', borderRadius: 4, cursor: 'pointer', fontSize: 14, fontWeight: 500, textAlign: 'center', border: '1px solid #e7e5e4', color: '#57534e' }} onClick={() => setShowModal(false)}>
                <Text>取消</Text>
              </View>
              <View style={{ flex: 1, padding: '10px 0', borderRadius: 4, cursor: 'pointer', fontSize: 14, fontWeight: 500, textAlign: 'center', backgroundColor: submitting ? '#0d9488' : '#0f766e', color: '#ffffff' }} onClick={submitting ? undefined : handleSubmit}>
                <Text>{submitting ? '保存中...' : editId ? '保存' : '创建'}</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </AppShell>
  );
}
