import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Button,
  Input,
  Select,
  Tag,
  Space,
  Spin,
  Empty,
  Alert,
  Pagination,
  message,
  Popconfirm,
  Card,
} from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { productsApi } from '../../api/products';
import { categoriesApi } from '../../api/categories';
import type { Product, Category, PaginatedResponse } from '../../types';

export default function ProductsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PaginatedResponse<Product> | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (categoryId) params.set('categoryId', categoryId);
      params.set('page', String(page));
      params.set('limit', '20');
      const result = await productsApi.list(params.toString());
      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '加载商品列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const result = await categoriesApi.list();
      setCategories(result);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchData();
  }, [page, categoryId]);

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await productsApi.remove(id);
      message.success('商品已禁用');
      fetchData();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '删除失败');
    } finally {
      setDeleting(null);
    }
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (_: string, record: Product) => (
        <a onClick={() => navigate(`/products/${record.id}/edit`)}>{record.name}</a>
      ),
    },
    {
      title: '条码',
      dataIndex: 'barcode',
      key: 'barcode',
      render: (v: string | null) => v || '-',
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      render: (v: string | null) => v || '-',
    },
    {
      title: '分类',
      key: 'category',
      render: (_: unknown, record: Product) => record.category?.name || '-',
    },
    {
      title: '售价',
      dataIndex: 'salePrice',
      key: 'salePrice',
      render: (v: number) => `¥${Number(v).toFixed(2)}`,
    },
    {
      title: '成本价',
      dataIndex: 'costPrice',
      key: 'costPrice',
      render: (v: number) => `¥${Number(v).toFixed(2)}`,
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (v: boolean) => (
        <Tag color={v ? 'green' : 'red'}>{v ? '启用' : '禁用'}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: Product) => (
        <Space>
          <Button
            type="link"
            size="small"
            onClick={() => navigate(`/products/${record.id}/edit`)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定禁用此商品？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" size="small" danger loading={deleting === record.id}>
              禁用
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <Input
            placeholder="搜索商品名称/条码/SKU"
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 250 }}
            allowClear
          />
          <Select
            placeholder="选择分类"
            value={categoryId}
            onChange={(v) => setCategoryId(v)}
            allowClear
            style={{ width: 180 }}
            options={categories.map((c) => ({ label: c.name, value: c.id }))}
          />
          <Button type="primary" onClick={handleSearch}>
            搜索
          </Button>
          <div style={{ flex: 1 }} />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/products/new')}
          >
            新增商品
          </Button>
        </div>
      </Card>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <Spin size="large" />
        </div>
      ) : error ? (
        <Alert
          message="加载失败"
          description={error}
          type="error"
          showIcon
          action={<Button onClick={fetchData}>重试</Button>}
        />
      ) : data && data.data.length > 0 ? (
        <Card>
          <div style={{ marginBottom: 12, color: '#78716c' }}>
            共 {data.total} 个商品
          </div>
          <Table
            dataSource={data.data}
            columns={columns}
            rowKey="id"
            pagination={false}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <Pagination
              current={page}
              total={data.total}
              pageSize={20}
              onChange={(p) => setPage(p)}
              showTotal={(t) => `共 ${t} 条`}
              showSizeChanger={false}
            />
          </div>
        </Card>
      ) : (
        <Empty description="暂无商品" style={{ padding: 80 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/products/new')}
          >
            新增商品
          </Button>
        </Empty>
      )}
    </div>
  );
}
