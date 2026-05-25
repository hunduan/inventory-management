import { useState } from 'react';
import { View, Text, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';

interface ParsedResult {
  action: string;
  product: string;
  quantity: number;
  unitPrice: number;
}

function parseVoiceInput(text: string): ParsedResult | null {
  const result: ParsedResult = { action: '', product: '', quantity: 0, unitPrice: 0 };
  if (text.includes('进') || text.includes('入') || text.includes('采购') || text.includes('买')) {
    result.action = 'PURCHASE';
  } else if (text.includes('出') || text.includes('卖') || text.includes('销售')) {
    result.action = 'SALE';
  } else { return null; }
  const qtyMatch = text.match(/(\d+)\s*(个|箱|斤|件|瓶|包)/);
  if (qtyMatch) result.quantity = parseInt(qtyMatch[1]);
  const priceMatch = text.match(/单价[价]?\s*(\d+)/) || text.match(/(\d+)\s*元/);
  if (priceMatch) result.unitPrice = parseInt(priceMatch[1]);
  const productMatch = text.match(/(进|买|出|卖)\s*(.{2,6})(?:\d|$)/);
  if (productMatch) result.product = productMatch[2];
  return result;
}

export default function VoicePage() {
  const [isRecording, setIsRecording] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [parsedResult, setParsedResult] = useState<ParsedResult | null>(null);
  const [showInput, setShowInput] = useState(false);

  const startRecording = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      setShowInput(true);
      Taro.showToast({ title: '录音完成，请输入文本', icon: 'none' });
    }, 1500);
  };

  const handleParse = () => {
    if (!textInput.trim()) { Taro.showToast({ title: '请输入语音文本', icon: 'none' }); return; }
    const result = parseVoiceInput(textInput);
    if (!result) { Taro.showToast({ title: '未能识别，请重试', icon: 'none' }); return; }
    setParsedResult(result);
    if (result.action === 'PURCHASE') {
      Taro.navigateTo({ url: `/pages/mini/purchase/index?name=${encodeURIComponent(result.product)}&quantity=${result.quantity}&unitCost=${result.unitPrice}` });
    } else {
      Taro.navigateTo({ url: `/pages/mini/sale/index?name=${encodeURIComponent(result.product)}&quantity=${result.quantity}&unitPrice=${result.unitPrice}` });
    }
  };

  return (
    <View className="min-h-screen" style={{ backgroundColor: '#f5f5f4' }}>
      <View style={{ backgroundColor: '#0f766e', padding: '20px 20px 16px' }}>
        <Text className="text-lg font-bold" style={{ color: '#ffffff' }} onClick={() => Taro.navigateBack()}>
          ← 语音录入
        </Text>
      </View>

      <View className="p-6 items-center">
        {/* Mic Button */}
        <View
          className="items-center justify-center mb-6"
          style={{
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: isRecording ? '#dc2626' : '#0f766e',
            opacity: isRecording ? 0.9 : 1,
            transform: isRecording ? 'scale(1.1)' : 'scale(1)',
          }}
          onClick={startRecording}
        >
          <Text style={{ fontSize: 32 }}>🎤</Text>
        </View>
        <Text className="text-sm mb-6" style={{ color: '#78716c' }}>点击麦克风开始录音</Text>

        {isRecording && (
          <View className="mb-4 px-4 py-2 rounded" style={{ backgroundColor: '#fef2f2' }}>
            <Text className="text-sm" style={{ color: '#dc2626' }}>正在录音...</Text>
          </View>
        )}

        {showInput && (
          <View className="card p-5 w-full" style={{ maxWidth: 400 }}>
            <Text className="text-sm mb-2" style={{ color: '#57534e' }}>或直接输入语音识别的文本：</Text>
            <Input
              className="input-field mb-4"
              placeholder="例如：进10箱茅台，单价2800"
              value={textInput}
              onInput={(e) => setTextInput(e.detail.value)}
            />
            <View
              className="w-full py-3 rounded flex items-center justify-center"
              style={{ backgroundColor: '#0f766e' }}
              onClick={handleParse}
            >
              <Text className="text-white font-medium">识别并跳转</Text>
            </View>
            {parsedResult && (
              <View className="mt-4 p-3 rounded" style={{ backgroundColor: '#f0fdfa' }}>
                <Text className="text-xs font-medium mb-1" style={{ color: '#0f766e' }}>识别结果</Text>
                <Text className="text-xs" style={{ color: '#0d9488' }}>
                  {parsedResult.action === 'PURCHASE' ? '采购' : '销售'} - {parsedResult.product || '未知'}
                  {' | '}数量: {parsedResult.quantity} | ¥{parsedResult.unitPrice}
                </Text>
              </View>
            )}
          </View>
        )}

        <View className="mt-8 text-center">
          <Text className="text-xs mb-1" style={{ color: '#a8a29e' }}>支持的说法：</Text>
          <Text className="text-xs" style={{ color: '#d6d3d1' }}>"进10箱茅台，单价2800"</Text>
          <Text className="text-xs" style={{ color: '#d6d3d1' }}>"出5件可乐，单价30"</Text>
        </View>
      </View>
    </View>
  );
}
