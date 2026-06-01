Component({
  properties: {
    status: { type: String, value: '' },
    size: { type: String, value: 'sm' }, // sm, xs
  },
  data: {
    label: '',
    className: '',
    statusMap: {
      DRAFT: { label: '草稿', className: 'status-draft' },
      CONFIRMED: { label: '已确认', className: 'status-confirmed' },
      RECEIVED: { label: '已入库', className: 'status-received' },
      DELIVERED: { label: '已出库', className: 'status-delivered' },
      CANCELLED: { label: '已作废', className: 'status-cancelled' },
      IN_PROGRESS: { label: '进行中', className: 'status-progress' },
      COMPLETED: { label: '已完成', className: 'status-completed' },
    }
  },
  lifetimes: {
    attached() {
      this.updateStatus();
    }
  },
  observers: {
    'status': function () { this.updateStatus(); }
  },
  methods: {
    updateStatus() {
      const info = this.data.statusMap[this.data.status as keyof typeof this.data.statusMap];
      this.setData({
        label: info?.label || this.data.status,
        className: info?.className || 'status-default',
      });
    }
  }
});
