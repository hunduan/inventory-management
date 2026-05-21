import { useState, useEffect } from 'react';
import { View, Text, Input, Button, Modal } from '@tarojs/components';
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
      <View className="mb-4 flex items-center justify-between">
        <Text className="text-2xl font-bold">分类管理</Text>
        <Button className="bg-blue-600 text-white px-4 rounded-lg" onClick={openCreate}>新增分类</Button>
      </View>

      <View className="bg-white rounded-lg shadow overflow-hidden">
        <View className="flex p-4 bg-gray-50 font-bold border-b">
          <Text className="flex-1">名称</Text>
          <Text className="flex-2">描述</Text>
          <Text className="w-24">操作</Text>
        </View>
        {categories.map((cat) => (
          <View key={cat.id} className="flex p-4 border-b items-center hover:bg-gray-50">
            <Text className="flex-1">{cat.name}</Text>
            <Text className="flex-2 text-gray-500">{cat.description || '-'}</Text>
            <View className="w-24 flex gap-2">
              <Button size="small" onClick={() => openEdit(cat)}>编辑</Button>
              <Button size="small" className="bg-red-500 text-white" onClick={() => handleDelete(cat.id)}>删除</Button>
            </View>
          </View>
        ))}
        {categories.length === 0 && !loading && (
          <View className="p-8 text-center text-gray-400">
            <Text>暂无分类，点击上方按钮新增</Text>
          </View>
        )}
      </View>

      {/* Create/Edit Modal */}
      {showModal && (
        <View className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <View className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <Text className="text-xl font-bold mb-4">{editId ? '编辑分类' : '新增分类'}</Text>

            <View className="space-y-4">
              <View>
                <Text className="text-sm text-gray-600 mb-1">分类名称 *</Text>
                <Input
                  className="border border-gray-300 rounded-lg px-4 py-3 w-full"
                  placeholder="请输入分类名称"
                  value={formName}
                  onInput={(e) => setFormName(e.detail.value)}
                />
              </View>
              <View>
                <Text className="text-sm text-gray-600 mb-1">描述</Text>
                <Input
                  className="border border-gray-300 rounded-lg px-4 py-3 w-full"
                  placeholder="请输入描述（选填）"
                  value={formDesc}
                  onInput={(e) => setFormDesc(e.detail.value)}
                />
              </View>
            </View>

            <View className="flex gap-3 mt-6">
              <Button
                className="bg-gray-200 text-gray-700 rounded-lg py-3 flex-1"
                onClick={() => setShowModal(false)}
              >
                取消
              </Button>
              <Button
                className="bg-blue-600 text-white rounded-lg py-3 flex-1"
                loading={submitting}
                onClick={handleSubmit}
              >
                {editId ? '保存' : '创建'}
              </Button>
            </View>
          </View>
        </View>
      )}
    </AppShell>
  );
}
