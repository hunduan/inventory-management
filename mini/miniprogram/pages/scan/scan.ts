import productsApi from '../../services/products';

Page({
  data: {
    result: null as any,
    errorMsg: '',
  },

  onLoad() {
    this.startScan();
  },

  async startScan() {
    this.setData({ result: null, errorMsg: '' });
    try {
      const res = await wx.scanCode({ onlyFromCamera: false });
      const barcode = res.result;
      if (!barcode) {
        this.setData({ errorMsg: '未能识别条形码' });
        return;
      }
      const product = await productsApi.getByBarcode(barcode);
      if (product) {
        this.setData({ result: product });
      } else {
        this.setData({ errorMsg: `未找到条形码为 "${barcode}" 的商品` });
      }
    } catch (err: any) {
      if (err.errMsg?.includes('cancel')) {
        this.setData({ errorMsg: '已取消扫码' });
      } else {
        this.setData({ errorMsg: err.message || '扫码失败' });
      }
    }
  },

  onScan() {
    this.startScan();
  },

  onScanAgain() {
    this.startScan();
  },
});
