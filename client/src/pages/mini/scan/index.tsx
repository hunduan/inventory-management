import { useEffect } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';

export default function ScanPage() {
  useEffect(() => {
    scanCode();
  }, []);

  const scanCode = async () => {
    try {
      const res = await Taro.scanCode({});
      const { productsApi } = await import('../../../services/products');
      const product = await productsApi.getByBarcode(res.result);
      if (product) {
        Taro.navigateTo({
          url: `/pages/mini/purchase/index?productId=${product.id}&name=${product.name}&barcode=${res.result}`,
        });
      } else {
        Taro.showModal({
          title: '未找到商品',
          content: `条码 ${res.result} 未找到`,
          success: () => {
            Taro.navigateTo({ url: `/pages/mini/purchase/index?barcode=${res.result}` });
          },
        });
      }
    } catch (err) {
      Taro.showToast({ title: '扫码失败', icon: 'none' });
      Taro.navigateBack();
    }
  };

  return (
    <View className="flex flex-col items-center justify-center min-h-screen bg-black">
      <Text className="text-white text-lg mb-4">正在扫描...</Text>
      <View className="w-64 h-64 border-2 border-white rounded-lg relative overflow-hidden">
        <View className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500" style={{ animation: 'pulse 1s infinite' }} />
      </View>
      <Text className="text-gray-400 text-sm mt-6">将条码对准扫描框</Text>
    </View>
  );
}
