import { useState, useEffect } from 'react';
import { View, Text, Input, Picker } from '@tarojs/components';
import AppShell from '../../../components/layout/app-shell';
import { purchasesApi } from '../../../services/purchases';
import { suppliersApi } from '../../../services/suppliers';
import { warehousesApi } from '../../../services/warehouses';
import { productsApi } from '../../../services/products';
import Taro from '@tarojs/taro';

interface OrderItem {
  productId: string;
  productName: string;
  quantity: string;
  unitCost: string;
}

export default function NewPurchasePage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [supplierIndex, setSupplierIndex] = useState(0);
  const [warehouseIndex, setWarehouseIndex] = useState(0);
  const [remark, setRemark] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [suppliersRes, warehousesRes, productsRes] = await Promise.all([
          suppliersApi.list(),
          warehousesApi.list(),
          productsApi.list(),
        ]);
        setSuppliers(suppliersRes.items || []);
        setWarehouses(warehousesRes.items || []);
        setProducts(productsRes.items || []);
      } catch (err: any) {
        Taro.showToast({ title: '加载基础数据失败', icon: 'none' });
      }
    };
    loadOptions();
  }, []);

  const addItem = () => {
    setItems([...items, { productId: '', productName: '', quantity: '1', unitCost: '0' }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof OrderItem, value: string) => {
    setItems(items.map((item, i) => i !== index ? item : { ...item, [field]: value }));
  };

  const handleProductChange = (itemIndex: number, productIndex: number) => {
    const product = products[productIndex];
    if (!product) return;
    setItems(items.map((item, i) =>
      i !== itemIndex ? item : { ...item, productId: product.id, productName: product.name, unitCost: String(product.costPrice || 0) }
    ));
  };

  const supplierNames = suppliers.map((s: any) => s.name);
  const warehouseNames = warehouses.map((w: any) => w.name);
  const productNames = products.map((p: any) => p.name);

  const handleSubmit = async () => {
    if (items.length === 0) {
      Taro.showToast({ title: '请添加至少一个商品', icon: 'none' });
      return;
    }
    const invalidItem = items.find((i) => !i.productId || !i.quantity || parseFloat(i.quantity) <= 0);
    if (invalidItem) {
      Taro.showToast({ title: '请完善商品信息', icon: 'none' });
      return;
    }

    setLoading(true);
    try {
      const selectedSupplier = suppliers[supplierIndex];
      const selectedWarehouse = warehouses[warehouseIndex];
      await purchasesApi.create({
        supplierId: selectedSupplier?.id,
        warehouseId: selectedWarehouse?.id,
        remark: remark || undefined,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: parseFloat(i.quantity),
          unitCost: parseFloat(i.unitCost),
        })),
      });
      Taro.showToast({ title: '采购单已创建', icon: 'success' });
      Taro.navigateBack();
    } catch (err: any) {
      Taro.showToast({ title: err.message || '创建失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const total = items.reduce((sum, i) => sum + (parseFloat(i.quantity) || 0) * (parseFloat(i.unitCost) || 0), 0);

  return (
    <AppShell>
      <View className="max-w-2xl mx-auto">
        <View className="flex items-center gap-3 mb-6">
          <View
            className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer"
            style={{ background: '#f5f5f4', border: '1px solid #e7e5e4' }}
            onClick={() => Taro.navigateBack()}
          >
            <Text style={{ fontSize: 16, color: '#57534e' }}>←</Text>
          </View>
          <View>
            <Text className="page-title">新增采购订单</Text>
            <Text className="page-subtitle">填写采购信息</Text>
          </View>
        </View>

        <View
          className="rounded-xl p-6"
          style={{ background: '#ffffff', border: '1px solid #e7e5e4' }}
        >
          {/* Basic Info */}
          <View className="grid grid-cols-2 gap-4 mb-6">
            <View>
              <Text className="text-sm font-medium mb-1.5" style={{ color: '#57534e' }}>供应商</Text>
              {suppliers.length > 0 ? (
                <Picker mode="selector" range={supplierNames} value={supplierIndex} onChange={(e) => setSupplierIndex(Number(e.detail.value))}>
                  <View
                    className="rounded-lg px-4 py-2.5"
                    style={{ border: '1px solid #e7e5e4', background: '#fafaf9' }}
                  >
                    <Text className="text-sm" style={{ color: supplierNames[supplierIndex] ? '#292524' : '#d6d3d1' }}>
                      {supplierNames[supplierIndex] || '请选择供应商'}
                    </Text>
                  </View>
                </Picker>
              ) : (
                <View className="rounded-lg px-4 py-2.5" style={{ border: '1px solid #e7e5e4', background: '#fafaf9' }}>
                  <Text className="text-sm" style={{ color: '#d6d3d1' }}>暂无供应商</Text>
                </View>
              )}
            </View>

            <View>
              <Text className="text-sm font-medium mb-1.5" style={{ color: '#57534e' }}>仓库</Text>
              {warehouses.length > 0 ? (
                <Picker mode="selector" range={warehouseNames} value={warehouseIndex} onChange={(e) => setWarehouseIndex(Number(e.detail.value))}>
                  <View
                    className="rounded-lg px-4 py-2.5"
                    style={{ border: '1px solid #e7e5e4', background: '#fafaf9' }}
                  >
                    <Text className="text-sm" style={{ color: warehouseNames[warehouseIndex] ? '#292524' : '#d6d3d1' }}>
                      {warehouseNames[warehouseIndex] || '请选择仓库'}
                    </Text>
                  </View>
                </Picker>
              ) : (
                <View className="rounded-lg px-4 py-2.5" style={{ border: '1px solid #e7e5e4', background: '#fafaf9' }}>
                  <Text className="text-sm" style={{ color: '#d6d3d1' }}>暂无仓库</Text>
                </View>
              )}
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-sm font-medium mb-1.5" style={{ color: '#57534e' }}>备注</Text>
            <Input
              className="input-field"
              style={{ width: '100%' }}
              placeholder="选填"
              value={remark}
              onInput={(e) => setRemark(e.detail.value)}
            />
          </View>

          {/* Items */}
          <View
            className="pt-6"
            style={{ borderTop: '1px solid #f5f5f4' }}
          >
            <View className="flex items-center justify-between mb-4">
              <Text className="text-sm font-semibold" style={{ color: '#292524' }}>商品明细</Text>
              <View
                className="px-4 py-2 rounded-lg cursor-pointer text-sm font-medium"
                style={{ background: '#f0fdfa', color: '#0f766e' }}
                onClick={addItem}
              >
                <Text>+ 添加商品</Text>
              </View>
            </View>

            {items.length === 0 && (
              <View
                className="rounded-xl py-10 text-center"
                style={{ border: '2px dashed #e7e5e4' }}
              >
                <Text style={{ fontSize: 32, display: 'block' }}>📦</Text>
                <Text className="text-sm mt-2" style={{ color: '#a8a29e' }}>点击上方按钮添加商品</Text>
              </View>
            )}

            {items.map((item, idx) => (
              <View
                key={idx}
                className="rounded-xl p-4 mb-3"
                style={{ background: '#fafaf9', border: '1px solid #e7e5e4' }}
              >
                <View className="flex items-center justify-between mb-3">
                  <Text className="text-sm font-semibold" style={{ color: '#292524' }}>
                    商品 #{idx + 1}
                  </Text>
                  <View
                    className="px-3 py-1 rounded-lg cursor-pointer text-xs font-medium"
                    style={{ background: '#fef2f2', color: '#991b1b' }}
                    onClick={() => removeItem(idx)}
                  >
                    <Text>删除</Text>
                  </View>
                </View>

                <View className="grid grid-cols-3 gap-3">
                  <View>
                    <Text className="text-xs font-medium mb-1" style={{ color: '#78716c' }}>商品</Text>
                    <Picker
                      mode="selector"
                      range={productNames}
                      value={productNames.indexOf(item.productName)}
                      onChange={(e) => handleProductChange(idx, Number(e.detail.value))}
                    >
                      <View
                        className="rounded-lg px-3 py-2"
                        style={{ border: '1px solid #e7e5e4', background: '#ffffff', minHeight: 36 }}
                      >
                        <Text className="text-sm" style={{ color: item.productName ? '#292524' : '#d6d3d1' }}>
                          {item.productName || '选择商品'}
                        </Text>
                      </View>
                    </Picker>
                  </View>
                  <View>
                    <Text className="text-xs font-medium mb-1" style={{ color: '#78716c' }}>数量</Text>
                    <Input
                      className="rounded-lg px-3 py-2"
                      style={{ border: '1px solid #e7e5e4', background: '#ffffff', width: '100%' }}
                      type="number"
                      value={item.quantity}
                      onInput={(e) => updateItem(idx, 'quantity', e.detail.value)}
                    />
                  </View>
                  <View>
                    <Text className="text-xs font-medium mb-1" style={{ color: '#78716c' }}>单价</Text>
                    <Input
                      className="rounded-lg px-3 py-2"
                      style={{ border: '1px solid #e7e5e4', background: '#ffffff', width: '100%' }}
                      type="number"
                      value={item.unitCost}
                      onInput={(e) => updateItem(idx, 'unitCost', e.detail.value)}
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Total */}
          {items.length > 0 && (
            <View className="flex justify-end items-center gap-2 py-4" style={{ borderTop: '1px solid #f5f5f4', marginTop: 8 }}>
              <Text className="text-sm" style={{ color: '#78716c' }}>合计</Text>
              <Text className="text-xl font-bold" style={{ color: '#0f766e' }}>
                ¥{total.toFixed(2)}
              </Text>
            </View>
          )}

          {/* Actions */}
          <View className="flex gap-3 pt-4" style={{ borderTop: '1px solid #f5f5f4', marginTop: 8 }}>
            <View
              className="flex-1 py-3 rounded-xl cursor-pointer text-sm font-medium text-center"
              style={{ border: '1px solid #e7e5e4', color: '#57534e' }}
              onClick={() => Taro.navigateBack()}
            >
              <Text>取消</Text>
            </View>
            <View
              className="flex-1 py-3 rounded-xl cursor-pointer text-sm font-medium text-center"
              style={{
                background: loading ? '#0d9488' : '#0f766e',
                color: 'white',
                opacity: loading ? 0.7 : 1,
              }}
              onClick={loading ? undefined : handleSubmit}
            >
              <Text>{loading ? '创建中...' : '创建采购单'}</Text>
            </View>
          </View>
        </View>
      </View>
    </AppShell>
  );
}
