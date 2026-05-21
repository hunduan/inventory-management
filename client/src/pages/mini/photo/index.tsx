import { useState, useEffect } from 'react';
import { View, Text, Image, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';

export default function PhotoPage() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const takePhoto = async () => {
    try {
      const res = await Taro.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['camera', 'album'],
      });

      const tempFile = res.tempFiles[0];
      setPhoto(tempFile.tempFilePath);
      setLoading(true);

      // Simulate OCR processing
      setTimeout(() => {
        setOcrResult({
          text: 'OCR识别结果: 示例商品',
          items: [
            { name: '示例商品A', barcode: '6901234567890' },
            { name: '示例商品B', barcode: '6901234567891' },
          ],
        });
        setLoading(false);
        Taro.showToast({ title: '识别完成', icon: 'success' });
      }, 1500);
    } catch (err: any) {
      if (err.errMsg !== 'chooseMedia:fail cancel') {
        Taro.showToast({ title: '拍照失败', icon: 'none' });
      }
    }
  };

  const handleCreatePurchase = (item: any) => {
    Taro.navigateTo({
      url: `/pages/mini/purchase/index?name=${encodeURIComponent(item.name)}&barcode=${item.barcode}`,
    });
  };

  return (
    <View className="min-h-screen bg-gray-50">
      <View className="bg-white px-5 py-4 flex items-center border-b border-gray-100">
        <Text className="text-lg font-bold text-gray-800">拍照入库</Text>
      </View>

      <View className="p-4 space-y-4">
        {/* Photo Area */}
        <View
          className="bg-white rounded-xl shadow-sm overflow-hidden"
          onClick={takePhoto}
        >
          {photo ? (
            <Image src={photo} className="w-full h-64 object-cover" mode="aspectFit" />
          ) : (
            <View className="w-full h-48 flex flex-col items-center justify-center bg-gray-100">
              <Text className="text-5xl mb-3">📷</Text>
              <Text className="text-gray-500">点击拍照或从相册选择</Text>
            </View>
          )}
        </View>

        {loading && (
          <View className="bg-white rounded-xl p-4 text-center">
            <Text className="text-gray-500">正在识别图片中的商品...</Text>
          </View>
        )}

        {/* OCR Results */}
        {ocrResult && (
          <View className="bg-white rounded-xl shadow-sm p-4">
            <Text className="font-bold text-gray-800 mb-3">识别结果</Text>
            <Text className="text-sm text-gray-600 mb-3">{ocrResult.text}</Text>

            {ocrResult.items.map((item: any, idx: number) => (
              <View key={idx} className="border border-gray-200 rounded-lg p-3 mb-3 last:mb-0">
                <View className="flex items-center justify-between mb-2">
                  <View>
                    <Text className="font-medium text-gray-800">{item.name}</Text>
                    <Text className="text-xs text-gray-400">{item.barcode}</Text>
                  </View>
                  <Button
                    className="bg-blue-500 text-white text-sm px-4 py-1 rounded-lg"
                    onClick={() => handleCreatePurchase(item)}
                  >
                    入库
                  </Button>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Take Photo Button */}
        {!loading && (
          <Button
            className="bg-indigo-500 text-white rounded-xl py-4 w-full"
            onClick={takePhoto}
          >
            {photo ? '重新拍照' : '拍照识别'}
          </Button>
        )}
      </View>
    </View>
  );
}
