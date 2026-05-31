import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Select, Button, Input, message, Typography } from 'antd';
import { stocktakeApi } from '../../api/stocktake';
import { warehousesApi } from '../../api/warehouses';
import type { Warehouse } from '../../types';

const { Title } = Typography;

export default function StocktakeNew() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  useEffect(() => {
    warehousesApi.list('limit=100').then((r) => setWarehouses(r.data)).catch(() => message.error('加载仓库失败'));
  }, []);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      const result = await stocktakeApi.create({ warehouseId: values.warehouseId, remark: values.remark });
      message.success('盘点单已创建');
      navigate(`/stocktakes/${result.id}`);
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <Title level={4} style={{ marginBottom: 24 }}>新增盘点单</Title>
      <Form form={form} layout="vertical" style={{ maxWidth: 500 }}>
        <Form.Item name="warehouseId" label="盘点仓库" rules={[{ required: true, message: '请选择仓库' }]}>
          <Select placeholder="选择仓库" options={warehouses.map((w) => ({ label: w.name, value: w.id }))} />
        </Form.Item>
        <Form.Item name="remark" label="备注">
          <Input.TextArea rows={2} placeholder="备注" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" onClick={handleSubmit} loading={submitting} style={{ marginRight: 12 }}>创建盘点单</Button>
          <Button onClick={() => navigate('/stocktakes')}>取消</Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
