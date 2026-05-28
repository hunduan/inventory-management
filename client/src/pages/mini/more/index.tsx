import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';

const TOOLS = [
  { label: '商品管理', icon: '🏷️', path: '/pages/mini/products/index', bg: '#f0fdfa', desc: '查看和管理商品' },
  { label: '订单查询', icon: '📋', path: '/pages/mini/orders/list', bg: '#fef2f2', desc: '采购/销售订单' },
  { label: '库存调拨', icon: '🔄', path: '/pages/mini/transfers/index', bg: '#f5f3ff', desc: '仓库间调拨' },
  { label: '库存盘点', icon: '📝', path: '/pages/mini/stocktake/index', bg: '#fffbeb', desc: '盘点库存数量' },
  { label: '扫码识别', icon: '📱', path: '/pages/mini/scan/index', bg: '#f0fdfa', desc: '扫描条码' },
  { label: '语音录入', icon: '🎤', path: '/pages/mini/voice/index', bg: '#fffbeb', desc: '语音建单' },
  { label: '拍照识别', icon: '📷', path: '/pages/mini/photo/index', bg: '#f0f9ff', desc: 'OCR识别商品' },
  { label: '供应商', icon: '🏭', path: '/pages/web/suppliers/index', bg: '#f5f5f4', desc: '供应商管理' },
  { label: '客户', icon: '👥', path: '/pages/web/customers/index', bg: '#f5f5f4', desc: '客户管理' },
];

export default function MorePage() {
  const goto = (url: string) => Taro.navigateTo({ url });

  return (
    <View style={{ backgroundColor: '#f5f5f4', minHeight: '100vh' }}>
      <View style={{
        background: 'linear-gradient(135deg, #0f766e 0%, #0d3d3a 100%)',
        padding: '52px 20px 20px',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
      }}>
        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 2 }}>全部工具</Text>
        <Text style={{ fontSize: 22, fontWeight: 700, color: '#ffffff' }}>更多功能</Text>
      </View>

      <ScrollView scrollY style={{ flex: 1, padding: 16 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {TOOLS.map((tool) => (
            <View
              key={tool.path}
              style={{
                width: '48%',
                backgroundColor: '#ffffff',
                borderRadius: 16,
                padding: 20,
                boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
              }}
              onClick={() => goto(tool.path)}
            >
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: tool.bg, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <Text style={{ fontSize: 20 }}>{tool.icon}</Text>
              </View>
              <Text style={{ fontSize: 14, fontWeight: 600, color: '#1c1917', marginBottom: 2 }}>{tool.label}</Text>
              <Text style={{ fontSize: 11, color: '#a8a29e' }}>{tool.desc}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
