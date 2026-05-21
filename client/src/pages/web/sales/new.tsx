import { useState, useEffect } from 'react';
import { View, Text, Input, Button, Picker } from '@tarojs/components';
import AppShell from '../../../components/layout/app-shell';
import { salesApi } from '../../../services/sales';
import { customersApi } from '../../../services/customers';
import { warehousesApi } from '../../../services/warehouses';
import { productsApi } from '../../../services/products';
import Taro from '@tarojs/taro';

interface OrderItem {
  productId: string;
  productName: string;
  quantity: string;
  unitPrice: string;
}

export default function NewSalePage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customerIndex, setCustomerIndex] = useState(0);
  const [warehouseIndex, setWarehouseIndex] = useState(0);
  const [remark, setRemark] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [customersRes, warehousesRes, productsRes] = await Promise.all([
          customersApi.list(),
          warehousesApi.list(),
          productsApi.list(),
        ]);
        setCustomers(customersRes.items || []);
        setWarehouses(warehousesRes.items || []);
        setProducts(productsRes.items || []);
      } catch (err: any) {
        Taro.showToast({ title: '加载基础数据失败', icon: 'none' });
      }
    };
    loadOptions();
  }, []);

  const addItem = () => {
    setItems([...items, { productId: '', productName: '', quantity: '1', unitPrice: '0' }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof OrderItem, value: string) => {
    const updated = items.map((item, i) => {
      if (i !== index) return item;
      return { ...item, [field]: value };
    });
    setItems(updated);
  };

  const handleProductChange = (itemIndex: number, productIndex: number) => {
    const product = products[productIndex];
    if (!product) return;
    const updated = items.map((item, i) => {
      if (i !== itemIndex) return item;
      return { ...item, productId: product.id, productName: product.name, unitPrice: String(product.salePrice || 0) };
    });
    setItems(updated);
  };

  const customerNames = customers.map((c: any) => c.name);
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
      const selectedCustomer = customers[customerIndex];
      const selectedWarehouse = warehouses[warehouseIndex];

      await salesApi.create({
        customerId: selectedCustomer?.id,
        warehouseId: selectedWarehouse?.id,
        remark: remark || undefined,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: parseFloat(i.quantity),
          unitPrice: parseFloat(i.unitPrice),
        })),
      });
      Taro.showToast({ title: '销售单已创建', icon: 'success' });
      Taro.navigateBack();
    } catch (err: any) {
      Taro.showToast({ title: err.message || '创建失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <View className="max-w-2xl mx-auto">
        <Text className="text-2xl font-bold mb-6 block">新增销售订单</Text>

        <View className="bg-white rounded-lg shadow p-6 space-y-4">
          {/* Customer */}
          <View>
            <Text className="text-sm text-gray-600 mb-1">客户</Text>
            {customers.length > 0 ? (
              <Picker mode="selector" range={customerNames} value={customerIndex} onChange={(e) => setCustomerIndex(Number(e.detail.value))}>
                <View className="border border-gray-300 rounded-lg px-4 py-3 w-full text-gray-700">
                  {customerNames[customerIndex] || '请选择客户'}
                </View>
              </Picker>
            ) : (
              <Input className="border border-gray-300 rounded-lg px-4 py-3 w-full" placeholder="暂无客户" disabled />
            )}
          </View>

          {/* Warehouse */}
          <View>
            <Text className="text-sm text-gray-600 mb-1">仓库</Text>
            {warehouses.length > 0 ? (
              <Picker mode="selector" range={warehouseNames} value={warehouseIndex} onChange={(e) => setWarehouseIndex(Number(e.detail.value))}>
                <View className="border border-gray-300 rounded-lg px-4 py-3 w-full text-gray-700">
                  {warehouseNames[warehouseIndex] || '请选择仓库'}
                </View>
              </Picker>
            ) : (
              <Input className="border border-gray-300 rounded-lg px-4 py-3 w-full" placeholder="暂无仓库" disabled />
            )}
          </View>

          {/* Remark */}
          <View>
            <Text className="text-sm text-gray-600 mb-1">备注</Text>
            <Input
              className="border border-gray-300 rounded-lg px-4 py-3 w-full"
              placeholder="选填"
              value={remark}
              onInput={(e) => setRemark(e.detail.value)}
            />
          </View>

          {/* Items */}
          <View>
            <View className="flex items-center justify-between mb-2">
              <Text className="text-sm text-gray-600 font-medium">商品明细</Text>
              <Button className="bg-indigo-500 text-white px-3 py-1 text-sm rounded-lg" onClick={addItem}>+ 添加商品</Button>
            </View>

            {items.length === 0 && (
              <View className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center text-gray-400">
                <Text>点击上方按钮添加商品</Text>
              </View>
            )}

            {items.map((item, idx) => (
              <View key={idx} className="border border-gray-200 rounded-lg p-4 mb-3">
                <View className="flex items-center justify-between mb-2">
                  <Text className="text-sm font-medium text-gray-700">商品 #{idx + 1}</Text>
                  <Button size="small" className="bg-red-100 text-red-600" onClick={() => removeItem(idx)}>删除</Button>
                </View>
                <View className="grid grid-cols-3 gap-3">
                  <View>
                    <Text className="text-xs text-gray-500 mb-1">商品</Text>
                    <Picker mode="selector" range={productNames} value={productNames.indexOf(item.productName)} onChange={(e) => handleProductChange(idx, Number(e.detail.value))}>
                      <View className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 min-h-[36px]">
                        {item.productName || '选择商品'}
                      </View>
                    </Picker>
                  </View>
                  <View>
                    <Text className="text-xs text-gray-500 mb-1">数量</Text>
                    <Input
                      className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                      type="number"
                      value={item.quantity}
                      onInput={(e) => updateItem(idx, 'quantity', e.detail.value)}
                    />
                  </View>
                  <View>
                    <Text className="text-xs text-gray-500 mb-1">单价</Text>
                    <Input
                      className="border border-gray-300 rounded-lg px-3 py-2 w-full"
                      type="number"
                      value={item.unitPrice}
                      onInput={(e) => updateItem(idx, 'unitPrice', e.detail.value)}
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Total */}
          {items.length > 0 && (
            <View className="text-right text-lg font-bold text-gray-800 pt-2">
              合计: ¥{items.reduce((sum, i) => sum + (parseFloat(i.quantity) || 0) * (parseFloat(i.unitPrice) || 0), 0).toFixed(2)}
            </View>
          )}

          {/* Actions */}
          <View className="flex gap-3 pt-4">
            <Button
              className="bg-gray-200 text-gray-700 rounded-lg py-3 flex-1"
              onClick={() => Taro.navigateBack()}
            >
              取消
            </Button>
            <Button
              className="bg-blue-600 text-white rounded-lg py-3 flex-1"
              loading={loading}
              onClick={handleSubmit}
            >
              创建销售单
            </Button>
          </View>
        </View>
      </View>
    </AppShell>
  );
}
