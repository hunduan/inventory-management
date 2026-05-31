Component({
  properties: {
    status: {
      type: String,
      value: '',
    },
    size: {
      type: String,
      value: 'default',
    },
  },
  data: {
    text: '',
    color: '#78716c',
    bgColor: '#f5f5f4',
  },
  observers: {
    'status': function (status: string) {
      const map: Record<string, { text: string; color: string; bgColor: string }> = {
        'DRAFT': { text: '草稿', color: '#78716c', bgColor: '#f5f5f4' },
        'CONFIRMED': { text: '已确认', color: '#1677ff', bgColor: '#e6f4ff' },
        'RECEIVED': { text: '已入库', color: '#52c41a', bgColor: '#f0fdf4' },
        'DELIVERED': { text: '已出库', color: '#52c41a', bgColor: '#f0fdf4' },
        'IN_PROGRESS': { text: '进行中', color: '#fa8c16', bgColor: '#fff7e6' },
        'COMPLETED': { text: '已完成', color: '#52c41a', bgColor: '#f0fdf4' },
        'CANCELLED': { text: '已作废', color: '#ff4d4f', bgColor: '#fff2f0' },
      };
      const config = map[status] || { text: status, color: '#78716c', bgColor: '#f5f5f4' };
      this.setData({
        text: config.text,
        color: config.color,
        bgColor: config.bgColor,
      });
    },
  },
});
