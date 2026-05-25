import { useEffect } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';

export default function ScanPage() {
  useEffect(() => { scanCode(); }, []);

  const scanCode = async () => {
    try {
      const res = await Taro.scanCode({});
      const { productsApi } = await import('../../../services/products');
      const product = await productsApi.getByBarcode(res.result);
      if (product) {
        Taro.navigateTo({ url: `/pages/mini/purchase/index?productId=${product.id}&name=${product.name}&barcode=${res.result}` });
      } else {
        Taro.showModal({
          title: '未找到商品',
          content: `条码 ${res.result} 未找到`,
          success: () => Taro.navigateTo({ url: `/pages/mini/purchase/index?barcode=${res.result}` }),
        });
      }
    } catch {
      Taro.showToast({ title: '扫码失败', icon: 'none' });
      Taro.navigateBack();
    }
  };

  return (
    <View className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0f172a' }}>
      <View className="items-center">
        <View style={{ width: 48, height: 48, borderRadius: 10, backgroundColor: '#0f766e', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Text style={{ color: 'white', fontSize: 20 }}>📱</Text>
        </View>
        <Text className="text-base mb-4" style={{ color: '#f1f5f9' }}>正在扫描...</Text>
        <View
          className="items-center justify-center"
          style={{ width: 200, height: 200, borderRadius: 12, border: '2px solid rgba(20,184,166,0.5)', position: 'relative' }}
        >
          <View style={{ width: '100%', height: 2, backgroundColor: '#14b8a6', position: 'absolute', top: '50%' }} />
        </View>
        <Text className="text-sm mt-6" style={{ color: '#94a3b8' }}>将条码对准扫描框</Text>
      </View>
    </View>
  );
}
