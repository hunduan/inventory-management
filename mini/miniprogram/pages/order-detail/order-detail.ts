import purchasesApi from '../../services/purchases';
import salesApi from '../../services/sales';

Page({
  data: {
    loading: true,
    error: '',
    order: null as any,
    orderType: 'PURCHASE',
    orderId: '',
    actionLoading: '',
    actions: [] as { action: string; label: string; type: string }[],
  },

  onLoad(options: any) {
    const { id, type } = options;
    this.setData({ orderId: id, orderType: type || 'PURCHASE' });
    this.loadOrder();
  },

  async loadOrder() {
    this.setData({ loading: true, error: '' });
    try {
      const api = this.data.orderType === 'PURCHASE' ? purchasesApi : salesApi;
      const order = await api.getById(this.data.orderId);
      const actions = this.computeActions(order.status);
      this.setData({ order, actions, itemsCount: (order.items || []).length });
    } catch (err: any) {
      this.setData({ error: err.message || '加载订单失败' });
    } finally {
      this.setData({ loading: false });
    }
  },

  computeActions(status: string): { action: string; label: string; type: string }[] {
    const type = this.data.orderType;
    if (type === 'PURCHASE') {
      if (status === 'DRAFT') {
        return [
          { action: 'edit', label: '编辑', type: 'secondary' },
          { action: 'confirm', label: '确认', type: 'primary' },
          { action: 'cancel', label: '作废', type: 'danger' },
        ];
      }
      if (status === 'CONFIRMED') {
        return [
          { action: 'receive', label: '全部入库', type: 'primary' },
          { action: 'cancel', label: '作废', type: 'danger' },
        ];
      }
    } else {
      if (status === 'DRAFT') {
        return [
          { action: 'edit', label: '编辑', type: 'secondary' },
          { action: 'confirm', label: '确认', type: 'primary' },
          { action: 'cancel', label: '作废', type: 'danger' },
        ];
      }
      if (status === 'CONFIRMED') {
        return [
          { action: 'deliver', label: '全部出库', type: 'primary' },
          { action: 'cancel', label: '作废', type: 'danger' },
        ];
      }
    }
    return [];
  },

  async handleAction(e: WechatMiniprogram.TouchEvent) {
    const action = e.currentTarget.dataset.action;
    const { orderId, orderType } = this.data;

    // Edit action: navigate to edit page
    if (action === 'edit') {
      const url = orderType === 'PURCHASE'
        ? `/pages/purchase/purchase?id=${orderId}`
        : `/pages/sale/sale?id=${orderId}`;
      wx.navigateTo({ url });
      return;
    }

    this.setData({ actionLoading: action });

    const confirmText = action === 'cancel' ? '确定要作废此订单吗？' : '确定执行此操作吗？';
    const res = await wx.showModal({ title: '确认操作', content: confirmText });
    if (!res.confirm) {
      this.setData({ actionLoading: '' });
      return;
    }

    try {
      const api = orderType === 'PURCHASE' ? purchasesApi : salesApi;
      const actionMap: Record<string, Function> = {
        confirm: () => api.confirm(orderId),
        receive: () => api.receive(orderId),
        deliver: () => api.deliver(orderId),
        cancel: () => api.cancel(orderId),
      };
      await actionMap[action]();
      wx.showToast({ title: '操作成功', icon: 'success' });
      this.loadOrder();
    } catch (err: any) {
      wx.showToast({ title: err.message || '操作失败', icon: 'none' });
    } finally {
      this.setData({ actionLoading: '' });
    }
  },

  onItemQtyInput(e: WechatMiniprogram.Input) {
    const { index } = e.currentTarget.dataset;
    const items = [...(this.data.order?.items || [])];
    if (items[index]) {
      items[index]._qty = parseFloat(e.detail.value) || 0;
      this.setData({ 'order.items': items });
    }
  },

  async onItemAction(e: WechatMiniprogram.TouchEvent) {
    const { id: itemId, index } = e.currentTarget.dataset;
    const { orderId, orderType, order } = this.data;
    const qty = order.items[index]?._qty || (order.items[index]?.quantity - (order.items[index]?.receivedQty || order.items[index]?.deliveredQty || 0));
    if (!qty || qty <= 0) {
      wx.showToast({ title: '请输入有效数量', icon: 'none' });
      return;
    }
    this.setData({ actionLoading: 'item-' + index });
    try {
      if (orderType === 'PURCHASE') {
        await purchasesApi.receiveItem(orderId, itemId, qty);
      } else {
        await salesApi.deliverItem(orderId, itemId, qty);
      }
      wx.showToast({ title: '操作成功', icon: 'success' });
      this.loadOrder();
    } catch (err: any) {
      wx.showToast({ title: err.message || '操作失败', icon: 'none' });
    } finally {
      this.setData({ actionLoading: '' });
    }
  },
});
