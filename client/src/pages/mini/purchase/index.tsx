import { useState, useEffect } from 'react';
import { View, Text, Input, Button, Picker } from '@tarojs/components';
import { purchasesApi } from '../../../services/purchases';
import { suppliersApi } from '../../../services/suppliers';
import { warehousesApi } from '../../../services/warehouses';
import { productsApi } from '../../../services/products';
import Taro from '@tarojs/taro';

export default function MiniPurchasePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [supplierIndex, setSupplierIndex] = useState(0);
  const [warehouseIndex, setWarehouseIndex] = useState(0);
  const [quantity, setQuantity] = useState('1');
  const [unitCost, setUnitCost] = useState('0');
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsRes, suppliersRes, warehousesRes] = await Promise.all([
          productsApi.list(),
          suppliersApi.list(),
          warehousesApi.list(),
        ]);
        setProducts(productsRes.items || []);
        setSuppliers(suppliersRes.items || []);
        setWarehouses(warehousesRes.items || []);
      } catch (err: any) {
        Taro.showToast({ title: '加载数据失败', icon: 'none' });
      }
    };
    loadData();
  }, []);

  // Pre-fill from URL params (from scan/voice)
  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params;
    if (params) {
      if (params.productId && params.name) {
        const p = products.find((x: any) => x.id === params.productId);
        if (p) setSelectedProduct(p);
      } else if (params.name) {
        setSelectedProduct({ id: '', name: params.name, costPrice: params.unitCost || 0 });
      }
      if (params.quantity) setQuantity(params.quantity);
      if (params.unitCost) setUnitCost(params.unitCost);
      if (params.barcode) setProductSearch(params.barcode);
    }
  }, [products]);

  const filteredProducts = products.filter((p: any) =>
    p.name?.includes(productSearch) || p.barcode?.includes(productSearch)
  );

  const handleSubmit = async () => {
    if (!selectedProduct) {
      Taro.showToast({ title: '请选择商品', icon: 'none' });
      return;
    }
    if (!quantity || parseFloat(quantity) <= 0) {
      Taro.showToast({ title: '请输入有效数量', icon: 'none' });
      return;
    }

    setLoading(true);
    try {
      await purchasesApi.create({
        supplierId: suppliers[supplierIndex]?.id || undefined,
        warehouseId: warehouses[warehouseIndex]?.id || undefined,
        remark: remark || undefined,
        items: [{
          productId: selectedProduct.id,
          quantity: parseFloat(quantity),
          unitCost: parseFloat(unitCost),
        }],
      });
      Taro.showToast({ title: '采购单已创建', icon: 'success' });
      Taro.navigateBack();
    } catch (err: any) {
      Taro.showToast({ title: err.message || '创建失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const supplierNames = suppliers.map((s: any) => s.name);
  const warehouseNames = warehouses.map((w: any) => w.name);

  return (
    <View className="min-h-screen bg-gray-50">
      <View className="bg-white px-5 py-4 flex items-center border-b border-gray-100">
        <Text className="text-lg font-bold text-gray-800">快速采购入库</Text>
      </View>

      <View className="p-4 space-y-4">
        {/* Product Search / Select */}
        <View className="bg-white rounded-xl shadow-sm p-4">
          <Text className="text-sm text-gray-600 mb-2">商品</Text>
          {showProductPicker ? (
            <View>
              <Input
                className="border border-gray-300 rounded-lg px-4 py-3 w-full mb-2"
                placeholder="搜索商品名称或条码"
                value={productSearch}
                onInput={(e) => setProductSearch(e.detail.value)}
              />
              <View className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                {filteredProducts.length === 0 ? (
                  <Text className="p-3 text-gray-400 text-sm">无匹配商品</Text>
                ) : (
                  filteredProducts.map((p: any) => (
                    <View
                      key={p.id}
                      className={`p-3 border-b border-gray-100 last:border-b-0 ${selectedProduct?.id === p.id ? 'bg-blue-50' : ''}`}
                      onClick={() => {
                        setSelectedProduct(p);
                        setUnitCost(String(p.costPrice || 0));
                        setShowProductPicker(false);
                      }}
                    >
                      <Text className="font-medium text-gray-800">{p.name}</Text>
                      <Text className="text-xs text-gray-400">{p.barcode || '-'}</Text>
                    </View>
                  ))
                )}
              </View>
              <Button className="text-sm text-gray-500 mt-2 bg-transparent" onClick={() => setShowProductPicker(false)}>取消</Button>
            </View>
          ) : (
            <View
              className="border border-gray-300 rounded-lg px-4 py-3 w-full"
              onClick={() => setShowProductPicker(true)}
            >
              <Text className={selectedProduct ? 'text-gray-800' : 'text-gray-400'}>
                {selectedProduct ? selectedProduct.name : '点击选择商品'}
              </Text>
            </View>
          )}
        </View>

        {/* Quantity */}
        <View className="bg-white rounded-xl shadow-sm p-4">
          <Text className="text-sm text-gray-600 mb-2">数量</Text>
          <Input
            className="border border-gray-300 rounded-lg px-4 py-3 w-full"
            type="number"
            value={quantity}
            onInput={(e) => setQuantity(e.detail.value)}
            placeholder="请输入数量"
          />
        </View>

        {/* Unit Cost */}
        <View className="bg-white rounded-xl shadow-sm p-4">
          <Text className="text-sm text-gray-600 mb-2">单价 (元)</Text>
          <Input
            className="border border-gray-300 rounded-lg px-4 py-3 w-full"
            type="number"
            value={unitCost}
            onInput={(e) => setUnitCost(e.detail.value)}
            placeholder="请输入单价"
          />
        </View>

        {/* Supplier */}
        <View className="bg-white rounded-xl shadow-sm p-4">
          <Text className="text-sm text-gray-600 mb-2">供应商</Text>
          {suppliers.length > 0 ? (
            <Picker mode="selector" range={supplierNames} value={supplierIndex} onChange={(e) => setSupplierIndex(Number(e.detail.value))}>
              <View className="border border-gray-300 rounded-lg px-4 py-3 w-full text-gray-700">
                {supplierNames[supplierIndex] || '请选择供应商'}
              </View>
            </Picker>
          ) : (
            <Input className="border border-gray-300 rounded-lg px-4 py-3 w-full" placeholder="暂无供应商" disabled />
          )}
        </View>

        {/* Warehouse */}
        <View className="bg-white rounded-xl shadow-sm p-4">
          <Text className="text-sm text-gray-600 mb-2">仓库</Text>
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
        <View className="bg-white rounded-xl shadow-sm p-4">
          <Text className="text-sm text-gray-600 mb-2">备注</Text>
          <Input
            className="border border-gray-300 rounded-lg px-4 py-3 w-full"
            placeholder="选填"
            value={remark}
            onInput={(e) => setRemark(e.detail.value)}
          />
        </View>

        {/* Total Display */}
        <View className="bg-white rounded-xl shadow-sm p-4">
          <View className="flex items-center justify-between">
            <Text className="text-gray-600">合计金额</Text>
            <Text className="text-xl font-bold text-blue-600">
              ¥{((parseFloat(quantity) || 0) * (parseFloat(unitCost) || 0)).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View className="flex flex-row gap-3 pt-2">
          <Button
            className="bg-gray-200 text-gray-700 rounded-xl py-3 flex-1"
            onClick={() => Taro.navigateBack()}
          >
            取消
          </Button>
          <Button
            className="bg-blue-600 text-white rounded-xl py-3 flex-1"
            loading={loading}
            onClick={handleSubmit}
          >
            创建采购单
          </Button>
        </View>
      </View>
    </View>
  );
}
