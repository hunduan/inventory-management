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
      <View className="flex items-center justify-between mb-6">
        <View>
          <Text className="page-title">分类管理</Text>
          <Text className="page-subtitle">共 {categories.length} 个分类</Text>
        </View>
        <View
          className="px-5 py-2.5 rounded-lg cursor-pointer text-sm font-medium"
          style={{ background: '#0f766e', color: 'white' }}
          onClick={openCreate}
        >
          <Text>+ 新增分类</Text>
        </View>
      </View>

      <View
        className="rounded-xl overflow-hidden"
        style={{ background: '#ffffff', border: '1px solid #e7e5e4' }}
      >
        <View className="table-header">
          <Text className="flex-1">名称</Text>
          <Text className="flex-[2]">描述</Text>
          <Text className="w-28">操作</Text>
        </View>

        {loading && (
          <View className="py-16 flex items-center justify-center">
            <View className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <View key={i} className="loading-dot" style={{ width: 8, height: 8, borderRadius: 9999, background: '#0f766e' }} />
              ))}
            </View>
          </View>
        )}

        {!loading && categories.length === 0 && (
          <View className="py-16 text-center">
            <Text style={{ fontSize: 40, display: 'block' }}>📂</Text>
            <Text className="text-base font-medium mt-3" style={{ color: '#57534e' }}>暂无分类</Text>
            <Text className="text-sm mt-1" style={{ color: '#a8a29e' }}>点击右上角"新增分类"开始添加</Text>
          </View>
        )}

        {!loading && categories.length > 0 && (
          <View>
            {categories.map((cat, idx) => (
              <View
                key={cat.id}
                className="flex px-5 py-3.5 items-center text-sm"
                style={{
                  background: idx % 2 === 0 ? '#ffffff' : '#fafaf9',
                  borderBottom: idx < categories.length - 1 ? '1px solid #f5f5f4' : 'none',
                }}
              >
                <Text className="flex-1 font-medium" style={{ color: '#292524' }}>
                  {cat.name}
                </Text>
                <Text className="flex-[2]" style={{ color: '#78716c' }}>
                  {cat.description || '-'}
                </Text>
                <View className="w-28 flex gap-1.5">
                  <View
                    className="px-2.5 py-1 rounded-lg cursor-pointer text-xs font-medium"
                    style={{ background: '#f0fdfa', color: '#0f766e' }}
                    onClick={() => openEdit(cat)}
                  >
                    <Text>编辑</Text>
                  </View>
                  <View
                    className="px-2.5 py-1 rounded-lg cursor-pointer text-xs font-medium"
                    style={{ background: '#fef2f2', color: '#991b1b' }}
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
        <View className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <View
            className="rounded-2xl p-6 w-full mx-4"
            style={{
              maxWidth: 400,
              background: '#ffffff',
              boxShadow: '0 16px 48px rgba(0,0,0,0.15)',
              border: '1px solid #e7e5e4',
              animation: 'fadeInUp 0.2s ease',
            }}
          >
            <Text className="text-lg font-bold mb-5" style={{ color: '#292524' }}>
              {editId ? '编辑分类' : '新增分类'}
            </Text>

            <View>
              <Text className="text-sm font-medium mb-1.5" style={{ color: '#57534e' }}>
                分类名称 <Text style={{ color: '#dc2626' }}>*</Text>
              </Text>
              <Input
                className="input-field"
                style={{ width: '100%', marginBottom: 16 }}
                placeholder="请输入分类名称"
                value={formName}
                onInput={(e) => setFormName(e.detail.value)}
              />
            </View>

            <View>
              <Text className="text-sm font-medium mb-1.5" style={{ color: '#57534e' }}>描述</Text>
              <Input
                className="input-field"
                style={{ width: '100%', marginBottom: 24 }}
                placeholder="请输入描述（选填）"
                value={formDesc}
                onInput={(e) => setFormDesc(e.detail.value)}
              />
            </View>

            <View className="flex gap-3">
              <View
                className="flex-1 py-3 rounded-xl cursor-pointer text-sm font-medium text-center"
                style={{ border: '1px solid #e7e5e4', color: '#57534e' }}
                onClick={() => setShowModal(false)}
              >
                <Text>取消</Text>
              </View>
              <View
                className="flex-1 py-3 rounded-xl cursor-pointer text-sm font-medium text-center"
                style={{ background: submitting ? '#0d9488' : '#0f766e', color: 'white' }}
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
