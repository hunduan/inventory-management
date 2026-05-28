import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';

export default function MiniIndexPage() {
  const goto = (url: string) => Taro.navigateTo({ url });

  const today = new Date();
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const STATUS_TAG: Record<string, { label: string; bg: string; text: string }> = {
    DRAFT: { label: '草稿', bg: '#f5f5f4', text: '#78716c' },
    RECEIVED: { label: '已入库', bg: '#f0fdf4', text: '#166534' },
    DELIVERED: { label: '已出库', bg: '#f0fdf4', text: '#166534' },
    CANCELLED: { label: '已取消', bg: '#fef2f2', text: '#dc2626' },
  };

  return (
    <ScrollView scrollY style={{ backgroundColor: '#f5f5f4', minHeight: '100vh' }}>
      {/* Header */}
      <View style={{
        background: 'linear-gradient(135deg, #0f766e 0%, #0d3d3a 100%)',
        padding: '48px 16px 20px',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
      }}>
        <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 2 }}>
          {today.getFullYear()}年{today.getMonth() + 1}月{today.getDate()}日 星期{weekDays[today.getDay()]}
        </Text>
        <Text style={{ fontSize: 22, fontWeight: 700, color: '#ffffff' }}>
          库存管理
        </Text>
      </View>

      {/* 今日操作 */}
      <View style={{ paddingLeft: 12, paddingRight: 12, marginTop: 16, marginBottom: 16 }}>
        <Text style={{ fontSize: 14, fontWeight: 600, color: '#1c1917', marginBottom: 10, marginLeft: 4 }}>今日操作</Text>
        <View className="flex-row" style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: '12px 8px' }}>
          {[
            { label: '采购', icon: '📥', path: '/pages/mini/purchase/index', bg: '#f0fdfa' },
            { label: '销售', icon: '📤', path: '/pages/mini/sale/index', bg: '#fffbeb' },
            { label: '库存', icon: '📊', path: '/pages/mini/inventory/index', bg: '#f0f9ff' },
            { label: '调拨', icon: '🔄', path: '/pages/mini/transfers/index', bg: '#f5f3ff' },
          ].map((item, idx) => (
            <View
              key={item.path}
              style={{ flex: 1, alignItems: 'center', paddingTop: 6, paddingBottom: 6, marginLeft: idx > 0 ? 4 : 0 }}
              onClick={() => goto(item.path)}
            >
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: item.bg, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                <Text style={{ fontSize: 16 }}>{item.icon}</Text>
              </View>
              <Text style={{ fontSize: 11, fontWeight: 600, color: '#1c1917' }}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 快速访问 */}
      <View style={{ paddingLeft: 12, paddingRight: 12, marginBottom: 16 }}>
        <Text style={{ fontSize: 14, fontWeight: 600, color: '#1c1917', marginBottom: 10, marginLeft: 4 }}>快速访问</Text>
        <View className="flex-row" style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: '12px 8px' }}>
          {[
            { label: '扫码', icon: '📱', path: '/pages/mini/scan/index', bg: '#f0fdfa' },
            { label: '语音', icon: '🎤', path: '/pages/mini/voice/index', bg: '#fffbeb' },
            { label: '拍照', icon: '📷', path: '/pages/mini/photo/index', bg: '#f0f9ff' },
            { label: '商品', icon: '🏷️', path: '/pages/mini/products/index', bg: '#f5f3ff' },
            { label: '订单', icon: '📋', path: '/pages/mini/orders/list', bg: '#fef2f2' },
          ].map((item, idx) => (
            <View
              key={item.path}
              style={{ flex: 1, alignItems: 'center', paddingTop: 6, paddingBottom: 6, marginLeft: idx > 0 ? 4 : 0 }}
              onClick={() => goto(item.path)}
            >
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: item.bg, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                <Text style={{ fontSize: 16 }}>{item.icon}</Text>
              </View>
              <Text style={{ fontSize: 11, color: '#78716c' }}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
