import { useState } from 'react';
import { View, Text, Button, Input } from '@tarojs/components';
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
  } else {
    return null;
  }

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
    // Simulate recording: after a short delay, show text input
    setTimeout(() => {
      setIsRecording(false);
      setShowInput(true);
      Taro.showToast({ title: '录音完成，请输入文本', icon: 'none' });
    }, 1500);
  };

  const handleParse = () => {
    if (!textInput.trim()) {
      Taro.showToast({ title: '请输入语音文本', icon: 'none' });
      return;
    }

    const result = parseVoiceInput(textInput);
    if (!result) {
      Taro.showToast({ title: '未能识别，请重试', icon: 'none' });
      return;
    }

    setParsedResult(result);

    // Navigate based on action
    if (result.action === 'PURCHASE') {
      Taro.navigateTo({
        url: `/pages/mini/purchase/index?name=${encodeURIComponent(result.product)}&quantity=${result.quantity}&unitCost=${result.unitPrice}`,
      });
    } else if (result.action === 'SALE') {
      Taro.navigateTo({
        url: `/pages/mini/sale/index?name=${encodeURIComponent(result.product)}&quantity=${result.quantity}&unitPrice=${result.unitPrice}`,
      });
    }
  };

  return (
    <View className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex flex-col items-center justify-center p-6">
      <Text className="text-2xl font-bold text-gray-800 mb-2">语音录入</Text>
      <Text className="text-gray-500 mb-8 text-center">点击下方按钮开始录音{'\n'}或直接输入文字</Text>

      {/* Microphone Button */}
      <View
        className={`w-32 h-32 rounded-full flex items-center justify-center mb-8 transition-all ${isRecording ? 'bg-red-500 scale-110' : 'bg-indigo-500'}`}
        onClick={startRecording}
      >
        <Text className="text-5xl">🎤</Text>
      </View>

      {isRecording && (
        <Text className="text-red-500 font-medium mb-4">正在录音...</Text>
      )}

      {/* Text Input */}
      {showInput && (
        <View className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
          <Text className="text-sm text-gray-600 mb-2">或直接输入语音识别的文本：</Text>
          <Input
            className="border border-gray-300 rounded-xl px-4 py-3 w-full mb-4"
            placeholder="例如：进10箱茅台，单价2800"
            value={textInput}
            onInput={(e) => setTextInput(e.detail.value)}
          />
          <Button
            className="bg-indigo-500 text-white rounded-xl py-3 w-full"
            onClick={handleParse}
          >
            识别并跳转
          </Button>

          {parsedResult && (
            <View className="mt-4 p-3 bg-green-50 rounded-lg">
              <Text className="text-sm text-green-700 font-medium">识别结果：</Text>
              <Text className="text-sm text-green-600">
                {parsedResult.action === 'PURCHASE' ? '采购' : '销售'} - {parsedResult.product || '未知商品'}
                {' | '}数量: {parsedResult.quantity}
                {' | '}单价: ¥{parsedResult.unitPrice}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Input Hints */}
      <View className="mt-8 text-center">
        <Text className="text-sm text-gray-400 mb-2">支持的说法：</Text>
        <Text className="text-xs text-gray-400">"进10箱茅台，单价2800"</Text>
        <Text className="text-xs text-gray-400">"出5件可乐，单价30"</Text>
      </View>
    </View>
  );
}
