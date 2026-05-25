import { useState, useEffect } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';

export default function PhotoPage() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const takePhoto = async () => {
    try {
      const res = await Taro.chooseMedia({ count: 1, mediaType: ['image'], sourceType: ['camera', 'album'] });
      const tempFile = res.tempFiles[0];
      setPhoto(tempFile.tempFilePath);
      setLoading(true);
      setTimeout(() => {
        setOcrResult({
          text: '识别结果',
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

  return (
    <View className="min-h-screen" style={{ backgroundColor: '#f5f5f4' }}>
      <View style={{ backgroundColor: '#0f766e', padding: '20px 20px 16px' }}>
        <Text className="text-lg font-bold" style={{ color: '#ffffff' }} onClick={() => Taro.navigateBack()}>
          ← 拍照入库
        </Text>
      </View>

      <View className="p-4" style={{ gap: 12 }}>
        {/* Photo */}
        <View className="card overflow-hidden" onClick={takePhoto}>
          {photo ? (
            <Image src={photo} className="w-full" style={{ height: 240 }} mode="aspectFit" />
          ) : (
            <View className="w-full flex items-center justify-center" style={{ height: 180, backgroundColor: '#fafaf9' }}>
              <Text className="text-sm" style={{ color: '#a8a29e' }}>点击拍照或从相册选择</Text>
            </View>
          )}
        </View>

        {loading && (
          <View className="card p-4 items-center">
            <Text className="text-sm" style={{ color: '#78716c' }}>正在识别图片中的商品...</Text>
          </View>
        )}

        {/* OCR Results */}
        {ocrResult && (
          <View className="card p-4">
            <Text className="text-sm font-bold mb-3" style={{ color: '#1c1917' }}>识别结果</Text>
            {ocrResult.items.map((item: any, idx: number) => (
              <View key={idx} className="p-3 mb-3" style={{ border: '1px solid #e7e5e4', borderRadius: 6 }}>
                <View className="flex items-center justify-between" style={{ flexDirection: 'row' }}>
                  <View>
                    <Text className="text-sm font-medium" style={{ color: '#1c1917' }}>{item.name}</Text>
                    <Text className="text-xs mt-0.5" style={{ color: '#a8a29e' }}>{item.barcode}</Text>
                  </View>
                  <View
                    className="px-3 py-1.5 rounded"
                    style={{ backgroundColor: '#0f766e' }}
                    onClick={() => Taro.navigateTo({ url: `/pages/mini/purchase/index?name=${encodeURIComponent(item.name)}&barcode=${item.barcode}` })}
                  >
                    <Text className="text-xs text-white">入库</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {!loading && (
          <View
            className="w-full py-3 rounded flex items-center justify-center"
            style={{ backgroundColor: '#0f766e' }}
            onClick={takePhoto}
          >
            <Text className="text-white font-medium">{photo ? '重新拍照' : '拍照识别'}</Text>
          </View>
        )}
      </View>
    </View>
  );
}
