import { Injectable } from '@nestjs/common';
import * as fs from 'fs';

@Injectable()
export class UploadService {
  async recognizeText(imagePath: string): Promise<any> {
    // OCR placeholder - in production integrate Aliyun OCR / Baidu OCR
    return { text: 'OCR识别结果: 示例商品', items: [{ name: '示例商品', barcode: '6901234567890' }] };
  }

  async speechToText(audioPath: string): Promise<string> {
    // STT placeholder - in production integrate Aliyun/Baidu speech recognition
    return '进10箱茅台，单价2800';
  }

  async cleanup(path: string): Promise<void> {
    try {
      await fs.promises.unlink(path);
    } catch {
      // File may already be deleted; ignore
    }
  }
}
