import { useState, useEffect } from 'react';
import { View, Text, Input } from '@tarojs/components';
import AppShell from '../../../components/layout/app-shell';
import { tenantsApi } from '../../../services/tenants';
import Taro from '@tarojs/taro';

export default function TenantsPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadTenants = async () => {
    setLoading(true);
    try {
      const res = await tenantsApi.adminList();
      setTenants(res.items || []);
    } catch (err: any) {
      Taro.showToast({ title: err.message || '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTenants(); }, []);

  const openCreate = () => {
    setFormName('');
    setFormSlug('');
    setShowModal(true);
  };

  const handleToggle = async (id: string, enabled: boolean, name: string) => {
    Taro.showModal({
      title: enabled ? '确认禁用' : '确认启用',
      content: `${enabled ? '禁用' : '启用'}租户"${name}"后，该租户下所有用户将${enabled ? '无法' : '恢复'}登录。`,
      success: async (res) => {
        if (res.confirm) {
          try {
            if (enabled) await tenantsApi.adminRemove(id);
            Taro.showToast({ title: enabled ? '已禁用' : '已启用', icon: 'success' });
            loadTenants();
          } catch (err: any) {
            Taro.showToast({ title: err.message || '操作失败', icon: 'none' });
          }
        }
      },
    });
  };

  const handleSubmit = async () => {
    if (!formName.trim() || !formSlug.trim()) {
      Taro.showToast({ title: '请填写租户名称和标识', icon: 'none' });
      return;
    }
    if (!/^[a-z0-9-]+$/.test(formSlug.trim())) {
      Taro.showToast({ title: '标识只能包含小写字母、数字和短横线', icon: 'none' });
      return;
    }
    setSubmitting(true);
    try {
      await tenantsApi.adminCreate({ name: formName.trim(), slug: formSlug.trim() });
      Taro.showToast({ title: '创建成功', icon: 'success' });
      setShowModal(false);
      loadTenants();
    } catch (err: any) {
      Taro.showToast({ title: err.message || '创建失败', icon: 'none' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <View>
          <Text style={{ fontSize: 20, fontWeight: 700, color: '#1c1917' }}>租户管理</Text>
          <Text style={{ fontSize: 14, color: '#a8a29e', marginTop: 2, display: 'block' }}>共 {tenants.length} 个租户</Text>
        </View>
        <View
          style={{ backgroundColor: '#0f766e', color: '#ffffff', borderRadius: 4, padding: '8px 16px', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}
          onClick={openCreate}
        >
          <Text>+ 新建租户</Text>
        </View>
      </View>

      <View className="card">
        <View style={{ display: 'flex', padding: '12px 20px', borderBottom: '1px solid #e7e5e4' }}>
          <Text style={{ flex: 2, fontSize: 12, fontWeight: 500, color: '#78716c' }}>租户名称</Text>
          <Text style={{ flex: 2, fontSize: 12, fontWeight: 500, color: '#78716c' }}>标识 (slug)</Text>
          <Text style={{ flex: 1, fontSize: 12, fontWeight: 500, color: '#78716c' }}>状态</Text>
          <Text style={{ width: 112, fontSize: 12, fontWeight: 500, color: '#78716c' }}>操作</Text>
        </View>

        {loading && (
          <View style={{ padding: '64px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 14, color: '#a8a29e' }}>加载中...</Text>
          </View>
        )}

        {!loading && tenants.length === 0 && (
          <View style={{ padding: '64px 0', textAlign: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: 500, color: '#57534e', display: 'block' }}>暂无租户</Text>
          </View>
        )}

        {!loading && tenants.length > 0 && (
          <View>
            {tenants.map((t, idx) => (
              <View
                key={t.id}
                style={{ display: 'flex', padding: '14px 20px', alignItems: 'center', fontSize: 14, borderBottom: idx < tenants.length - 1 ? '1px solid #f5f5f4' : 'none' }}
              >
                <Text style={{ flex: 2, fontWeight: 500, color: '#1c1917' }}>{t.name}</Text>
                <Text style={{ flex: 2, color: '#78716c' }}>{t.slug}</Text>
                <View style={{ flex: 1 }}>
                  <View style={{ display: 'inline-flex', backgroundColor: t.enabled ? '#f0fdf4' : '#fef2f2', color: t.enabled ? '#166534' : '#dc2626', padding: '2px 8px', borderRadius: 4 }}>
                    <Text style={{ fontSize: 12, fontWeight: 500 }}>{t.enabled ? '启用' : '已禁用'}</Text>
                  </View>
                </View>
                <View style={{ width: 112, display: 'flex', gap: 6 }}>
                  <View
                    style={{ backgroundColor: t.enabled ? '#fef2f2' : '#f0fdf4', color: t.enabled ? '#dc2626' : '#166534', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}
                    onClick={() => handleToggle(t.id, t.enabled, t.name)}
                  >
                    <Text>{t.enabled ? '禁用' : '启用'}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {showModal && (
        <View style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <View className="card p-5" style={{ width: '100%', maxWidth: 400, margin: '0 16px' }}>
            <Text style={{ fontSize: 18, fontWeight: 700, color: '#1c1917', marginBottom: 20, display: 'block' }}>新建租户</Text>

            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 14, fontWeight: 500, color: '#57534e', marginBottom: 6, display: 'block' }}>
                租户名称 <Text style={{ color: '#dc2626' }}>*</Text>
              </Text>
              <Input className="input-field" placeholder="如：示例公司" value={formName} onInput={(e) => setFormName(e.detail.value)} />
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 14, fontWeight: 500, color: '#57534e', marginBottom: 6, display: 'block' }}>
                标识 (slug) <Text style={{ color: '#dc2626' }}>*</Text>
              </Text>
              <Input className="input-field" placeholder="如：demo-company（小写字母+数字+短横线）" value={formSlug} onInput={(e) => setFormSlug(e.detail.value)} />
            </View>

            <View style={{ display: 'flex', gap: 12 }}>
              <View style={{ flex: 1, padding: '10px 0', borderRadius: 4, cursor: 'pointer', fontSize: 14, fontWeight: 500, textAlign: 'center', border: '1px solid #e7e5e4', color: '#57534e' }} onClick={() => setShowModal(false)}>
                <Text>取消</Text>
              </View>
              <View style={{ flex: 1, padding: '10px 0', borderRadius: 4, cursor: 'pointer', fontSize: 14, fontWeight: 500, textAlign: 'center', backgroundColor: submitting ? '#0d9488' : '#0f766e', color: '#ffffff' }} onClick={submitting ? undefined : handleSubmit}>
                <Text>{submitting ? '创建中...' : '创建'}</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </AppShell>
  );
}
