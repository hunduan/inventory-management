import { Controller, Post, UploadedFile, UseGuards, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

@ApiTags('上传')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @ApiOperation({ summary: '上传图片并OCR识别' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: join(process.cwd(), 'uploads'),
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + extname(file.originalname));
      },
    }),
    fileFilter: (req, file, cb) => {
      if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        cb(new BadRequestException('不支持的图片格式，仅支持 JPEG/PNG/GIF/WebP'), false);
      } else {
        cb(null, true);
      }
    },
    limits: { fileSize: MAX_FILE_SIZE },
  }))
  async uploadImage(@UploadedFile() file: Express.Multer.File, @TenantId() tenantId: string) {
    if (!file) throw new BadRequestException('请上传图片文件');
    const text = await this.uploadService.recognizeText(file.path);
    return { url: `/uploads/${file.filename}`, text };
  }

  @Post('audio')
  @ApiOperation({ summary: '上传音频并语音识别' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: join(process.cwd(), 'uploads'),
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + extname(file.originalname));
      },
    }),
    fileFilter: (req, file, cb) => {
      if (!ALLOWED_AUDIO_TYPES.includes(file.mimetype)) {
        cb(new BadRequestException('不支持的音频格式，仅支持 MP3/WAV/OGG/M4A'), false);
      } else {
        cb(null, true);
      }
    },
    limits: { fileSize: MAX_FILE_SIZE },
  }))
  async uploadAudio(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('请上传音频文件');
    const text = await this.uploadService.speechToText(file.path);
    this.uploadService.cleanup(file.path);
    return { text };
  }
}
