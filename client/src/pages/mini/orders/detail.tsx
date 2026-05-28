import { useState, useEffect } from 'react';
import { View, Text } from '@tarojs/components';
import { purchasesApi } from '../../../services/purchases';
import { salesApi } from '../../../services/sales';
import Taro from '@tarojs/taro';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: '草稿', CONFIRMED: '已确认', RECEIVED: '已入库', SHIPPED: '已发货', DELIVERED: '已出库', CANCELLED: '已取消',
};
const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#78716c', CONFIRMED: '#075985', RECEIVED: '#166534', SHIPPED: '#166534', DELIVERED: '#166534', CANCELLED: '#dc2626',
};
const STATUS_BG: Record<string, string> = {
  DRAFT: '#f5f5f4', CONFIRMED: '#f0f9ff', RECEIVED: '#f0fdf4', SHIPPED: '#f0fdf4', DELIVERED: '#f0fdf4', CANCELLED: '#fef2f2',
};

export default function OrderDetailPage() {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrder = async () => {
      const routerParams = Taro.getCurrentInstance().router?.params;
      const id = routerParams?.id;
      const type = routerParams?.type;
      if (!id) {
        Taro.showToast({ title: '订单ID不存在', icon: 'none' });
        Taro.navigateBack();
        return;
      }
      try {
        let res;
        if (type === 'SALE') {
          res = await salesApi.getById(id);
          setOrder({ ...res, _type: 'SALE', _partner: res.customer?.name || res.customerName || '-' });
        } else {
          res = await purchasesApi.getById(id);
          setOrder({ ...res, _type: 'PURCHASE', _partner: res.supplier?.name || res.supplierName || '-' });
        }
      } catch {
        Taro.showToast({ title: '加载订单失败', icon: 'none' });
        Taro.navigateBack();
      } finally {
        setLoading(false);
      }
    };
    loadOrder();
  }, []);

  if (loading) {
    return (
      <View className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f5f4' }}>
        <Text className="text-sm" style={{ color: '#a8a29e' }}>加载中...</Text>
      </View>
    );
  }

  if (!order) return null;

  return (
    <View className="min-h-screen" style={{ backgroundColor: '#f5f5f4' }}>
      <View style={{ backgroundColor: '#0f766e', padding: '20px 20px 16px' }}>
        <Text className="text-lg font-bold" style={{ color: '#ffffff' }} onClick={() => Taro.navigateBack()}>
          ← 订单详情
        </Text>
      </View>

      <View className="p-4">
        {/* Order Header */}
        <View className="card p-4 mb-4">
          <View className="flex items-center justify-between mb-3" style={{ flexDirection: 'row' }}>
            <Text className="text-base font-bold" style={{ color: '#1c1917' }}>{order.orderNo || '-'}</Text>
            <View className="px-2.5 py-1 rounded" style={{ backgroundColor: STATUS_BG[order.status] || '#f5f5f4' }}>
              <Text className="text-xs font-medium" style={{ color: STATUS_COLORS[order.status] || '#78716c' }}>
                {STATUS_LABELS[order.status] || order.status}
              </Text>
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <View className="flex justify-between" style={{ flexDirection: 'row' }}>
              <Text className="text-sm" style={{ color: '#78716c' }}>{order._type === 'PURCHASE' ? '供应商' : '客户'}</Text>
              <Text className="text-sm font-medium" style={{ color: '#1c1917' }}>{order._partner}</Text>
            </View>
            {order.warehouse?.name && (
              <View className="flex justify-between" style={{ flexDirection: 'row' }}>
                <Text className="text-sm" style={{ color: '#78716c' }}>仓库</Text>
                <Text className="text-sm font-medium" style={{ color: '#1c1917' }}>{order.warehouse.name}</Text>
              </View>
            )}
            <View className="flex justify-between" style={{ flexDirection: 'row' }}>
              <Text className="text-sm" style={{ color: '#78716c' }}>创建时间</Text>
              <Text className="text-sm" style={{ color: '#1c1917' }}>{order.createdAt ? new Date(order.createdAt).toLocaleString('zh-CN') : '-'}</Text>
            </View>
          </View>
        </View>

        {/* Order Items */}
        <View className="card p-4 mb-4">
          <Text className="text-sm font-bold mb-3" style={{ color: '#1c1917' }}>商品明细</Text>
          {(order.items || []).length === 0 ? (
            <Text className="text-sm" style={{ color: '#a8a29e' }}>暂无商品明细</Text>
          ) : (
            (order.items || []).map((item: any, idx: number) => (
              <View
                key={idx}
                className="flex items-center justify-between py-3"
                style={{ flexDirection: 'row', borderBottom: idx < (order.items?.length || 0) - 1 ? '1px solid #f5f5f4' : 'none' }}
              >
                <View style={{ flex: 1 }}>
                  <Text className="text-sm font-medium" style={{ color: '#1c1917' }}>{item.product?.name || item.productName || '-'}</Text>
                  <Text className="text-xs mt-0.5" style={{ color: '#a8a29e' }}>
                    {item.quantity} x ¥{Number(item.unitCost || item.unitPrice || 0).toFixed(2)}
                  </Text>
                </View>
                <Text className="text-sm font-semibold" style={{ color: '#1c1917' }}>
                  ¥{((item.quantity || 0) * (item.unitCost || item.unitPrice || 0)).toFixed(2)}
                </Text>
              </View>
            ))
          )}
          <View className="flex items-center justify-between pt-3 mt-2" style={{ flexDirection: 'row', borderTop: '1px solid #e7e5e4' }}>
            <Text className="text-sm font-bold" style={{ color: '#1c1917' }}>合计</Text>
            <Text className="text-lg font-bold" style={{ color: '#0f766e' }}>¥{Number(order.totalAmount || 0).toFixed(2)}</Text>
          </View>
        </View>

        {/* Remark */}
        {order.remark && (
          <View className="card p-4 mb-4">
            <Text className="text-xs mb-1" style={{ color: '#a8a29e' }}>备注</Text>
            <Text className="text-sm" style={{ color: '#1c1917' }}>{order.remark}</Text>
          </View>
        )}

        {/* Actions for DRAFT orders */}
        {order.status === 'DRAFT' && (
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
            <View
              style={{ flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: '#0f766e' }}
              onClick={async () => {
                try {
                  if (order._type === 'PURCHASE') await purchasesApi.receive(order.id);
                  else await salesApi.deliver(order.id);
                  Taro.showToast({ title: '操作成功', icon: 'success' });
                  Taro.navigateBack();
                } catch (err: any) {
                  Taro.showToast({ title: err.message || '操作失败', icon: 'none' });
                }
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: 600, color: '#ffffff' }}>
                {order._type === 'PURCHASE' ? '确认入库' : '确认出库'}
              </Text>
            </View>
            <View
              style={{ flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', border: '1px solid #fecaca', backgroundColor: '#fef2f2' }}
              onClick={async () => {
                Taro.showModal({
                  title: '确认取消',
                  content: '确定要取消此订单吗？',
                  success: async (res) => {
                    if (res.confirm) {
                      try {
                        if (order._type === 'PURCHASE') await purchasesApi.cancel(order.id);
                        else await salesApi.cancel(order.id);
                        Taro.showToast({ title: '已取消', icon: 'success' });
                        Taro.navigateBack();
                      } catch (err: any) {
                        Taro.showToast({ title: err.message || '操作失败', icon: 'none' });
                      }
                    }
                  },
                });
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: 600, color: '#dc2626' }}>取消订单</Text>
            </View>
          </View>
        )}

        {/* Back */}
        <View
          className="w-full py-3 flex items-center justify-center rounded cursor-pointer"
          style={{ border: '1px solid #e7e5e4' }}
          onClick={() => Taro.navigateBack()}
        >
          <Text className="text-sm" style={{ color: '#57534e' }}>返回</Text>
        </View>
      </View>
    </View>
  );
}
