import purchasesApi from '../../services/purchases';
import salesApi from '../../services/sales';
import { parseVoiceInput, ParsedOrder } from '../../utils/voice-parser';

Page({
  data: {
    isRecording: false,
    recognizedText: '',
    parsedResult: null as ParsedOrder | null,
    errorMsg: '',
  },

  recorderManager: null as any,

  onLoad() {
    this.recorderManager = wx.getRecorderManager();
    this.recorderManager.onStop((res) => this.onRecordStop(res));
    this.recorderManager.onError(() => {
      this.setData({ isRecording: false, errorMsg: '录音失败，请检查麦克风权限' });
    });
  },

  async onToggleRecord() {
    if (this.data.isRecording) {
      this.stopRecord();
    } else {
      await this.startRecord();
    }
  },

  async startRecord() {
    this.setData({ errorMsg: '', recognizedText: '', parsedResult: null });
    try {
      const auth = await wx.authorize({ scope: 'scope.record' }).catch(() => null);
      if (!auth) {
        this.setData({ errorMsg: '需要麦克风权限才能录音' });
        return;
      }
      this.recorderManager.start({ format: 'mp3', sampleRate: 16000, numberOfChannels: 1, encodeBitRate: 48000 });
      this.setData({ isRecording: true });
    } catch {
      this.setData({ errorMsg: '启动录音失败' });
    }
  },

  stopRecord() {
    this.recorderManager.stop();
    this.setData({ isRecording: false });
  },

  onRecordStop(res: any) {
    const mockText = this.getMockRecognitionText();
    this.setData({ recognizedText: mockText });
    if (mockText) {
      const parsed = parseVoiceInput(mockText);
      if (parsed && parsed.items.length > 0) {
        this.setData({ parsedResult: parsed, errorMsg: '' });
      } else {
        this.setData({ errorMsg: '未能识别出商品信息，请重试' });
      }
    }
  },

  getMockRecognitionText(): string {
    return '';
  },

  async onCreateOrder() {
    const parsed = this.data.parsedResult;
    if (!parsed || parsed.items.length === 0) {
      wx.showToast({ title: '没有可创建的商品', icon: 'none' });
      return;
    }
    try {
      if (parsed.type === 'PURCHASE') {
        await purchasesApi.create({
          supplierName: parsed.supplierName,
          items: parsed.items.map(i => ({ productName: i.productName, quantity: i.quantity })),
        });
      } else {
        await salesApi.create({
          customerName: parsed.customerName,
          items: parsed.items.map(i => ({ productName: i.productName, quantity: i.quantity })),
        });
      }
      wx.showToast({ title: '创建成功', icon: 'success' });
      this.setData({ recognizedText: '', parsedResult: null });
    } catch (err: any) {
      wx.showToast({ title: err.message || '创建失败', icon: 'none' });
    }
  },

  onClear() {
    this.setData({ recognizedText: '', parsedResult: null, errorMsg: '' });
  },
});
