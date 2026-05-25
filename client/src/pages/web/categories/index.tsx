import { useState, useEffect } from 'react';
import { View, Text, Input } from '@tarojs/components';
import AppShell from '../../../components/layout/app-shell';
import { categoriesApi } from '../../../services/categories';
import Taro from '@tarojs/taro';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await categoriesApi.list();
      setCategories(res.items || []);
    } catch (err: any) {
      Taro.showToast({ title: err.message || '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCategories(); }, []);

  const openCreate = () => {
    setEditId(null);
    setFormName('');
    setFormDesc('');
    setShowModal(true);
  };

  const openEdit = (cat: any) => {
    setEditId(cat.id);
    setFormName(cat.name);
    setFormDesc(cat.description || '');
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    Taro.showModal({
      title: '确认删除',
      content: '删除后不可恢复，确定要删除该分类吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await categoriesApi.remove(id);
            Taro.showToast({ title: '删除成功', icon: 'success' });
            loadCategories();
          } catch (err: any) {
            Taro.showToast({ title: err.message || '删除失败', icon: 'none' });
          }
        }
      },
    });
  };

  const handleSubmit = async () => {
    if (!formName.trim()) {
      Taro.showToast({ title: '请输入分类名称', icon: 'none' });
      return;
    }

    setSubmitting(true);
    try {
      if (editId) {
        await categoriesApi.update(editId, { name: formName.trim(), description: formDesc.trim() });
        Taro.showToast({ title: '更新成功', icon: 'success' });
      } else {
        await categoriesApi.create({ name: formName.trim(), description: formDesc.trim() });
        Taro.showToast({ title: '创建成功', icon: 'success' });
      }
      setShowModal(false);
      loadCategories();
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
            分类管理
          </Text>
          <Text style={{ fontSize: 14, color: '#a8a29e', marginTop: 2, display: 'block' }}>
            共 {categories.length} 个分类
          </Text>
        </View>
        <View
          style={{ backgroundColor: '#0f766e', color: '#ffffff', borderRadius: 4, padding: '8px 16px', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}
          onClick={openCreate}
        >
          <Text>+ 新增分类</Text>
        </View>
      </View>

      {/* List card */}
      <View className="card">
        {/* Table header */}
        <View style={{ display: 'flex', padding: '12px 20px', borderBottom: '1px solid #e7e5e4' }}>
          <Text style={{ flex: 1, fontSize: 12, fontWeight: 500, color: '#78716c' }}>
            名称
          </Text>
          <Text style={{ flex: 2, fontSize: 12, fontWeight: 500, color: '#78716c' }}>
            描述
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
        {!loading && categories.length === 0 && (
          <View style={{ padding: '64px 0', textAlign: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: 500, color: '#57534e', display: 'block' }}>暂无分类</Text>
            <Text style={{ fontSize: 14, color: '#a8a29e', marginTop: 4, display: 'block' }}>
              点击"新增分类"开始添加
            </Text>
          </View>
        )}

        {/* List rows */}
        {!loading && categories.length > 0 && (
          <View>
            {categories.map((cat, idx) => (
              <View
                key={cat.id}
                style={{
                  display: 'flex',
                  padding: '14px 20px',
                  alignItems: 'center',
                  fontSize: 14,
                  borderBottom: idx < categories.length - 1 ? '1px solid #f5f5f4' : 'none',
                }}
              >
                <Text style={{ flex: 1, fontWeight: 500, color: '#1c1917' }}>
                  {cat.name}
                </Text>
                <Text style={{ flex: 2, color: '#78716c' }}>
                  {cat.description || '-'}
                </Text>
                <View style={{ width: 112, display: 'flex', gap: 6 }}>
                  <View
                    style={{ backgroundColor: '#f0fdfa', color: '#0f766e', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}
                    onClick={() => openEdit(cat)}
                  >
                    <Text>编辑</Text>
                  </View>
                  <View
                    style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}
                    onClick={() => handleDelete(cat.id)}
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
              {editId ? '编辑分类' : '新增分类'}
            </Text>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: 500, color: '#57534e', marginBottom: 6, display: 'block' }}>
                分类名称 <Text style={{ color: '#dc2626' }}>*</Text>
              </Text>
              <Input
                className="input-field"
                placeholder="请输入分类名称"
                value={formName}
                onInput={(e) => setFormName(e.detail.value)}
              />
            </View>

            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 14, fontWeight: 500, color: '#57534e', marginBottom: 6, display: 'block' }}>
                描述
              </Text>
              <Input
                className="input-field"
                placeholder="请输入描述（选填）"
                value={formDesc}
                onInput={(e) => setFormDesc(e.detail.value)}
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
