import { useState, useEffect } from 'react';
import { View, Text, Input, Picker } from '@tarojs/components';
import { warehousesApi } from '../../../services/warehouses';
import { productsApi } from '../../../services/products';
import { api } from '../../../utils/request';
import Taro from '@tarojs/taro';

export default function MiniTransfersPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [fromIndex, setFromIndex] = useState(0);
  const [toIndex, setToIndex] = useState(0);
  const [quantity, setQuantity] = useState('1');
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [pr, wr] = await Promise.all([
          productsApi.list(),
          warehousesApi.list(),
        ]);
        setProducts(pr.items || []);
        setWarehouses(wr.items || []);
      } catch { Taro.showToast({ title: '加载数据失败', icon: 'none' }); }
    };
    load();
  }, []);

  const filteredProducts = products.filter((p: any) =>
    p.name?.includes(productSearch) || p.barcode?.includes(productSearch)
  );

  const handleSubmit = async () => {
    if (!selectedProduct) { Taro.showToast({ title: '请选择商品', icon: 'none' }); return; }
    if (!quantity || parseFloat(quantity) <= 0) { Taro.showToast({ title: '请输入有效数量', icon: 'none' }); return; }
    if (fromIndex === toIndex && warehouses[fromIndex]?.id === warehouses[toIndex]?.id) {
      Taro.showToast({ title: '源仓库和目标仓库不能相同', icon: 'none' }); return;
    }
    setLoading(true);
    try {
      await api.post('/transfers', {
        fromWarehouseId: warehouses[fromIndex]?.id,
        toWarehouseId: warehouses[toIndex]?.id,
        remark: remark || undefined,
        items: [{ productId: selectedProduct.id, quantity: parseFloat(quantity) }],
      });
      Taro.showToast({ title: '调拨单已创建', icon: 'success' });
      Taro.navigateBack();
    } catch (err: any) {
      Taro.showToast({ title: err.message || '创建失败', icon: 'none' });
    } finally { setLoading(false); }
  };

  const warehouseNames = warehouses.map((w: any) => w.name);

  return (
    <View style={{ backgroundColor: '#f5f5f4', minHeight: '100vh' }}>
      <View style={{ background: 'linear-gradient(135deg, #0f766e 0%, #0d3d3a 100%)', padding: '20px 20px 16px' }}>
        <Text style={{ fontSize: 17, fontWeight: 700, color: '#ffffff' }} onClick={() => Taro.navigateBack()}>
          ← 库存调拨
        </Text>
      </View>

      <View style={{ padding: 16, gap: 12 }}>
        {/* Product */}
        <View style={{ backgroundColor: '#ffffff', borderRadius: 14, padding: 16 }}>
          <Text style={{ fontSize: 13, color: '#57534e', fontWeight: 500, marginBottom: 8 }}>商品</Text>
          {showProductPicker ? (
            <View>
              <Input className="input-field" style={{ marginBottom: 8, fontSize: 14 }} placeholder="搜索商品名称或条码" value={productSearch} onInput={(e) => setProductSearch(e.detail.value)} />
              <View style={{ maxHeight: 180, border: '1px solid #e7e5e4', borderRadius: 8 }}>
                {filteredProducts.length === 0 ? (
                  <Text style={{ fontSize: 13, padding: 12, color: '#a8a29e' }}>无匹配商品</Text>
                ) : (
                  filteredProducts.map((p: any) => (
                    <View
                      key={p.id}
                      style={{ padding: 12, borderBottom: '1px solid #f5f5f4', backgroundColor: selectedProduct?.id === p.id ? '#f0fdfa' : 'transparent' }}
                      onClick={() => { setSelectedProduct(p); setShowProductPicker(false); }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: 500, color: '#1c1917' }}>{p.name}</Text>
                      <Text style={{ fontSize: 11, color: '#a8a29e', marginTop: 2 }}>{p.barcode || '-'}</Text>
                    </View>
                  ))
                )}
              </View>
              <Text style={{ fontSize: 12, color: '#0f766e', marginTop: 6 }} onClick={() => setShowProductPicker(false)}>取消</Text>
            </View>
          ) : (
            <View className="input-field" style={{ fontSize: 14 }} onClick={() => setShowProductPicker(true)}>
              <Text style={{ fontSize: 14, color: selectedProduct ? '#1c1917' : '#d6d3d1' }}>
                {selectedProduct ? selectedProduct.name : '点击选择商品'}
              </Text>
            </View>
          )}
        </View>

        {/* Quantity */}
        <View style={{ backgroundColor: '#ffffff', borderRadius: 14, padding: 16 }}>
          <Text style={{ fontSize: 13, color: '#57534e', fontWeight: 500, marginBottom: 8 }}>数量</Text>
          <Input className="input-field" style={{ fontSize: 14 }} type="number" value={quantity} onInput={(e) => setQuantity(e.detail.value)} placeholder="输入数量" />
        </View>

        {/* From Warehouse */}
        <View style={{ backgroundColor: '#ffffff', borderRadius: 14, padding: 16 }}>
          <Text style={{ fontSize: 13, color: '#57534e', fontWeight: 500, marginBottom: 8 }}>源仓库</Text>
          {warehouses.length > 0 ? (
            <Picker mode="selector" range={warehouseNames} value={fromIndex} onChange={(e) => setFromIndex(Number(e.detail.value))}>
              <View className="input-field" style={{ fontSize: 14 }}>
                <Text style={{ fontSize: 14, color: '#1c1917' }}>{warehouseNames[fromIndex]}</Text>
              </View>
            </Picker>
          ) : (
            <Input className="input-field" style={{ fontSize: 14 }} placeholder="暂无仓库" disabled />
          )}
        </View>

        {/* To Warehouse */}
        <View style={{ backgroundColor: '#ffffff', borderRadius: 14, padding: 16 }}>
          <Text style={{ fontSize: 13, color: '#57534e', fontWeight: 500, marginBottom: 8 }}>目标仓库</Text>
          {warehouses.length > 0 ? (
            <Picker mode="selector" range={warehouseNames} value={toIndex} onChange={(e) => setToIndex(Number(e.detail.value))}>
              <View className="input-field" style={{ fontSize: 14 }}>
                <Text style={{ fontSize: 14, color: '#1c1917' }}>{warehouseNames[toIndex]}</Text>
              </View>
            </Picker>
          ) : (
            <Input className="input-field" style={{ fontSize: 14 }} placeholder="暂无仓库" disabled />
          )}
        </View>

        {/* Remark */}
        <View style={{ backgroundColor: '#ffffff', borderRadius: 14, padding: 16 }}>
          <Text style={{ fontSize: 13, color: '#57534e', fontWeight: 500, marginBottom: 8 }}>备注</Text>
          <Input className="input-field" style={{ fontSize: 14 }} placeholder="选填" value={remark} onInput={(e) => setRemark(e.detail.value)} />
        </View>

        {/* Submit */}
        <View style={{ flexDirection: 'row', gap: 12, paddingTop: 4 }}>
          <View style={{ flex: 1, paddingTop: 14, paddingBottom: 14, borderRadius: 10, alignItems: 'center', border: '1px solid #e7e5e4' }} onClick={() => Taro.navigateBack()}>
            <Text style={{ fontSize: 14, color: '#57534e' }}>取消</Text>
          </View>
          <View
            style={{ flex: 1, paddingTop: 14, paddingBottom: 14, borderRadius: 10, alignItems: 'center', backgroundColor: '#0f766e', opacity: loading ? 0.6 : 1 }}
            onClick={loading ? undefined : handleSubmit}
          >
            <Text style={{ fontSize: 14, fontWeight: 600, color: '#ffffff' }}>{loading ? '创建中...' : '创建调拨单'}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
