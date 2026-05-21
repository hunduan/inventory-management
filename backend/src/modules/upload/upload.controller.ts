import { Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('上传')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @ApiOperation({ summary: '上传图片并OCR识别' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File, @TenantId() tenantId: string) {
    const text = await this.uploadService.recognizeText(file.path);
    return { url: `/uploads/${file.filename}`, text };
  }

  @Post('audio')
  @ApiOperation({ summary: '上传音频并语音识别' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAudio(@UploadedFile() file: Express.Multer.File) {
    const text = await this.uploadService.speechToText(file.path);
    this.uploadService.cleanup(file.path);
    return { text };
  }
}
