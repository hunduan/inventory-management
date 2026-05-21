import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: process.env.UPLOAD_DIR || './uploads',
        filename: (req, file, cb) => {
          const ext = path.extname(file.originalname);
          cb(null, `${Date.now()}-${Math.random().toString(36).substr(2, 6)}${ext}`);
        },
      }),
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
