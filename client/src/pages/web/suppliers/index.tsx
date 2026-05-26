import { useState, useEffect } from 'react';
import { View, Text, Input } from '@tarojs/components';
import AppShell from '../../../components/layout/app-shell';
import { suppliersApi } from '../../../services/suppliers';
import Taro from '@tarojs/taro';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const res = await suppliersApi.list();
      setSuppliers(res.items || []);
    } catch (err: any) {
      Taro.showToast({ title: err.message || '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSuppliers(); }, []);

  const openCreate = () => {
    setEditId(null);
    setFormName('');
    setFormContact('');
    setFormPhone('');
    setFormEmail('');
    setFormAddress('');
    setShowModal(true);
  };

  const openEdit = (sup: any) => {
    setEditId(sup.id);
    setFormName(sup.name);
    setFormContact(sup.contact || '');
    setFormPhone(sup.phone || '');
    setFormEmail(sup.email || '');
    setFormAddress(sup.address || '');
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    Taro.showModal({
      title: '确认删除',
      content: '删除后不可恢复，确定要删除该供应商吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await suppliersApi.remove(id);
            Taro.showToast({ title: '删除成功', icon: 'success' });
            loadSuppliers();
          } catch (err: any) {
            Taro.showToast({ title: err.message || '删除失败', icon: 'none' });
          }
        }
      },
    });
  };

  const handleSubmit = async () => {
    if (!formName.trim()) {
      Taro.showToast({ title: '请输入供应商名称', icon: 'none' });
      return;
    }

    setSubmitting(true);
    try {
      const data = {
        name: formName.trim(),
        contact: formContact.trim() || undefined,
        phone: formPhone.trim() || undefined,
        email: formEmail.trim() || undefined,
        address: formAddress.trim() || undefined,
      };
      if (editId) {
        await suppliersApi.update(editId, data);
        Taro.showToast({ title: '更新成功', icon: 'success' });
      } else {
        await suppliersApi.create(data);
        Taro.showToast({ title: '创建成功', icon: 'success' });
      }
      setShowModal(false);
      loadSuppliers();
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
            供应商管理
          </Text>
          <Text style={{ fontSize: 14, color: '#a8a29e', marginTop: 2, display: 'block' }}>
            共 {suppliers.length} 个供应商
          </Text>
        </View>
        <View
          style={{ backgroundColor: '#0f766e', color: '#ffffff', borderRadius: 4, padding: '8px 16px', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}
          onClick={openCreate}
        >
          <Text>+ 新增供应商</Text>
        </View>
      </View>

      {/* List card */}
      <View className="card">
        {/* Table header */}
        <View style={{ display: 'flex', padding: '12px 20px', borderBottom: '1px solid #e7e5e4' }}>
          <Text style={{ flex: 1, fontSize: 12, fontWeight: 500, color: '#78716c' }}>
            名称
          </Text>
          <Text style={{ flex: 1, fontSize: 12, fontWeight: 500, color: '#78716c' }}>
            联系人
          </Text>
          <Text style={{ flex: 1, fontSize: 12, fontWeight: 500, color: '#78716c' }}>
            电话
          </Text>
          <Text style={{ width: 112, fontSize: 12, fontWeight: 500, color: '#78716c' }}>
            操作
          </Text>
        </View>

        {/* Loading */}
        {loading && (
          <View style={{ padding: '64px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 14, color: '#a8a29e' }}>加载中...</Text>
          </View>
        )}

        {/* Empty state */}
        {!loading && suppliers.length === 0 && (
          <View style={{ padding: '64px 0', textAlign: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: 500, color: '#57534e', display: 'block' }}>暂无供应商</Text>
            <Text style={{ fontSize: 14, color: '#a8a29e', marginTop: 4, display: 'block' }}>
              点击"新增供应商"开始添加
            </Text>
          </View>
        )}

        {/* List rows */}
        {!loading && suppliers.length > 0 && (
          <View>
            {suppliers.map((sup, idx) => (
              <View
                key={sup.id}
                style={{
                  display: 'flex',
                  padding: '14px 20px',
                  alignItems: 'center',
                  fontSize: 14,
                  borderBottom: idx < suppliers.length - 1 ? '1px solid #f5f5f4' : 'none',
                }}
              >
                <Text style={{ flex: 1, fontWeight: 500, color: '#1c1917' }}>
                  {sup.name}
                </Text>
                <Text style={{ flex: 1, color: '#78716c' }}>
                  {sup.contact || '-'}
                </Text>
                <Text style={{ flex: 1, color: '#78716c' }}>
                  {sup.phone || '-'}
                </Text>
                <View style={{ width: 112, display: 'flex', gap: 6 }}>
                  <View
                    style={{ backgroundColor: '#f0fdfa', color: '#0f766e', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}
                    onClick={() => openEdit(sup)}
                  >
                    <Text>编辑</Text>
                  </View>
                  <View
                    style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}
                    onClick={() => handleDelete(sup.id)}
                  >
                    <Text>删除</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Modal */}
      {showModal && (
        <View style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <View className="card p-5" style={{ width: '100%', maxWidth: 400, margin: '0 16px' }}>
            <Text style={{ fontSize: 18, fontWeight: 700, color: '#1c1917', marginBottom: 20, display: 'block' }}>
              {editId ? '编辑供应商' : '新增供应商'}
            </Text>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: 500, color: '#57534e', marginBottom: 6, display: 'block' }}>
                供应商名称 <Text style={{ color: '#dc2626' }}>*</Text>
              </Text>
              <Input
                className="input-field"
                placeholder="请输入供应商名称"
                value={formName}
                onInput={(e) => setFormName(e.detail.value)}
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: 500, color: '#57534e', marginBottom: 6, display: 'block' }}>
                联系人
              </Text>
              <Input
                className="input-field"
                placeholder="请输入联系人（选填）"
                value={formContact}
                onInput={(e) => setFormContact(e.detail.value)}
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: 500, color: '#57534e', marginBottom: 6, display: 'block' }}>
                电话
              </Text>
              <Input
                className="input-field"
                placeholder="请输入电话（选填）"
                value={formPhone}
                onInput={(e) => setFormPhone(e.detail.value)}
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: 500, color: '#57534e', marginBottom: 6, display: 'block' }}>
                邮箱
              </Text>
              <Input
                className="input-field"
                placeholder="请输入邮箱（选填）"
                value={formEmail}
                onInput={(e) => setFormEmail(e.detail.value)}
              />
            </View>

            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 14, fontWeight: 500, color: '#57534e', marginBottom: 6, display: 'block' }}>
                地址
              </Text>
              <Input
                className="input-field"
                placeholder="请输入地址（选填）"
                value={formAddress}
                onInput={(e) => setFormAddress(e.detail.value)}
              />
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
