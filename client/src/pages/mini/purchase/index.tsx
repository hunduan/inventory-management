import { useState, useEffect } from 'react';
import { View, Text, Input, Picker } from '@tarojs/components';
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
      } catch { Taro.showToast({ title: '加载数据失败', icon: 'none' }); }
    };
    loadData();
  }, []);

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params;
    if (params && products.length > 0) {
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
    if (!selectedProduct) { Taro.showToast({ title: '请选择商品', icon: 'none' }); return; }
    if (!quantity || parseFloat(quantity) <= 0) { Taro.showToast({ title: '请输入有效数量', icon: 'none' }); return; }
    setLoading(true);
    try {
      await purchasesApi.create({
        supplierId: suppliers[supplierIndex]?.id || undefined,
        warehouseId: warehouses[warehouseIndex]?.id || undefined,
        remark: remark || undefined,
        items: [{ productId: selectedProduct.id, quantity: parseFloat(quantity), unitCost: parseFloat(unitCost) }],
      });
      Taro.showToast({ title: '采购单已创建', icon: 'success' });
      Taro.navigateBack();
    } catch (err: any) {
      Taro.showToast({ title: err.message || '创建失败', icon: 'none' });
    } finally { setLoading(false); }
  };

  const supplierNames = suppliers.map((s: any) => s.name);
  const warehouseNames = warehouses.map((w: any) => w.name);

  return (
    <View className="min-h-screen" style={{ backgroundColor: '#f5f5f4' }}>
      <View style={{ backgroundColor: '#0f766e', padding: '20px 20px 16px' }}>
        <Text className="text-lg font-bold" style={{ color: '#ffffff' }} onClick={() => Taro.navigateBack()}>
          ← 采购入库
        </Text>
      </View>

      <View className="p-4" style={{ gap: 12 }}>
        {/* Product */}
        <View className="card p-4">
          <Text className="text-sm mb-2" style={{ color: '#57534e', fontWeight: 500 }}>商品</Text>
          {showProductPicker ? (
            <View>
              <Input className="input-field mb-2" placeholder="搜索商品名称或条码" value={productSearch} onInput={(e) => setProductSearch(e.detail.value)} />
              <View className="overflow-y-auto" style={{ maxHeight: 180, border: '1px solid #e7e5e4', borderRadius: 6 }}>
                {filteredProducts.length === 0 ? (
                  <Text className="text-sm p-3" style={{ color: '#a8a29e' }}>无匹配商品</Text>
                ) : (
                  filteredProducts.map((p: any) => (
                    <View
                      key={p.id}
                      className="p-3"
                      style={{ borderBottom: '1px solid #f5f5f4', backgroundColor: selectedProduct?.id === p.id ? '#f0fdfa' : 'transparent' }}
                      onClick={() => { setSelectedProduct(p); setUnitCost(String(p.costPrice || 0)); setShowProductPicker(false); }}
                    >
                      <Text className="text-sm font-medium" style={{ color: '#1c1917' }}>{p.name}</Text>
                      <Text className="text-xs mt-0.5" style={{ color: '#a8a29e' }}>{p.barcode || '-'}</Text>
                    </View>
                  ))
                )}
              </View>
              <Text className="text-xs mt-2" style={{ color: '#0f766e' }} onClick={() => setShowProductPicker(false)}>取消</Text>
            </View>
          ) : (
            <View className="input-field" onClick={() => setShowProductPicker(true)}>
              <Text className="text-sm" style={{ color: selectedProduct ? '#1c1917' : '#d6d3d1' }}>
                {selectedProduct ? selectedProduct.name : '点击选择商品'}
              </Text>
            </View>
          )}
        </View>

        {/* Quantity & Unit Cost */}
        <View className="flex" style={{ flexDirection: 'row', gap: 12 }}>
          <View className="card p-4" style={{ flex: 1 }}>
            <Text className="text-sm mb-2" style={{ color: '#57534e', fontWeight: 500 }}>数量</Text>
            <Input className="input-field" type="number" value={quantity} onInput={(e) => setQuantity(e.detail.value)} placeholder="数量" />
          </View>
          <View className="card p-4" style={{ flex: 1 }}>
            <Text className="text-sm mb-2" style={{ color: '#57534e', fontWeight: 500 }}>单价</Text>
            <Input className="input-field" type="number" value={unitCost} onInput={(e) => setUnitCost(e.detail.value)} placeholder="单价" />
          </View>
        </View>

        {/* Supplier */}
        <View className="card p-4">
          <Text className="text-sm mb-2" style={{ color: '#57534e', fontWeight: 500 }}>供应商</Text>
          {suppliers.length > 0 ? (
            <Picker mode="selector" range={supplierNames} value={supplierIndex} onChange={(e) => setSupplierIndex(Number(e.detail.value))}>
              <View className="input-field">
                <Text className="text-sm" style={{ color: '#1c1917' }}>{supplierNames[supplierIndex] || '请选择'}</Text>
              </View>
            </Picker>
          ) : (
            <Input className="input-field" placeholder="暂无供应商" disabled />
          )}
        </View>

        {/* Warehouse */}
        <View className="card p-4">
          <Text className="text-sm mb-2" style={{ color: '#57534e', fontWeight: 500 }}>仓库</Text>
          {warehouses.length > 0 ? (
            <Picker mode="selector" range={warehouseNames} value={warehouseIndex} onChange={(e) => setWarehouseIndex(Number(e.detail.value))}>
              <View className="input-field">
                <Text className="text-sm" style={{ color: '#1c1917' }}>{warehouseNames[warehouseIndex] || '请选择'}</Text>
              </View>
            </Picker>
          ) : (
            <Input className="input-field" placeholder="暂无仓库" disabled />
          )}
        </View>

        {/* Remark */}
        <View className="card p-4">
          <Text className="text-sm mb-2" style={{ color: '#57534e', fontWeight: 500 }}>备注</Text>
          <Input className="input-field" placeholder="选填" value={remark} onInput={(e) => setRemark(e.detail.value)} />
        </View>

        {/* Total & Submit */}
        <View className="card p-4">
          <View className="flex items-center justify-between" style={{ flexDirection: 'row' }}>
            <Text className="text-sm" style={{ color: '#78716c' }}>合计</Text>
            <Text className="text-lg font-bold" style={{ color: '#1c1917' }}>
              ¥{((parseFloat(quantity) || 0) * (parseFloat(unitCost) || 0)).toFixed(2)}
            </Text>
          </View>
        </View>

        <View className="flex" style={{ flexDirection: 'row', gap: 12, paddingTop: 4 }}>
          <View className="flex-1 py-3 rounded flex items-center justify-center" style={{ border: '1px solid #e7e5e4' }} onClick={() => Taro.navigateBack()}>
            <Text className="text-sm" style={{ color: '#57534e' }}>取消</Text>
          </View>
          <View
            className="flex-1 py-3 rounded flex items-center justify-center"
            style={{ backgroundColor: loading ? '#0d9488' : '#0f766e', opacity: loading ? 0.6 : 1 }}
            onClick={loading ? undefined : handleSubmit}
          >
            <Text className="text-sm font-medium text-white">{loading ? '创建中...' : '创建采购单'}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
